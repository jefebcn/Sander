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
  toDuoCard,
} from "@/lib/scopri/duos"
import { ScopriNav } from "@/components/scopri/ScopriNav"
import { CoppieView } from "@/components/scopri/CoppieView"

export const metadata: Metadata = { title: "Coppie 2v2 — SANDER" }

export default async function CoppiePage() {
  const player = await getCurrentPlayer()
  if (!player) redirect("/auth/signin?callbackUrl=/scopri/coppie")
  const now = new Date()
  const [duo, sent, invites, likes, matches] = await Promise.all([
    activeDuoOf(player.id),
    sentInviteOf(player.id),
    invitesFor(player.id),
    incomingLikes(player.id, now),
    matchList(player.id, now),
  ])
  const waiting = matches.filter((m) => m.turn !== "in-attesa").length

  const [candidates, deck, used, incoming, duoMatches] = duo
    ? await Promise.all([Promise.resolve([]), duoDeck(duo, now), duoLikesUsedToday(duo.id, now), incomingDuoLikes(duo), duoMatchList(duo)])
    : [await partnerCandidates(player.id), [], 0, [], []]

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
        }}
      />
    </div>
  )
}
