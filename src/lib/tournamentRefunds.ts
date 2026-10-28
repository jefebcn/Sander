import { db } from "@/lib/db"
import { stripe } from "@/lib/stripe"

/* ────────────────────────────────────────────────────────────────────────── */
/*  Before a registration (or a whole tournament) goes away: no open card      */
/*  checkout may still take money, and every card payment goes back to whoever */
/*  paid. INTERNAL only (not a "use server" file), called by admin actions.    */
/* ────────────────────────────────────────────────────────────────────────── */

type StripeRegistration = {
  id: string
  paymentStatus: string
  stripeSessionId: string | null
  stripePaymentIntentId: string | null
}

const REG_SELECT = { id: true, paymentStatus: true, stripeSessionId: true, stripePaymentIntentId: true } as const

/**
 * Close the registration's checkout and refund its card payment, if any.
 * Returns true when a refund was issued; throws when Stripe can't confirm.
 */
async function settleOne(reg: StripeRegistration, metadata: Record<string, string>): Promise<boolean> {
  let paymentIntent = reg.paymentStatus === "PAID" ? reg.stripePaymentIntentId : null
  if (!paymentIntent && reg.stripeSessionId) {
    const session = await stripe.checkout.sessions.retrieve(reg.stripeSessionId)
    if (session.status === "open") await stripe.checkout.sessions.expire(reg.stripeSessionId).catch(() => {})
    // Paid in the meantime (the webhook may not have landed yet).
    if (session.payment_status === "paid") {
      paymentIntent = typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id ?? null
    }
  }
  if (!paymentIntent) return false
  try {
    // The key makes a retried action refund once, never twice.
    await stripe.refunds.create(
      { payment_intent: paymentIntent, reason: "requested_by_customer", metadata: { ...metadata, registrationId: reg.id } },
      { idempotencyKey: `registration-refund-${reg.id}` },
    )
  } catch (e) {
    // Already fully refunded counts as done.
    if (e && typeof e === "object" && "code" in e && e.code === "charge_already_refunded") return false
    throw e
  }
  return true
}

/** One registration an admin rejects or removes. Throws if Stripe can't settle it. */
export async function settleStripeRegistration(registrationId: string): Promise<{ refunded: boolean }> {
  const reg = await db.tournamentRegistration.findUnique({ where: { id: registrationId }, select: REG_SELECT })
  if (!reg || (!reg.stripeSessionId && !reg.stripePaymentIntentId)) return { refunded: false }
  try {
    return { refunded: await settleOne(reg, { reason: "admin_removed" }) }
  } catch (e) {
    console.error("[registration] Stripe settle failed", registrationId, e)
    throw new Error("Rimborso con carta non riuscito: l'iscrizione non è stata modificata. Riprova tra poco.")
  }
}

export async function settleStripeBeforeDelete(tournamentId: string): Promise<{ refunded: number }> {
  const regs = await db.tournamentRegistration.findMany({
    where: { tournamentId, OR: [{ stripeSessionId: { not: null } }, { stripePaymentIntentId: { not: null } }] },
    select: REG_SELECT,
  })
  let refunded = 0
  const failed: string[] = []
  for (const reg of regs) {
    try {
      if (await settleOne(reg, { reason: "tournament_deleted", tournamentId })) refunded++
    } catch (e) {
      console.error("[tournament delete] Stripe settle failed", reg.id, e)
      failed.push(reg.id)
    }
  }
  if (failed.length > 0) {
    throw new Error(`Rimborso con carta non riuscito per ${failed.length} iscritti: il torneo non è stato eliminato. Riprova tra poco.`)
  }
  return { refunded }
}
