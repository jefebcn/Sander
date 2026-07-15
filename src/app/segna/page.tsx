export const dynamic = "force-dynamic"

import type { Metadata } from "next"
import { getSession } from "@/actions/sessions"
import { getCurrentPlayer } from "@/lib/getCurrentPlayer"
import { LiveScoreboard } from "@/components/scoreboard/LiveScoreboard"

export const metadata: Metadata = {
  title: "Segna dal vivo — SANDER",
  description: "Il tabellone da campo per il tuo beach volley: tocca e segna.",
}

function teamName(
  participants: { team: number | null; guestName: string | null; player: { name: string } | null }[],
  team: number,
): string {
  const members = participants
    .filter((p) => p.team === team)
    .map((p) => p.player?.name.split(" ")[0] ?? p.guestName ?? "?")
  if (members.length === 0) return team === 0 ? "Squadra A" : "Squadra B"
  return members.join(" & ")
}

interface Props {
  searchParams: Promise<{ session?: string }>
}

export default async function ScoreboardPage({ searchParams }: Props) {
  const { session: sessionId } = await searchParams

  // Session mode: only when the current user is the organizer and both teams
  // have players assigned. Otherwise fall back to the standalone scoreboard.
  if (sessionId) {
    const [session, player] = await Promise.all([
      getSession(sessionId).catch(() => null),
      getCurrentPlayer(),
    ])

    if (
      session &&
      player &&
      session.organizerId === player.id &&
      (session.status === "OPEN" || session.status === "FULL")
    ) {
      const hasA = session.participants.some((p) => p.team === 0)
      const hasB = session.participants.some((p) => p.team === 1)
      if (hasA && hasB) {
        return (
          <LiveScoreboard
            session={{ id: session.id }}
            initialNames={[teamName(session.participants, 0), teamName(session.participants, 1)]}
          />
        )
      }
    }
  }

  return <LiveScoreboard />
}
