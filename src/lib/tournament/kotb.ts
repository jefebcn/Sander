import type { KOTBMatch, KOTBRound, KOTBSchedule, ScoreUpdate, StandingEntry } from "./types"
import { pairTeamsIntoMatches, type Team } from "./balancing"

const BYE_PREFIX = "__BYE_"
const isBye = (id: string) => id.startsWith(BYE_PREFIX)

const DEFAULT_LEVEL = 2

function levelFor(id: string, skillLevels?: Map<string, number | null>): number {
  const lvl = skillLevels?.get(id)
  if (lvl === 1 || lvl === 2 || lvl === 3) return lvl
  return DEFAULT_LEVEL
}

// ─── Schedule Generation ──────────────────────────────────────────────────────

/**
 * Generates a KOTB partner-rotation schedule.
 *
 * Algorithm: "one-factorisation via the circle method"
 *   - Fix player[0], rotate the rest.
 *   - In each round, pair using the OPPOSITE positions: (arrangement[i], arrangement[n-1-i]).
 *     This produces exactly n/2 unique partnership pairs per round, with no pair ever
 *     repeating across all n-1 rounds (a perfect 1-factorisation of K_n).
 *   - Every two consecutive pairs form a 2v2 match.
 *
 * If n is not a multiple of 4, BYE sentinels are added so the pool is divisible by 4.
 * Players paired with a BYE are placed in the round's `byes` array instead of a match.
 *
 * @param playerIds      - array of real player IDs to schedule
 * @param requestedRounds - cap on rounds to generate (default: all n-1 possible)
 */
export function generateKOTBSchedule(
  playerIds: string[],
  requestedRounds?: number,
  skillLevels?: Map<string, number | null>,
): KOTBSchedule {
  if (playerIds.length < 4) {
    throw new Error("KOTB requires at least 4 players")
  }

  // Pad pool to next multiple of 4 using BYE sentinels
  const pool = [...playerIds]
  let byeIdx = 0
  while (pool.length % 4 !== 0) {
    pool.push(`${BYE_PREFIX}${byeIdx++}`)
  }

  const n = pool.length
  const maxRounds = n - 1
  const totalRounds = requestedRounds
    ? Math.min(requestedRounds, maxRounds)
    : maxRounds

  const fixed = pool[0]
  const rotating = pool.slice(1) // length n-1
  const rounds: KOTBRound[] = []

  for (let r = 0; r < totalRounds; r++) {
    const arrangement = [fixed, ...rotating]

    // Opposite-position pairing: (0, n-1), (1, n-2) … creates unique partnerships
    const pairs: [string, string][] = []
    for (let i = 0; i < n / 2; i++) {
      pairs.push([arrangement[i], arrangement[n - 1 - i]])
    }

    // Collect byes: real players whose partner slot was a BYE sentinel
    const byes: string[] = []
    const realPairs: [string, string][] = []
    for (const [a, b] of pairs) {
      if (isBye(a) && !isBye(b)) {
        byes.push(b)
      } else if (isBye(b) && !isBye(a)) {
        byes.push(a)
      } else if (!isBye(a) && !isBye(b)) {
        realPairs.push([a, b])
      }
      // both BYE — skip silently
    }

    // Form 2v2 matches. If skill levels are provided, reorder pairs so that
    // opposite teams within each match have the closest possible skill sums.
    const matches: KOTBMatch[] = []
    if (skillLevels && realPairs.length >= 2 && realPairs.length % 2 === 0) {
      const teams: Team[] = realPairs.map(([x, y]) => ({
        playerIds: [x, y],
        sum: levelFor(x, skillLevels) + levelFor(y, skillLevels),
      }))
      const balanced = pairTeamsIntoMatches(teams)
      for (const bm of balanced) {
        matches.push({
          matchNumber: matches.length + 1,
          teamA: [bm.teamA.playerIds[0], bm.teamA.playerIds[1]],
          teamB: [bm.teamB.playerIds[0], bm.teamB.playerIds[1]],
        })
      }
    } else {
      for (let m = 0; m + 1 < realPairs.length; m += 2) {
        matches.push({
          matchNumber: matches.length + 1,
          teamA: [realPairs[m][0], realPairs[m][1]],
          teamB: [realPairs[m + 1][0], realPairs[m + 1][1]],
        })
      }
    }

    rounds.push({ roundNumber: r + 1, matches, byes })

    // Circle rotation: move last element of rotating to front
    rotating.unshift(rotating.pop()!)
  }

  return { rounds, totalRounds }
}

// ─── Validation ───────────────────────────────────────────────────────────────

/**
 * Returns true if no two players appear as partners more than once.
 */
export function validateNoRepeatPartners(rounds: KOTBRound[]): boolean {
  const history: Record<string, Set<string>> = {}

  for (const round of rounds) {
    for (const match of round.matches) {
      for (const pair of [match.teamA, match.teamB] as [string, string][]) {
        const [a, b] = pair
        if (!history[a]) history[a] = new Set()
        if (!history[b]) history[b] = new Set()
        if (history[a].has(b)) return false
        history[a].add(b)
        history[b].add(a)
      }
    }
  }
  return true
}

// ─── Standings Helpers ────────────────────────────────────────────────────────

/**
 * Applies one match result to the in-memory standings array.
 * Win = 3 pts, Loss = 1 pt.
 */
export function applyMatchResult(
  standings: StandingEntry[],
  update: ScoreUpdate,
): StandingEntry[] {
  const teamAWon = update.teamAScore > update.teamBScore

  return standings.map((s) => {
    const inA = update.teamAPlayerIds.includes(s.playerId)
    const inB = update.teamBPlayerIds.includes(s.playerId)
    if (!inA && !inB) return s

    const won = inA ? teamAWon : !teamAWon
    const myScore = inA ? update.teamAScore : update.teamBScore
    const oppScore = inA ? update.teamBScore : update.teamAScore

    return {
      ...s,
      points: s.points + (won ? 3 : 1),
      matchesWon: s.matchesWon + (won ? 1 : 0),
      matchesLost: s.matchesLost + (won ? 0 : 1),
      pointsFor: s.pointsFor + myScore,
      pointsAgainst: s.pointsAgainst + oppScore,
    }
  })
}

/**
 * Sorts standings and assigns 1-based rank numbers.
 * Priority: 1) points DESC, 2) point differential DESC, 3) points scored DESC.
 */
export function rankStandings(standings: StandingEntry[]): StandingEntry[] {
  return [...standings]
    .sort((a, b) => {
      const byPoints = b.points - a.points
      if (byPoints !== 0) return byPoints
      const aDiff = a.pointsFor - a.pointsAgainst
      const bDiff = b.pointsFor - b.pointsAgainst
      const byDiff = bDiff - aDiff
      if (byDiff !== 0) return byDiff
      return b.pointsFor - a.pointsFor
    })
    .map((s, i) => ({ ...s, rank: i + 1 }))
}
