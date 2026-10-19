import type Stripe from "stripe"
import { db } from "@/lib/db"
import { stripe } from "@/lib/stripe"

/* ────────────────────────────────────────────────────────────────────────── */
/*  SANDER+ (Stripe subscription). The source of truth is Stripe: the webhook  */
/*  copies the paid-until date onto DiscoverProfile.plusUntil, and a stale     */
/*  date is re-checked against Stripe on demand, so a missed webhook never    */
/*  takes away what someone paid for. Not a "use server" file.               */
/* ────────────────────────────────────────────────────────────────────────── */

export { PLUS_BENEFITS } from "./plusBenefits"

/** Paid-until of a subscription (moved onto the items in recent Stripe APIs). */
export function subscriptionPeriodEnd(sub: Stripe.Subscription): Date | null {
  const fromItems = sub.items?.data?.map((i) => i.current_period_end).filter((n): n is number => typeof n === "number")
  const legacy = (sub as unknown as { current_period_end?: number }).current_period_end
  const end = fromItems?.length ? Math.max(...fromItems) : legacy
  return end ? new Date(end * 1000) : null
}

const ACTIVE = new Set<Stripe.Subscription.Status>(["active", "trialing", "past_due"])

/**
 * Paid-until for a subscription's state: the period end while it runs, the
 * moment it ended once canceled, nothing if it never got paid.
 */
export function plusUntilFor(sub: Pick<Stripe.Subscription, "status" | "ended_at">, periodEnd: Date | null): Date | null {
  if (ACTIVE.has(sub.status)) return periodEnd
  if (sub.status === "canceled") return sub.ended_at ? new Date(sub.ended_at * 1000) : null
  return null
}

/** Copy a subscription's state onto the player's profile. */
export async function syncPlusFromSubscription(sub: Stripe.Subscription): Promise<void> {
  const playerId = sub.metadata?.playerId
  const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id
  const data = {
    plusUntil: plusUntilFor(sub, subscriptionPeriodEnd(sub)),
    stripeSubscriptionId: sub.id,
    stripeCustomerId: customerId,
  }
  if (playerId) {
    await db.discoverProfile.upsert({ where: { playerId }, create: { playerId, ...data }, update: data })
  } else {
    await db.discoverProfile.updateMany({ where: { stripeSubscriptionId: sub.id }, data })
  }
}

/** The subscription an invoice belongs to (new and old API shapes). */
export function invoiceSubscriptionId(inv: Stripe.Invoice): string | null {
  const fromParent = inv.parent?.subscription_details?.subscription
  const legacy = (inv as unknown as { subscription?: string | { id: string } | null }).subscription
  const s = fromParent ?? legacy ?? null
  if (!s) return null
  return typeof s === "string" ? s : s.id
}

/**
 * If plusUntil has passed but a subscription exists, ask Stripe once: the
 * renewal may have happened without the webhook reaching us.
 */
export async function refreshPlusIfStale(playerId: string, now: Date = new Date()): Promise<void> {
  const p = await db.discoverProfile.findUnique({
    where: { playerId },
    select: { plusUntil: true, stripeSubscriptionId: true },
  })
  if (!p?.stripeSubscriptionId || (p.plusUntil && p.plusUntil > now)) return
  if (!process.env.STRIPE_SECRET_KEY) return
  try {
    const sub = await stripe.subscriptions.retrieve(p.stripeSubscriptionId)
    await syncPlusFromSubscription(sub)
  } catch (e) {
    console.error("[plus] refresh failed", e)
  }
}

/**
 * Stop SANDER+ for good (account deletion). Throws if Stripe can't confirm,
 * so an account is never deleted while its subscription keeps charging.
 */
export async function cancelPlusNow(playerId: string): Promise<void> {
  const p = await db.discoverProfile.findUnique({ where: { playerId }, select: { stripeSubscriptionId: true } })
  if (!p?.stripeSubscriptionId) return
  if (!process.env.STRIPE_SECRET_KEY) throw new Error("Stripe non configurato: impossibile disdire SANDER+")
  let sub: Stripe.Subscription | null = null
  try {
    sub = await stripe.subscriptions.retrieve(p.stripeSubscriptionId)
  } catch (e) {
    // Gone on Stripe's side: nothing left to charge.
    if (e && typeof e === "object" && "code" in e && e.code === "resource_missing") return
    throw new Error("Non riesco a raggiungere Stripe per disdire SANDER+: riprova")
  }
  if (sub.status === "canceled" || sub.status === "incomplete_expired") return
  try {
    await stripe.subscriptions.cancel(sub.id)
  } catch {
    throw new Error("Non riesco a disdire SANDER+ su Stripe: riprova o disdici dal pannello Stripe")
  }
}
