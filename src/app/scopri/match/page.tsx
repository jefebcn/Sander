export const dynamic = "force-dynamic"

import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { getCurrentPlayer } from "@/lib/getCurrentPlayer"
import { incomingLikes, matchList } from "@/lib/scopri/server"
import { ScopriNav } from "@/components/scopri/ScopriNav"
import { MatchListView } from "@/components/scopri/MatchListView"

export const metadata: Metadata = { title: "I tuoi match — SANDER" }

export default async function MatchPage() {
  const player = await getCurrentPlayer()
  if (!player) redirect("/auth/signin?callbackUrl=/scopri/match")
  const now = new Date()
  const [matches, likes] = await Promise.all([matchList(player.id, now), incomingLikes(player.id, now)])
  const waiting = matches.filter((m) => m.turn !== "in-attesa").length
  return (
    <div className="px-4 pb-10">
      <ScopriNav active="match" likes={likes.length} waiting={waiting} />
      <MatchListView matches={matches} myCity={player.homeCity} />
    </div>
  )
}
