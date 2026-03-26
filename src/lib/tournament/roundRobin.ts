import type { RRMatch, RRRound, RRSchedule } from "./types"

// ─── Schedule Generation ──────────────────────────────────────────────────────

/**
 * Generates a Round Robin schedule for fixed 2-player teams.
 *
 * Algorithm: circle method (Berger tables)
 *   - Players are first grouped into T sequential pairs (team 0: [p0,p1], team 1: [p2,p3], …)
 *   - Fix team index 0, rotate the remaining T-1 indices each round.
 *   - In each round, pair index i vs index (T_eff-1-i) — this guarantees every team
 *     faces every other team exactly once across T_eff-1 rounds.
 *   - If T is odd, a virtual BYE team is added so the pool is even; players matched
 *     against BYE sit out that round and appear in the `byes` array.
 *
 * @param playerIds - even-length array of player IDs; consecutive pairs form teams
 */
export function generateRoundRobinSchedule(playerIds: string[]): RRSchedule {
  if (playerIds.length < 4) {
    throw new Error("Round Robin requires at least 4 players")
  }
  if (playerIds.length % 2 !== 0) {
    throw new Error("Round Robin requires an even number of players")
  }

  // Form fixed teams from sequential pairs
  const teams: [string, string][] = []
  for (let i = 0; i < playerIds.length; i += 2) {
    teams.push([playerIds[i], playerIds[i + 1]])
  }

  const BYE_IDX = -1 // sentinel for the dummy BYE team
  const pool: number[] = teams.map((_, i) => i)

  // Pad to even number of teams with a BYE slot
  if (pool.length % 2 !== 0) {
    pool.push(BYE_IDX)
  }

  const n = pool.length // always even
  const totalRounds = n - 1

  const fixed = pool[0]
  const rotating = pool.slice(1) // length n-1
  const rounds: RRRound[] = []

  for (let r = 0; r < totalRounds; r++) {
    const arrangement = [fixed, ...rotating]
    const byes: string[] = []
    const matches: RRMatch[] = []

    for (let i = 0; i < n / 2; i++) {
      const a = arrangement[i]
      const b = arrangement[n - 1 - i]

      if (a === BYE_IDX) {
        // BYE slot on side A — team b sits out
        byes.push(...teams[b])
      } else if (b === BYE_IDX) {
        // BYE slot on side B — team a sits out
        byes.push(...teams[a])
      } else {
        matches.push({
          matchNumber: matches.length + 1,
          teamA: teams[a],
          teamB: teams[b],
        })
      }
    }

    rounds.push({ roundNumber: r + 1, matches, byes })

    // Circle rotation: move last element of rotating to front
    rotating.unshift(rotating.pop()!)
  }

  return { rounds, teams, totalRounds }
}

// ─── Validation ───────────────────────────────────────────────────────────────

/**
 * Returns true if every team pair appears at most once across all rounds.
 */
export function validateNoRepeatOpponents(rounds: RRRound[]): boolean {
  const played = new Set<string>()

  for (const round of rounds) {
    for (const match of round.matches) {
      // Canonical key: sort team member lists lexicographically
      const keyA = [...match.teamA].sort().join(",")
      const keyB = [...match.teamB].sort().join(",")
      const key = [keyA, keyB].sort().join("|")
      if (played.has(key)) return false
      played.add(key)
    }
  }
  return true
}

/**
 * Returns the number of times each player appears across all matches.
 * In a valid schedule every player appears (T_eff - 1) times (once per non-bye round).
 */
export function countAppearances(rounds: RRRound[]): Record<string, number> {
  const counts: Record<string, number> = {}
  for (const round of rounds) {
    for (const match of round.matches) {
      for (const pid of [...match.teamA, ...match.teamB]) {
        counts[pid] = (counts[pid] ?? 0) + 1
      }
    }
  }
  return counts
}
