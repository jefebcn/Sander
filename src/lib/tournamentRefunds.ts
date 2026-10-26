import { db } from "@/lib/db"
import { stripe } from "@/lib/stripe"

/* ────────────────────────────────────────────────────────────────────────── */
/*  Before a tournament is deleted: no open card checkout may still take       */
/*  money, and every card payment goes back to whoever paid. INTERNAL only     */
/*  (not a "use server" file), called by the admin's deleteTournament.         */
/* ────────────────────────────────────────────────────────────────────────── */

export async function settleStripeBeforeDelete(tournamentId: string): Promise<{ refunded: number }> {
  const regs = await db.tournamentRegistration.findMany({
    where: { tournamentId, OR: [{ stripeSessionId: { not: null } }, { stripePaymentIntentId: { not: null } }] },
    select: { id: true, paymentStatus: true, stripeSessionId: true, stripePaymentIntentId: true },
  })
  if (regs.length === 0) return { refunded: 0 }

  let refunded = 0
  const failed: string[] = []
  for (const reg of regs) {
    try {
      let paymentIntent = reg.paymentStatus === "PAID" ? reg.stripePaymentIntentId : null
      if (!paymentIntent && reg.stripeSessionId) {
        const session = await stripe.checkout.sessions.retrieve(reg.stripeSessionId)
        if (session.status === "open") await stripe.checkout.sessions.expire(reg.stripeSessionId).catch(() => {})
        // Paid in the meantime (the webhook may not have landed yet).
        if (session.payment_status === "paid") {
          paymentIntent = typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id ?? null
        }
      }
      if (paymentIntent) {
        // The key makes a retried delete refund once, never twice.
        await stripe.refunds.create(
          { payment_intent: paymentIntent, reason: "requested_by_customer", metadata: { tournamentId, registrationId: reg.id } },
          { idempotencyKey: `tournament-delete-${reg.id}` },
        )
        refunded++
      }
    } catch (e) {
      // Already fully refunded counts as done.
      if (e && typeof e === "object" && "code" in e && e.code === "charge_already_refunded") continue
      console.error("[tournament delete] Stripe settle failed", reg.id, e)
      failed.push(reg.id)
    }
  }
  if (failed.length > 0) {
    throw new Error(`Rimborso con carta non riuscito per ${failed.length} iscritti: il torneo non è stato eliminato. Riprova tra poco.`)
  }
  return { refunded }
}
