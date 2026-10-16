import { NextRequest } from "next/server"
import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { stripe } from "@/lib/stripe"
import { grantStripeTopUp, revokeStripeTopUp } from "@/lib/creditTopUp"
import type Stripe from "stripe"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// Prisma error code for unique constraint violation
const P2002 = "P2002"

function isPrismaUniqueViolation(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code: unknown }).code === P2002
  )
}

export async function POST(req: NextRequest) {
  const signature = req.headers.get("stripe-signature")
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!signature) return new Response("Missing signature", { status: 400 })
  if (!webhookSecret) {
    console.error("[stripe webhook] STRIPE_WEBHOOK_SECRET not configured")
    return new Response("Webhook secret not configured", { status: 500 })
  }

  const rawBody = await req.text()

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret)
  } catch (err) {
    console.error("[stripe webhook] Signature verification failed", err)
    return new Response("Invalid signature", { status: 400 })
  }

  // ── Idempotency layer 1: record event.id
  try {
    await db.stripeWebhookEvent.create({
      data: {
        id: event.id,
        type: event.type,
        payload: event as unknown as object,
      },
    })
  } catch (err) {
    if (isPrismaUniqueViolation(err)) {
      // Already processed — return 200 so Stripe stops retrying
      return new Response(null, { status: 200 })
    }
    // Any other DB error → 500 (Stripe will retry)
    console.error("[stripe webhook] DB error storing event", err)
    return new Response("DB error", { status: 500 })
  }

  try {
    switch (event.type) {
      // Bank transfers and other delayed methods complete here, not on
      // checkout.session.completed (whose payment_status is then "unpaid").
      case "checkout.session.async_payment_succeeded":
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session

        // SanderCredits pack bought in the app.
        if (session.metadata?.kind === "sc_topup") {
          if (session.payment_status !== "paid") break
          const result = await grantStripeTopUp({
            stripeSessionId: session.id,
            playerId: session.metadata.playerId ?? "",
            packId: session.metadata.packId ?? "",
            amountCents: session.amount_total ?? null,
          })
          if (result === "invalid") {
                    console.error("[stripe webhook] sc_topup with invalid metadata", session.id)
          }
          revalidatePath("/profile")
          revalidatePath("/admin/metriche")
          break
        }

        const registrationId = session.metadata?.registrationId
        const tournamentId   = session.metadata?.tournamentId

        if (!registrationId) {
                console.error("[stripe webhook] checkout.session.completed missing registrationId")
          return new Response(null, { status: 200 })
        }

        // ── Idempotency layer 2: conditional updateMany (no-op if already PAID)
        await db.tournamentRegistration.updateMany({
          where: { id: registrationId, paymentStatus: "PENDING" },
          data: {
            paymentStatus: "PAID",
            paidAt: new Date(),
            amountPaidCents: session.amount_total ?? null,
            stripePaymentIntentId: (session.payment_intent as string | null) ?? null,
          },
        })

        if (tournamentId) {
          revalidatePath("/tournaments")
          revalidatePath(`/tournaments/${tournamentId}`)
          revalidatePath(`/tournaments/${tournamentId}/register/success`)
        }
        break
      }

      case "checkout.session.expired": {
        const session = event.data.object as Stripe.Checkout.Session
        const registrationId = session.metadata?.registrationId
        if (registrationId) {
          // Free the unique (tournamentId, playerId) slot
          await db.tournamentRegistration.deleteMany({
            where: { id: registrationId, paymentStatus: "PENDING" },
          })
        }
        break
      }

      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge
        const paymentIntentId = typeof charge.payment_intent === "string"
          ? charge.payment_intent
          : charge.payment_intent?.id
        if (paymentIntentId) {
          await db.tournamentRegistration.updateMany({
            where: { stripePaymentIntentId: paymentIntentId, paymentStatus: "PAID" },
            data: { paymentStatus: "REFUNDED" },
          })
          // A refunded SanderCredits pack: take the credits back. Only full
          // refunds; a partial refund is a manual decision for the admin.
          if (charge.refunded) {
            const sessions = await stripe.checkout.sessions.list({ payment_intent: paymentIntentId, limit: 1 })
            const s = sessions.data[0]
            if (s?.metadata?.kind === "sc_topup") {
              await revokeStripeTopUp(s.id)
              revalidatePath("/profile")
              revalidatePath("/admin/metriche")
            }
          }
        }
        break
      }

      default:
        // Ignore other event types
        break
    }

    return new Response(null, { status: 200 })
  } catch (err) {
    console.error("[stripe webhook] handler error", err)
    // Forget the event so Stripe's retry is processed again instead of being
    // skipped as a duplicate. Every effect above is idempotent on its own
    // (unique stripeSessionId, conditional updates), so a re-run is safe.
    await db.stripeWebhookEvent.delete({ where: { id: event.id } }).catch(() => {})
    // Returning 500 lets Stripe retry the delivery
    return new Response("Handler error", { status: 500 })
  }
}
