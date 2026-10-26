"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { getCurrentPlayer } from "@/lib/getCurrentPlayer"
import { stripe, getAppUrl } from "@/lib/stripe"
import { PLUS_MONTHLY_CENTS } from "@/lib/pricing"
import { syncPlusFromSubscription } from "@/lib/scopri/plus"
import { isPlus } from "@/lib/scopri/rules"

/* SANDER+ actions: start, cancel at period end, resume. Signed-in player only. */

async function requireMe() {
  const me = await getCurrentPlayer()
  if (!me) throw new Error("Non autenticato")
  return me
}

/** Subscriptions that still charge or are about to: never open a second one beside them. */
const LIVE_STATUSES = new Set(["active", "trialing", "past_due", "incomplete", "unpaid"])

/**
 * The player's Stripe customer, created once and stored before any checkout,
 * so every attempt lands on the same customer and duplicates can be seen.
 */
async function plusCustomer(playerId: string, stored: string | null, email: string | null): Promise<string> {
  if (stored) return stored
  const created = await stripe.customers.create({ ...(email ? { email } : {}), metadata: { playerId } })
  // Two requests at once: the first to store wins, the other customer stays unused.
  await db.discoverProfile.updateMany({ where: { playerId, stripeCustomerId: null }, data: { stripeCustomerId: created.id } })
  const p = await db.discoverProfile.findUnique({ where: { playerId }, select: { stripeCustomerId: true } })
  return p?.stripeCustomerId ?? created.id
}

export async function startPlusCheckout(): Promise<{ url: string }> {
  const me = await requireMe()
  if (!process.env.STRIPE_SECRET_KEY) throw new Error("Pagamenti non disponibili al momento")
  const profile = await db.discoverProfile.upsert({
    where: { playerId: me.id },
    create: { playerId: me.id },
    update: {},
    select: { plusUntil: true, stripeCustomerId: true },
  })
  if (isPlus(profile.plusUntil)) throw new Error("Hai già SANDER+")
  const user = me.userId ? await db.user.findUnique({ where: { id: me.userId }, select: { email: true } }) : null
  const customer = await plusCustomer(me.id, profile.stripeCustomerId, user?.email ?? null)

  // A second tab or a double tap must not open a second subscription: reuse a
  // live one (the webhook just hasn't landed) or the checkout already open.
  const subs = await stripe.subscriptions.list({ customer, status: "all", limit: 20 })
  const live = subs.data.find((s) => s.metadata?.kind === "plus" && LIVE_STATUSES.has(s.status))
  if (live) {
    await syncPlusFromSubscription(live)
    revalidatePath("/scopri/plus")
    throw new Error("Hai già SANDER+: ricarica la pagina")
  }
  const open = await stripe.checkout.sessions.list({ customer, status: "open", limit: 10 })
  const pending = open.data.find((s) => s.metadata?.kind === "plus" && s.url)
  if (pending?.url) return { url: pending.url }

  const appUrl = getAppUrl()
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "eur",
          unit_amount: PLUS_MONTHLY_CENTS,
          recurring: { interval: "month" },
          product_data: { name: "SANDER+", description: "Like illimitati, vedi tutti, 3 Ace a settimana, filtri in più" },
        },
      },
    ],
    customer,
    client_reference_id: me.id,
    metadata: { kind: "plus", playerId: me.id },
    subscription_data: { metadata: { kind: "plus", playerId: me.id } },
    success_url: `${appUrl}/scopri/plus?ok=1`,
    cancel_url: `${appUrl}/scopri/plus`,
  })
  if (!session.url) throw new Error("Pagamento non disponibile, riprova")
  return { url: session.url }
}

async function mySubscription() {
  const me = await requireMe()
  const p = await db.discoverProfile.findUnique({ where: { playerId: me.id }, select: { stripeSubscriptionId: true } })
  if (!p?.stripeSubscriptionId) throw new Error("Nessun abbonamento attivo")
  return p.stripeSubscriptionId
}

/** Stop renewing; SANDER+ stays until the end of the paid month. */
export async function cancelPlus() {
  const id = await mySubscription()
  const sub = await stripe.subscriptions.update(id, { cancel_at_period_end: true })
  await syncPlusFromSubscription(sub)
  revalidatePath("/scopri/plus")
  return { ok: true as const }
}

export async function resumePlus() {
  const id = await mySubscription()
  const sub = await stripe.subscriptions.update(id, { cancel_at_period_end: false })
  await syncPlusFromSubscription(sub)
  revalidatePath("/scopri/plus")
  return { ok: true as const }
}
