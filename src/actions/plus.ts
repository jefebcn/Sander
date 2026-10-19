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
    ...(profile.stripeCustomerId ? { customer: profile.stripeCustomerId } : user?.email ? { customer_email: user.email } : {}),
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
