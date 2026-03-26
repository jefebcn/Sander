/**
 * Double Elimination Bracket Generator
 *
 * Produces a complete DE schedule for N teams (N must be a power of 2 or will be
 * padded with byes).  Every team must lose twice before elimination.
 *
 * Structure (for N = 2^k teams):
 *   Winners Bracket (WB): k rounds, same countdown numbering as single-elim
 *   Losers  Bracket (LB): 2*(k-1) rounds, numbered 1..2*(k-1)
 *   Grand   Final   (GF): 1 match, round = 0
 *
 * WB → LB routing:
 *   WB seq-round 1 losers → LB R1  (all fresh, N/2 players)
 *   WB seq-round j losers → LB R[2j-2] merge  (j ≥ 2)
 *
 * LB internal routing:
 *   LB even round: merge of LB survivors + WB dropouts
 *   LB odd  round (≥ 3): pure LB survivors battle (no new WB entrants)
 *
 * Total matches (no GF reset): 2*(N-1) – 1 + 1 = 2*(N-1)
 */

import type { BracketTeam } from "./types"

export interface DEBracketMatch {
  tempId: string
  bracketSection: "WB" | "LB" | "GF"
  round: number          // WB: countdown (k = first round); LB: 1-based; GF: 0
  matchNumber: number
  teamA: BracketTeam | null
  teamB: BracketTeam | null
  nextMatchTempId: string | null      // winner advances here
  nextMatchSlot: 0 | 1 | null
  loserNextMatchTempId: string | null // loser drops to LB here (WB only; null = eliminated)
  loserNextMatchSlot: 0 | 1 | null
  isBye: boolean
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

function nextPow2(n: number): number {
  let p = 1
  while (p < n) p *= 2
  return p
}

function buildSeedOrder(size: number): number[] {
  if (size === 2) return [1, 2]
  const half = buildSeedOrder(size / 2)
  const result: number[] = []
  for (const h of half) result.push(h, size + 1 - h)
  return result
}

let _idCounter = 0
function resetIdCounter() { _idCounter = 0 }
function nextId(): string { return `de-${++_idCounter}` }

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Generate a full double-elimination bracket.
 *
 * @param teams - array of teams; paired into seeds via the standard bracket seed order
 * @returns flat array of DEBracketMatch with all nextMatchTempId / loserNextMatchTempId wired
 */
export function generateDoubleElimination(teams: BracketTeam[]): DEBracketMatch[] {
  resetIdCounter()

  if (teams.length < 2) throw new Error("Double Elimination requires at least 2 teams")

  const bracketSize = nextPow2(teams.length)
  const k = Math.log2(bracketSize)

  if (k < 2) {
    // k=1 means 2 teams — no LB makes sense; just produce a single final
    const gf: DEBracketMatch = {
      tempId: nextId(),
      bracketSection: "GF",
      round: 0,
      matchNumber: 1,
      teamA: teams[0] ?? null,
      teamB: teams[1] ?? null,
      nextMatchTempId: null,
      nextMatchSlot: null,
      loserNextMatchTempId: null,
      loserNextMatchSlot: null,
      isBye: false,
    }
    return [gf]
  }

  // ── Seed teams into slots ────────────────────────────────────────────────────
  const seedOrder = buildSeedOrder(bracketSize)
  const slots: (BracketTeam | null)[] = Array(bracketSize).fill(null)
  teams.forEach((team, i) => {
    if (i < seedOrder.length) slots[seedOrder[i] - 1] = team
  })

  const allMatches: DEBracketMatch[] = []

  // ── Winners Bracket ──────────────────────────────────────────────────────────

  // WB Round 1 (countdown = k, first played)
  const wbR1: DEBracketMatch[] = []
  for (let m = 0; m < bracketSize / 2; m++) {
    const slotA = slots[m * 2]
    const slotB = slots[m * 2 + 1]
    const isBye = (slotA !== null) !== (slotB !== null)
    wbR1.push({
      tempId: nextId(),
      bracketSection: "WB",
      round: k,
      matchNumber: m + 1,
      teamA: slotA,
      teamB: slotB,
      nextMatchTempId: null,
      nextMatchSlot: null,
      loserNextMatchTempId: null,
      loserNextMatchSlot: null,
      isBye,
    })
  }
  allMatches.push(...wbR1)

  // Subsequent WB rounds (WB R2 through WB Final at countdown = 1)
  const wbRounds: DEBracketMatch[][] = [wbR1]
  let prevWBRound = wbR1
  for (let r = k - 1; r >= 1; r--) {
    const matchCount = Math.pow(2, r - 1)
    const currentWBRound: DEBracketMatch[] = []
    for (let m = 0; m < matchCount; m++) {
      const match: DEBracketMatch = {
        tempId: nextId(),
        bracketSection: "WB",
        round: r,
        matchNumber: m + 1,
        teamA: null,
        teamB: null,
        nextMatchTempId: null,
        nextMatchSlot: null,
        loserNextMatchTempId: null,
        loserNextMatchSlot: null,
        isBye: false,
      }
      currentWBRound.push(match)
      allMatches.push(match)
      // Wire previous WB winners → this match
      prevWBRound[m * 2].nextMatchTempId = match.tempId
      prevWBRound[m * 2].nextMatchSlot = 0
      prevWBRound[m * 2 + 1].nextMatchTempId = match.tempId
      prevWBRound[m * 2 + 1].nextMatchSlot = 1
    }
    wbRounds.push(currentWBRound)
    prevWBRound = currentWBRound
  }
  // wbRounds[j-1] = WB seq-round j = WB countdown-round (k - j + 1)

  // ── Grand Final placeholder (WB champion gets slot 0, LB champion gets slot 1) ──
  const gfMatch: DEBracketMatch = {
    tempId: nextId(),
    bracketSection: "GF",
    round: 0,
    matchNumber: 1,
    teamA: null,
    teamB: null,
    nextMatchTempId: null,
    nextMatchSlot: null,
    loserNextMatchTempId: null,
    loserNextMatchSlot: null,
    isBye: false,
  }

  // Wire WB Final winner → GF slot 0
  const wbFinal = wbRounds[k - 1][0]
  wbFinal.nextMatchTempId = gfMatch.tempId
  wbFinal.nextMatchSlot = 0

  // ── Losers Bracket ───────────────────────────────────────────────────────────
  let lbRoundNum = 0
  let prevLBRound: DEBracketMatch[] = []

  for (let wbSeq = 1; wbSeq <= k; wbSeq++) {
    const wbSourceRound = wbRounds[wbSeq - 1]  // WB round whose losers enter LB now
    // Filter out bye matches (their "losers" don't exist as real players)
    const realWBMatches = wbSourceRound.filter((m) => !m.isBye)

    if (wbSeq === 1) {
      // LB R1: all WB-seq-R1 losers play each other
      lbRoundNum = 1
      const lbR1 = _buildLBInitial(realWBMatches, lbRoundNum)
      allMatches.push(...lbR1)
      prevLBRound = lbR1
    } else {
      // LB even round: merge prevLBRound winners + WB dropouts
      lbRoundNum++
      const lbMerge = _buildLBMerge(prevLBRound, realWBMatches, lbRoundNum)
      allMatches.push(...lbMerge)
      prevLBRound = lbMerge

      if (wbSeq < k) {
        // LB odd round: pure LB survivors battle
        lbRoundNum++
        const lbPure = _buildLBPure(prevLBRound, lbRoundNum)
        allMatches.push(...lbPure)
        prevLBRound = lbPure
      }
    }
  }

  // Wire LB Final winner → GF slot 1
  if (prevLBRound.length === 1) {
    prevLBRound[0].nextMatchTempId = gfMatch.tempId
    prevLBRound[0].nextMatchSlot = 1
  }

  allMatches.push(gfMatch)
  return allMatches
}

// ─── LB round builders ────────────────────────────────────────────────────────

/** LB R1: pair consecutive WB-R1 losers against each other. */
function _buildLBInitial(wbR1: DEBracketMatch[], lbRound: number): DEBracketMatch[] {
  const matches: DEBracketMatch[] = []
  for (let i = 0; i + 1 < wbR1.length; i += 2) {
    const m: DEBracketMatch = {
      tempId: nextId(),
      bracketSection: "LB",
      round: lbRound,
      matchNumber: matches.length + 1,
      teamA: null,
      teamB: null,
      nextMatchTempId: null,
      nextMatchSlot: null,
      loserNextMatchTempId: null,  // LB loser = eliminated
      loserNextMatchSlot: null,
      isBye: false,
    }
    matches.push(m)
    // WB loser of wbR1[i] → slot A; WB loser of wbR1[i+1] → slot B
    wbR1[i].loserNextMatchTempId = m.tempId
    wbR1[i].loserNextMatchSlot = 0
    wbR1[i + 1].loserNextMatchTempId = m.tempId
    wbR1[i + 1].loserNextMatchSlot = 1
  }
  return matches
}

/**
 * LB even round: each prevLBRound[i] winner faces wbSource[i] loser.
 * prevLBRound and wbSource must have equal length.
 */
function _buildLBMerge(
  prevLBRound: DEBracketMatch[],
  wbSource: DEBracketMatch[],
  lbRound: number,
): DEBracketMatch[] {
  const matches: DEBracketMatch[] = []
  for (let i = 0; i < prevLBRound.length; i++) {
    const m: DEBracketMatch = {
      tempId: nextId(),
      bracketSection: "LB",
      round: lbRound,
      matchNumber: matches.length + 1,
      teamA: null,  // winner of prevLBRound[i]
      teamB: null,  // loser of wbSource[i]
      nextMatchTempId: null,
      nextMatchSlot: null,
      loserNextMatchTempId: null,
      loserNextMatchSlot: null,
      isBye: false,
    }
    matches.push(m)
    // Wire prevLBRound[i] winner → slot A
    prevLBRound[i].nextMatchTempId = m.tempId
    prevLBRound[i].nextMatchSlot = 0
    // Wire wbSource[i] loser → slot B
    if (wbSource[i]) {
      wbSource[i].loserNextMatchTempId = m.tempId
      wbSource[i].loserNextMatchSlot = 1
    }
  }
  return matches
}

/** LB odd round (≥ 3): consecutive LB survivors play each other. */
function _buildLBPure(prevLBRound: DEBracketMatch[], lbRound: number): DEBracketMatch[] {
  const matches: DEBracketMatch[] = []
  for (let i = 0; i + 1 < prevLBRound.length; i += 2) {
    const m: DEBracketMatch = {
      tempId: nextId(),
      bracketSection: "LB",
      round: lbRound,
      matchNumber: matches.length + 1,
      teamA: null,
      teamB: null,
      nextMatchTempId: null,
      nextMatchSlot: null,
      loserNextMatchTempId: null,
      loserNextMatchSlot: null,
      isBye: false,
    }
    matches.push(m)
    prevLBRound[i].nextMatchTempId = m.tempId
    prevLBRound[i].nextMatchSlot = 0
    prevLBRound[i + 1].nextMatchTempId = m.tempId
    prevLBRound[i + 1].nextMatchSlot = 1
  }
  return matches
}
