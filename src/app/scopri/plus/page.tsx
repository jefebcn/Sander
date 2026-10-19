export const dynamic = "force-dynamic"

import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { getCurrentPlayer } from "@/lib/getCurrentPlayer"
import { db } from "@/lib/db"
import { stripe } from "@/lib/stripe"
import { PLUS_MONTHLY_CENTS } from "@/lib/pricing"
import { isPlus } from "@/lib/scopri/rules"
import { refreshPlusIfStale } from "@/lib/scopri/plus"
import { PageHeader } from "@/components/layout/PageHeader"
import { PlusView } from "@/components/scopri/PlusView"

export const metadata: Metadata = { title: "SANDER+ — SANDER" }

export default async function PlusPage() {
  const player = await getCurrentPlayer()
  if (!player) redirect("/auth/signin?callbackUrl=/scopri/plus")
  await refreshPlusIfStale(player.id)
  const p = await db.discoverProfile.findUnique({
    where: { playerId: player.id },
    select: { plusUntil: true, stripeSubscriptionId: true },
  })
  const active = isPlus(p?.plusUntil)
  let cancelAtEnd = false
  if (active && p?.stripeSubscriptionId && process.env.STRIPE_SECRET_KEY) {
    try {
      cancelAtEnd = (await stripe.subscriptions.retrieve(p.stripeSubscriptionId)).cancel_at_period_end
    } catch {
      // Stripe unreachable: show the plain "active until" line.
    }
  }
  const priceLabel = `€${(PLUS_MONTHLY_CENTS / 100).toFixed(2).replace(".", ",")}`
  return (
    <div className="pb-10">
      <PageHeader eyebrow="Scopri" tone="compete" title="SANDER+" backHref="/scopri" />
      <div className="px-4">
        <PlusView priceLabel={priceLabel} active={active} until={p?.plusUntil?.toISOString() ?? null} cancelAtEnd={cancelAtEnd} />
      </div>
    </div>
  )
}
