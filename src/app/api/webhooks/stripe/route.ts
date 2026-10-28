import { NextRequest } from "next/server"
import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { stripe } from "@/lib/stripe"
import { grantStripeTopUp, revokeStripeTopUp } from "@/lib/creditTopUp"
import { syncPlusFromSubscription, invoiceSubscriptionId } from "@/lib/scopri/plus"
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

/** A refunded or disputed payment: the registration is no longer paid, a
 *  SanderCredits pack is taken back. Both steps are idempotent. */
async function undoPayment(paymentIntentId: string) {
  await db.tournamentRegistration.updateMany({
    where: { stripePaymentIntentId: paymentIntentId, paymentStatus: "PAID" },
    data: { paymentStatus: "REFUNDED" },
  })
  const sessions = await stripe.checkout.sessions.list({ payment_intent: paymentIntentId, limit: 1 })
  const s = sessions.data[0]
  if (s?.metadata?.kind === "sc_topup") {
    await revokeStripeTopUp(s.id)
    revalidatePath("/profile")
    revalidatePath("/admin/metriche")
  }
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

  // ── Idempotency layer 1: record event.id. A row whose processedAt is set
  // was fully handled; one without was cut off mid-way and is handled again
  // (every effect below is idempotent on its own).
  try {
    await db.stripeWebhookEvent.create({
      data: {
        id: event.id,
        type: event.type,
        payload: event as unknown as object,
        processedAt: null,
      },
    })
  } catch (err) {
    if (!isPrismaUniqueViolation(err)) {
      // Any other DB error → 500 (Stripe will retry)
      console.error("[stripe webhook] DB error storing event", err)
      return new Response("DB error", { status: 500 })
    }
    const seen = await db.stripeWebhookEvent.findUnique({ where: { id: event.id }, select: { processedAt: true } })
    // Already processed — return 200 so Stripe stops retrying
    if (seen?.processedAt) return new Response(null, { status: 200 })
  }

  try {
    switch (event.type) {
      // Bank transfers and other delayed methods complete here, not on
      // checkout.session.completed (whose payment_status is then "unpaid").
      case "checkout.session.async_payment_succeeded":
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session

        // SANDER+ subscription started.
        if (session.metadata?.kind === "plus") {
          const subId = typeof session.subscription === "string" ? session.subscription : session.subscription?.id
          if (subId) await syncPlusFromSubscription(await stripe.subscriptions.retrieve(subId))
          revalidatePath("/scopri")
          break
        }

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

        // Checkout finished but the money hasn't arrived (bank transfer, SEPA):
        // the row stays PENDING until async_payment_succeeded.
        if (session.payment_status === "unpaid") break

        if (!registrationId) {
                console.error("[stripe webhook] checkout.session.completed missing registrationId")
          return new Response(null, { status: 200 })
        }

        // ── Idempotency layer 2: conditional updateMany (no-op if already PAID)
        const marked = await db.tournamentRegistration.updateMany({
          where: { id: registrationId, paymentStatus: "PENDING" },
          data: {
            paymentStatus: "PAID",
            paidAt: new Date(),
            amountPaidCents: session.amount_total ?? null,
            stripePaymentIntentId: (session.payment_intent as string | null) ?? null,
          },
        })
        if (marked.count === 0) {
          const existing = await db.tournamentRegistration.findUnique({ where: { id: registrationId }, select: { paymentStatus: true } })
          if (!existing) console.error("[stripe webhook] paid checkout without registration (orphan payment)", session.id, registrationId)
        }

        if (tournamentId) {
          revalidatePath("/tournaments")
          revalidatePath(`/tournaments/${tournamentId}`)
          revalidatePath(`/tournaments/${tournamentId}/register/success`)
        }
        break
      }

      // A delayed payment that never arrived frees the seat like an expiry.
      case "checkout.session.async_payment_failed":
      case "checkout.session.expired": {
        const session = event.data.object as Stripe.Checkout.Session
        const registrationId = session.metadata?.registrationId
        if (registrationId) {
          // Free the unique (tournamentId, playerId) slot
          // Only the row this checkout belongs to: a newer attempt for the same
          // registration has its own session and must survive.
          await db.tournamentRegistration.deleteMany({
            where: { id: registrationId, paymentStatus: "PENDING", stripeSessionId: session.id },
          })
        }
        break
      }

      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge
        const paymentIntentId = typeof charge.payment_intent === "string"
          ? charge.payment_intent
          : charge.payment_intent?.id
        // Only full refunds undo anything: a partial one (e.g. just the fee) is
        // a manual decision for the admin and must not cost the player a seat.
        if (paymentIntentId && charge.refunded) await undoPayment(paymentIntentId)
        break
      }

      // A chargeback: the bank takes the money back as soon as it opens, so
      // the seat or the credits go with it. A dispute later won is restored
      // by hand from the admin (it is rare and needs a look anyway).
      case "charge.dispute.created": {
        const dispute = event.data.object as Stripe.Dispute
        const paymentIntentId = typeof dispute.payment_intent === "string"
          ? dispute.payment_intent
          : dispute.payment_intent?.id
        if (paymentIntentId) await undoPayment(paymentIntentId)
        console.error("[stripe webhook] dispute opened", dispute.id, paymentIntentId)
        break
      }

      // SANDER+: renewals, cancellations, failed payments.
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription
        // Events can arrive out of order: sync from Stripe's current copy, not
        // the payload, so a late "updated" can't revive a deleted subscription.
        if (sub.metadata?.kind === "plus") await syncPlusFromSubscription(await stripe.subscriptions.retrieve(sub.id))
        break
      }

      case "invoice.paid": {
        const subId = invoiceSubscriptionId(event.data.object as Stripe.Invoice)
        if (subId) {
          const sub = await stripe.subscriptions.retrieve(subId)
          if (sub.metadata?.kind === "plus") await syncPlusFromSubscription(sub)
        }
        break
      }

      default:
        // Ignore other event types
        break
    }

    await db.stripeWebhookEvent.update({ where: { id: event.id }, data: { processedAt: new Date() } })
    return new Response(null, { status: 200 })
  } catch (err) {
    console.error("[stripe webhook] handler error", err)
    // processedAt stays null, so Stripe's retry is processed again instead of
    // being skipped as a duplicate. Returning 500 lets Stripe retry.
    return new Response("Handler error", { status: 500 })
  }
}
