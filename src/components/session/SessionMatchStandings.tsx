"use client"

import { applyMatchResult, rankStandings } from "@/lib/tournament/kotb"
import type { StandingEntry } from "@/lib/tournament/types"

interface MatchPlayer {
  playerId: string
  team: number
}

interface CompletedMatch {
  id: string
  teamAScore: number
  teamBScore: number
  players: MatchPlayer[]
}

interface Props {
  playerNames: Record<string, string>  // playerId → name
  completedMatches: CompletedMatch[]
}

export function SessionMatchStandings({ playerNames, completedMatches }: Props) {
  if (completedMatches.length === 0) return null

  // Build initial entries for every player that appears in matches
  const playerIds = [...new Set(completedMatches.flatMap((m) => m.players.map((p) => p.playerId)))]

  let standings: StandingEntry[] = playerIds.map((id) => ({
    playerId: id,
    points: 0,
    matchesWon: 0,
    matchesLost: 0,
    pointsFor: 0,
    pointsAgainst: 0,
    rank: 0,
  }))

  for (const m of completedMatches) {
    const teamAIds = m.players.filter((p) => p.team === 0).map((p) => p.playerId)
    const teamBIds = m.players.filter((p) => p.team === 1).map((p) => p.playerId)
    standings = applyMatchResult(standings, {
      teamAPlayerIds: teamAIds,
      teamBPlayerIds: teamBIds,
      teamAScore: m.teamAScore,
      teamBScore: m.teamBScore,
    })
  }

  standings = rankStandings(standings)

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: "var(--surface-2)" }}>
      <div className="px-4 py-2.5 border-b" style={{ borderColor: "var(--border)" }}>
        <p className="text-xs font-bold uppercase tracking-wider text-[var(--accent)]">Classifica</p>
      </div>

      <div className="divide-y" style={{ borderColor: "var(--border)" }}>
        {standings.map((s) => (
          <div key={s.playerId} className="flex items-center gap-3 px-4 py-2.5">
            <span
              className="w-5 text-center text-xs font-black"
              style={{ color: s.rank === 1 ? "var(--accent)" : "var(--muted-text)" }}
            >
              {s.rank}
            </span>
            <span className="flex-1 truncate text-sm font-semibold text-white">
              {playerNames[s.playerId] ?? s.playerId}
            </span>
            <span className="text-xs text-[var(--muted-text)]">
              {s.matchesWon}V {s.matchesLost}S
            </span>
            <span className="min-w-[2rem] text-right text-sm font-black" style={{ color: "var(--accent)" }}>
              {s.points}
            </span>
          </div>
        ))}
      </div>

      <p className="px-4 py-1.5 text-[0.6rem] text-[var(--muted-text)]">
        V = vittorie · S = sconfitte · punti: V=3, S=1
      </p>
    </div>
  )
}
