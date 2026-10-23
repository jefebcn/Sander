export const dynamic = "force-dynamic"

import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { getCurrentPlayer } from "@/lib/getCurrentPlayer"
import { db } from "@/lib/db"
import { stripe } from "@/lib/stripe"
import { PLUS_MONTHLY_CENTS } from "@/lib/pricing"
import { dayKey } from "@/lib/datetime"
import { romeMonthStart } from "@/lib/romeMonth"
import { daysAtLikeLimit, isPlus, PLUS_PASS } from "@/lib/scopri/rules"
import { refreshPlusIfStale } from "@/lib/scopri/plus"
import { PageHeader } from "@/components/layout/PageHeader"
import { PlusView } from "@/components/scopri/PlusView"

export const metadata: Metadata = { title: "SANDER+ — SANDER" }

export default async function PlusPage() {
  const player = await getCurrentPlayer()
  if (!player) redirect("/auth/signin?callbackUrl=/scopri/plus")
  await refreshPlusIfStale(player.id)
  const now = new Date()
  const [y, m] = dayKey(now).split("-").map(Number)
  const monthStart = romeMonthStart(y, m)
  // This month's use, so everyone can see whether SANDER+ is worth it to them.
  const [p, games, likes] = await Promise.all([
    db.discoverProfile.findUnique({
      where: { playerId: player.id },
      select: { plusUntil: true, plusPassUntil: true, stripeSubscriptionId: true },
    }),
    db.sessionParticipant.count({
      where: { playerId: player.id, session: { status: "COMPLETED", date: { gte: monthStart, lte: now } } },
    }),
    db.playerSwipe.findMany({
      where: { fromId: player.id, liked: true, isAce: false, reply: false, createdAt: { gte: monthStart } },
      select: { createdAt: true },
    }),
  ])
  const active = isPlus(p?.plusUntil, now)
  const passUntil = !active && isPlus(p?.plusPassUntil, now) ? p!.plusPassUntil!.toISOString() : null
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
        <PlusView
          priceLabel={priceLabel}
          active={active}
          until={p?.plusUntil?.toISOString() ?? null}
          cancelAtEnd={cancelAtEnd}
          passUntil={passUntil}
          pass={{ ...PLUS_PASS, credits: player.sanderCredits }}
          month={{ games, likes: likes.length, daysAtLimit: daysAtLikeLimit(likes.map((l) => l.createdAt)) }}
        />
      </div>
    </div>
  )
}
