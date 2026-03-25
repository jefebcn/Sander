import type { BracketMatch, BracketTeam } from "./types"

// ─── Helpers ──────────────────────────────────────────────────────────────────

function nextPowerOf2(n: number): number {
  let p = 1
  while (p < n) p *= 2
  return p
}

/**
 * Standard single-elimination seed order for a bracket of given size.
 * Seed 1 vs size, seed 2 vs size-1, etc. — recursively interleaved.
 */
function buildSeedOrder(size: number): number[] {
  if (size === 2) return [1, 2]
  const half = buildSeedOrder(size / 2)
  const result: number[] = []
  for (const h of half) {
    result.push(h, size + 1 - h)
  }
  return result
}

let tempIdCounter = 0
function makeTempId(): string {
  return `bracket-match-${++tempIdCounter}`
}

// ─── Generator ────────────────────────────────────────────────────────────────

/**
 * Generates a full single-elimination bracket.
 *
 * @param teams - array of teams; each team is an array of playerIds
 * @returns flat array of BracketMatch objects with nextMatchTempId wired up
 *
 * Round numbering (countdown): round = log2(bracketSize) is the first round,
 * round = 1 is the final. This keeps the final always at round 1 regardless
 * of bracket size.
 */
export function generateBracket(teams: BracketTeam[]): BracketMatch[] {
  tempIdCounter = 0
  const bracketSize = nextPowerOf2(teams.length)
  const totalRounds = Math.log2(bracketSize)

  // Place teams into seeded positions; null = bye slot
  const seedOrder = buildSeedOrder(bracketSize)
  const slots: (BracketTeam | null)[] = Array(bracketSize).fill(null)
  teams.forEach((team, i) => {
    if (i < seedOrder.length) {
      slots[seedOrder[i] - 1] = team // seedOrder is 1-based
    }
  })

  const allMatches: BracketMatch[] = []

  // Build first round
  const firstRoundMatches: BracketMatch[] = []
  for (let m = 0; m < bracketSize / 2; m++) {
    const slotA = slots[m * 2]
    const slotB = slots[m * 2 + 1]
    const isBye = (slotA !== null && slotB === null) || (slotA === null && slotB !== null)

    firstRoundMatches.push({
      tempId: makeTempId(),
      round: totalRounds,
      matchNumber: m + 1,
      teamA: slotA,
      teamB: slotB,
      nextMatchTempId: null,
      nextMatchSlot: null,
      isBye,
    })
  }
  allMatches.push(...firstRoundMatches)

  // Build subsequent rounds, wiring nextMatchTempId
  let prevRound = firstRoundMatches
  for (let r = totalRounds - 1; r >= 1; r--) {
    const matchCount = Math.pow(2, r - 1)
    const currentRound: BracketMatch[] = []

    for (let m = 0; m < matchCount; m++) {
      const feedA = prevRound[m * 2]
      const feedB = prevRound[m * 2 + 1]

      const newMatch: BracketMatch = {
        tempId: makeTempId(),
        round: r,
        matchNumber: m + 1,
        teamA: null, // TBD — filled when feedA completes
        teamB: null, // TBD — filled when feedB completes
        nextMatchTempId: null,
        nextMatchSlot: null,
        isBye: false,
      }
      currentRound.push(newMatch)

      feedA.nextMatchTempId = newMatch.tempId
      feedA.nextMatchSlot = 0
      feedB.nextMatchTempId = newMatch.tempId
      feedB.nextMatchSlot = 1
    }

    allMatches.push(...currentRound)
    prevRound = currentRound
  }

  return allMatches
}

/**
 * After a match score is recorded, advance the winning team to the next match.
 * Returns the updated matches array (pure function — caller persists to DB).
 */
export function advanceWinner(
  matches: BracketMatch[],
  completedTempId: string,
  winnerSlot: 0 | 1, // 0 = teamA won, 1 = teamB won
): BracketMatch[] {
  const completed = matches.find((m) => m.tempId === completedTempId)
  if (!completed || !completed.nextMatchTempId) return matches

  const winner = winnerSlot === 0 ? completed.teamA : completed.teamB
  if (!winner) return matches

  return matches.map((m) => {
    if (m.tempId !== completed.nextMatchTempId) return m
    if (completed.nextMatchSlot === 0) return { ...m, teamA: winner }
    return { ...m, teamB: winner }
  })
}
