// Skill-level balancing algorithm for 2v2 team pairings.
//
// Rules (priority order):
// 1. Prioritize L3 vs L3 matches: pair L3 players together as much as possible.
// 2. For the remaining mixed pool (L1/L2 + leftover L3), form pairs minimizing
//    the variance of the team skill sum.
// 3. When grouping pairs into 2v2 matches, pick opposite pairs whose sums are
//    as close as possible. If the best achievable |sumA - sumB| >= 4 for any
//    match, attempt local swaps to reduce it.
// 4. `skillLevel === null` is treated as 2 (prudent average).

const DEFAULT_LEVEL = 2

export interface PlayerWithLevel {
  id: string
  skillLevel: number | null
}

export interface Team {
  playerIds: [string, string]
  /** Sum of the two players' effective skill levels. */
  sum: number
}

export interface BalancedMatch {
  teamA: Team
  teamB: Team
}

export function effectiveLevel(p: PlayerWithLevel): number {
  const lvl = p.skillLevel
  if (lvl === 1 || lvl === 2 || lvl === 3) return lvl
  return DEFAULT_LEVEL
}

function pairSum(pool: Map<string, number>, a: string, b: string): number {
  return (pool.get(a) ?? DEFAULT_LEVEL) + (pool.get(b) ?? DEFAULT_LEVEL)
}

/**
 * Forms 2-player teams from the given pool minimizing sum variance.
 * Greedy "highest + lowest" which for small pools is close to optimal.
 */
export function formBalancedPairs(
  players: PlayerWithLevel[],
): Team[] {
  if (players.length === 0) return []
  if (players.length % 2 !== 0) {
    throw new Error("formBalancedPairs requires an even number of players")
  }

  const sorted = [...players].sort((a, b) => effectiveLevel(b) - effectiveLevel(a))
  const teams: Team[] = []
  let lo = 0
  let hi = sorted.length - 1
  while (lo < hi) {
    const a = sorted[lo]
    const b = sorted[hi]
    teams.push({
      playerIds: [a.id, b.id],
      sum: effectiveLevel(a) + effectiveLevel(b),
    })
    lo++
    hi--
  }
  return teams
}

/**
 * Pairs a list of teams (even count) into 2v2 matches, minimizing
 * |sumA - sumB| per match and avoiding |delta| >= 4 when possible.
 */
export function pairTeamsIntoMatches(teams: Team[]): BalancedMatch[] {
  if (teams.length === 0) return []
  if (teams.length % 2 !== 0) {
    throw new Error("pairTeamsIntoMatches requires an even number of teams")
  }

  // Sort ascending by sum; adjacent teams have the closest sums.
  const sorted = [...teams].sort((a, b) => a.sum - b.sum)
  const matches: BalancedMatch[] = []
  for (let i = 0; i < sorted.length; i += 2) {
    matches.push({ teamA: sorted[i], teamB: sorted[i + 1] })
  }

  // Try to reduce any match with |delta| >= 4 via a single swap with another match.
  const BAD = 4
  for (let i = 0; i < matches.length; i++) {
    if (Math.abs(matches[i].teamA.sum - matches[i].teamB.sum) < BAD) continue
    for (let j = 0; j < matches.length; j++) {
      if (i === j) continue
      // Try swapping teamB of match i with teamA or teamB of match j
      for (const slotJ of ["teamA", "teamB"] as const) {
        const newI = {
          teamA: matches[i].teamA,
          teamB: matches[j][slotJ],
        }
        const newJ = {
          teamA: slotJ === "teamA" ? matches[i].teamB : matches[j].teamA,
          teamB: slotJ === "teamB" ? matches[i].teamB : matches[j].teamB,
        }
        const oldMax = Math.max(
          Math.abs(matches[i].teamA.sum - matches[i].teamB.sum),
          Math.abs(matches[j].teamA.sum - matches[j].teamB.sum),
        )
        const newMax = Math.max(
          Math.abs(newI.teamA.sum - newI.teamB.sum),
          Math.abs(newJ.teamA.sum - newJ.teamB.sum),
        )
        if (newMax < oldMax) {
          matches[i] = newI
          matches[j] = newJ
          break
        }
      }
    }
  }

  return matches
}

/**
 * Full 2v2 balancing: given a pool of players (multiple of 4), return
 * matches respecting the priority rules above.
 *
 * Phase A: isolate L3 players; pair them L3+L3 while there is an even count.
 *          Group those L3-pairs into L3-vs-L3 matches where possible.
 * Phase B: put remaining L3 (odd leftover) together with L1/L2 in a mixed pool.
 * Phase C: form balanced pairs from the mixed pool; combine with any leftover
 *          L3 pairs and produce matches via pairTeamsIntoMatches.
 */
export function balanceTeams(players: PlayerWithLevel[]): BalancedMatch[] {
  if (players.length === 0) return []
  if (players.length % 4 !== 0) {
    throw new Error("balanceTeams requires a multiple of 4 players")
  }

  const l3: PlayerWithLevel[] = []
  const rest: PlayerWithLevel[] = []
  for (const p of players) {
    if (p.skillLevel === 3) l3.push(p)
    else rest.push(p)
  }

  const l3Pairs: Team[] = []
  // Use as many L3 players as possible in L3+L3 pairs.
  // To keep L3-vs-L3 matches, we need l3Pairs.length to be even.
  let l3ToPair = l3.length
  if (l3ToPair % 2 !== 0) l3ToPair-- // leave 1 leftover into mixed pool
  // If the leftover after forming L3 pairs would break the multiple-of-4
  // constraint downstream, drop one more L3 pair into the mixed pool so the
  // rest pool remains a multiple of 4 after adding even-sized leftovers.
  // rest.length + (l3.length - l3ToPair) must be a multiple of 4 and even.
  while ((rest.length + (l3.length - l3ToPair)) % 4 !== 0) {
    l3ToPair -= 2
    if (l3ToPair < 0) { l3ToPair = 0; break }
  }

  for (let i = 0; i < l3ToPair; i += 2) {
    l3Pairs.push({
      playerIds: [l3[i].id, l3[i + 1].id],
      sum: 6,
    })
  }

  // Leftover L3 players enter the mixed pool.
  const mixedPool: PlayerWithLevel[] = [...rest]
  for (let i = l3ToPair; i < l3.length; i++) {
    mixedPool.push(l3[i])
  }

  const mixedPairs = formBalancedPairs(mixedPool)
  const allPairs = [...l3Pairs, ...mixedPairs]

  return pairTeamsIntoMatches(allPairs)
}
