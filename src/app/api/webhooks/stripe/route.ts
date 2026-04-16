import { NextRequest } from "next/server"
import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { stripe } from "@/lib/stripe"
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
    // eslint-disable-next-line no-console
    console.error("[stripe webhook] STRIPE_WEBHOOK_SECRET not configured")
    return new Response("Webhook secret not configured", { status: 500 })
  }

  const rawBody = await req.text()

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret)
  } catch (err) {
    // eslint-disable-next-line no-console
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
    // eslint-disable-next-line no-console
    console.error("[stripe webhook] DB error storing event", err)
    return new Response("DB error", { status: 500 })
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session
        const registrationId = session.metadata?.registrationId
        const tournamentId   = session.metadata?.tournamentId

        if (!registrationId) {
          // eslint-disable-next-line no-console
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
        }
        break
      }

      default:
        // Ignore other event types
        break
    }

    return new Response(null, { status: 200 })
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[stripe webhook] handler error", err)
    // Returning 500 lets Stripe retry the delivery
    return new Response("Handler error", { status: 500 })
  }
}
