export const dynamic = "force-dynamic"

import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { getCurrentPlayer } from "@/lib/getCurrentPlayer"
import { incomingLikes, matchList, allowance, loadCardRow } from "@/lib/scopri/server"
import { ScopriNav } from "@/components/scopri/ScopriNav"
import { LikesYouView } from "@/components/scopri/LikesYouView"

export const metadata: Metadata = { title: "Ti vogliono in squadra — SANDER" }

export default async function LikesPage() {
  const player = await getCurrentPlayer()
  if (!player) redirect("/auth/signin?callbackUrl=/scopri/like")
  const now = new Date()
  const [likes, matches, left, me] = await Promise.all([
    incomingLikes(player.id, now),
    matchList(player.id, now),
    allowance(player.id, now),
    loadCardRow(player.id),
  ])
  const waiting = matches.filter((m) => m.turn !== "in-attesa").length
  return (
    <div className="px-4 pb-10">
      <ScopriNav active="like" likes={likes.length} waiting={waiting} />
      <LikesYouView
        likes={likes}
        revealed={!!left.revealUntil}
        myPhoto={me?.discoverPhotos[0]?.url ?? me?.avatarUrl ?? null}
      />
    </div>
  )
}
