/**
 * Club circuits (pure — no DB). A circuit is a season of a club's tournaments
 * ("tappe"): each stage gives points by final placement, the overall table is
 * the sum. Players of a pair share their rank (lib/tournament/standings.ts),
 * so both get the same points.
 */

/** Points for 1st…10th place; everyone further down still gets something for playing. */
export const CIRCUIT_POINTS = [100, 80, 65, 55, 45, 40, 35, 30, 25, 20] as const
export const CIRCUIT_PARTICIPATION = 10

export function pointsForRank(rank: number): number {
  return rank >= 1 && rank <= CIRCUIT_POINTS.length ? CIRCUIT_POINTS[rank - 1] : CIRCUIT_PARTICIPATION
}

export interface CircuitRow {
  playerId: string
  points: number
  stages: number
  wins: number
  rank: number
}

/** Overall table from completed stages: points, then stage wins, then stages played; level rows share a rank. */
export function circuitStandings(stages: { standings: { playerId: string; rank: number }[] }[]): CircuitRow[] {
  const by = new Map<string, Omit<CircuitRow, "rank">>()
  for (const stage of stages) {
    for (const s of stage.standings) {
      if (s.rank < 1) continue // a stage that never got scores
      const row = by.get(s.playerId) ?? { playerId: s.playerId, points: 0, stages: 0, wins: 0 }
      row.points += pointsForRank(s.rank)
      row.stages += 1
      if (s.rank === 1) row.wins += 1
      by.set(s.playerId, row)
    }
  }
  const sorted = [...by.values()].sort((a, b) => b.points - a.points || b.wins - a.wins || b.stages - a.stages)
  let rank = 0
  return sorted.map((r, i) => {
    const p = sorted[i - 1]
    if (!p || p.points !== r.points || p.wins !== r.wins || p.stages !== r.stages) rank++
    return { ...r, rank }
  })
}
