export const dynamic = "force-dynamic"

import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { getCurrentPlayer } from "@/lib/getCurrentPlayer"
import { DUO_LIKES_PER_DAY } from "@/lib/scopri/rules"
import { incomingLikes, matchList } from "@/lib/scopri/server"
import {
  activeDuoOf,
  sentInviteOf,
  invitesFor,
  partnerCandidates,
  duoDeck,
  duoLikesUsedToday,
  incomingDuoLikes,
  duoMatchList,
  duoLeaderboard,
  toDuoCard,
  pairsNearby,
} from "@/lib/scopri/duos"
import { ScopriNav } from "@/components/scopri/ScopriNav"
import { CoppieView } from "@/components/scopri/CoppieView"

export const metadata: Metadata = { title: "Coppie 2v2 — SANDER" }

export default async function CoppiePage() {
  const player = await getCurrentPlayer()
  if (!player) redirect("/auth/signin?callbackUrl=/scopri/coppie")
  const now = new Date()
  const [duo, sent, invites, likes, matches, leaderboard] = await Promise.all([
    activeDuoOf(player.id),
    sentInviteOf(player.id),
    invitesFor(player.id),
    incomingLikes(player.id, now),
    matchList(player.id, now),
    duoLeaderboard(),
  ])
  const waiting = matches.filter((m) => m.turn !== "in-attesa").length

  // With a pair: pairs to challenge and your games. Without: who to pair with,
  // and the pairs nearby that are waiting for opponents (the reason to pair up).
  let candidates: Awaited<ReturnType<typeof partnerCandidates>> = []
  let deck: Awaited<ReturnType<typeof duoDeck>> = []
  let used = 0
  let incoming: Awaited<ReturnType<typeof incomingDuoLikes>> = []
  let duoMatches: Awaited<ReturnType<typeof duoMatchList>> = []
  let nearbyPairs: Awaited<ReturnType<typeof pairsNearby>> = []
  if (duo) {
    ;[deck, used, incoming, duoMatches] = await Promise.all([duoDeck(duo, now), duoLikesUsedToday(duo.id, now), incomingDuoLikes(duo), duoMatchList(duo)])
  } else {
    ;[candidates, nearbyPairs] = await Promise.all([partnerCandidates(player.id), pairsNearby(player.id, player.homeCity)])
  }

  return (
    <div className="px-4 pb-10">
      <ScopriNav active="coppie" likes={likes.length} waiting={waiting} />
      <CoppieView
        data={{
          meId: player.id,
          myCity: player.homeCity,
          duo: duo ? toDuoCard(duo) : null,
          sent: sent ? toDuoCard(sent) : null,
          invites: invites.map((d) => toDuoCard(d)),
          candidates,
          deck,
          likesLeft: Math.max(0, DUO_LIKES_PER_DAY - used),
          incoming,
          matches: duoMatches,
          leaderboard,
          nearbyPairs,
        }}
      />
    </div>
  )
}
