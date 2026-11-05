import type { StandingEntry } from "./types"

/**
 * Recalculates standings from scratch given a list of completed match results.
 * Useful for correction / full recompute.
 *
 * Win = 3 pts, Loss = 1 pt.
 */
export function calculateStandings(
  playerIds: string[],
  completedMatches: Array<{
    teamAScore: number
    teamBScore: number
    teamAPlayerIds: string[]
    teamBPlayerIds: string[]
  }>,
): StandingEntry[] {
  const map = new Map<string, StandingEntry>()

  for (const id of playerIds) {
    map.set(id, {
      playerId: id,
      points: 0,
      matchesWon: 0,
      matchesLost: 0,
      pointsFor: 0,
      pointsAgainst: 0,
      rank: 0,
    })
  }

  for (const match of completedMatches) {
    const teamAWon = match.teamAScore > match.teamBScore

    const applyToTeam = (pids: string[], won: boolean, myScore: number, oppScore: number) => {
      for (const pid of pids) {
        const s = map.get(pid)
        if (!s) continue
        map.set(pid, {
          ...s,
          points: s.points + (won ? 3 : 1),
          matchesWon: s.matchesWon + (won ? 1 : 0),
          matchesLost: s.matchesLost + (won ? 0 : 1),
          pointsFor: s.pointsFor + myScore,
          pointsAgainst: s.pointsAgainst + oppScore,
        })
      }
    }

    applyToTeam(match.teamAPlayerIds, teamAWon, match.teamAScore, match.teamBScore)
    applyToTeam(match.teamBPlayerIds, !teamAWon, match.teamBScore, match.teamAScore)
  }

  return rankStandings(Array.from(map.values()))
}

/**
 * Sorts standings entries and assigns 1-based rank numbers.
 * Sort priority: 1) points DESC, 2) point diff DESC, 3) points scored DESC.
 * Entries level on all three share a rank, and the next one follows on
 * (1, 1, 2, 2, 3…): the two players of a fixed pair are always level, so the
 * podium is per pair (1ª, 2ª, 3ª coppia) and both get the win.
 */
export function rankStandings<T extends Pick<StandingEntry, "points" | "pointsFor" | "pointsAgainst">>(entries: T[]): (T & { rank: number })[] {
  const key = (e: T) => [e.points, e.pointsFor - e.pointsAgainst, e.pointsFor] as const
  const sorted = [...entries].sort((a, b) => {
    const [ap, ad, af] = key(a)
    const [bp, bd, bf] = key(b)
    return bp - ap || bd - ad || bf - af
  })
  let rank = 0
  return sorted.map((s, i) => {
    const prev = sorted[i - 1]
    if (!prev || key(prev).some((v, k) => v !== key(s)[k])) rank++
    return { ...s, rank }
  })
}
