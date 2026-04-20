import { describe, it, expect } from "vitest"
import {
  balanceTeams,
  formBalancedPairs,
  pairTeamsIntoMatches,
  effectiveLevel,
  type PlayerWithLevel,
  type BalancedMatch,
} from "./balancing"

function p(id: string, lvl: number | null): PlayerWithLevel {
  return { id, skillLevel: lvl }
}

function teamSum(ids: readonly string[], levels: Record<string, number>) {
  return ids.reduce((s, id) => s + levels[id], 0)
}

function maxMatchDelta(matches: BalancedMatch[]): number {
  return matches.reduce(
    (m, match) => Math.max(m, Math.abs(match.teamA.sum - match.teamB.sum)),
    0,
  )
}

function allPlayersAppearOnce(matches: BalancedMatch[], expected: number): boolean {
  const seen = new Set<string>()
  for (const m of matches) {
    for (const id of [...m.teamA.playerIds, ...m.teamB.playerIds]) {
      if (seen.has(id)) return false
      seen.add(id)
    }
  }
  return seen.size === expected
}

describe("effectiveLevel", () => {
  it("treats null and out-of-range as 2 (prudent default)", () => {
    expect(effectiveLevel({ id: "a", skillLevel: null })).toBe(2)
    expect(effectiveLevel({ id: "a", skillLevel: 1 })).toBe(1)
    expect(effectiveLevel({ id: "a", skillLevel: 2 })).toBe(2)
    expect(effectiveLevel({ id: "a", skillLevel: 3 })).toBe(3)
  })
})

describe("formBalancedPairs", () => {
  it("accoppia high+low per bilanciare", () => {
    const pairs = formBalancedPairs([
      p("a", 3),
      p("b", 3),
      p("c", 1),
      p("d", 1),
    ])
    // Sorted DESC: a(3), b(3), c(1), d(1) → (a,d) (b,c) both sum 4
    expect(pairs).toHaveLength(2)
    expect(pairs[0].sum).toBe(4)
    expect(pairs[1].sum).toBe(4)
  })
})

describe("balanceTeams", () => {
  it("4 L3 → un solo match L3+L3 vs L3+L3", () => {
    const matches = balanceTeams([p("a", 3), p("b", 3), p("c", 3), p("d", 3)])
    expect(matches).toHaveLength(1)
    expect(matches[0].teamA.sum).toBe(6)
    expect(matches[0].teamB.sum).toBe(6)
  })

  it("2 L3 + 6 L1 → evita match con somme 6 vs 2", () => {
    const players = [
      p("x", 3), p("y", 3),
      p("a", 1), p("b", 1), p("c", 1), p("d", 1), p("e", 1), p("f", 1),
    ]
    const matches = balanceTeams(players)
    expect(matches).toHaveLength(2)
    // Con 2 L3 non possiamo fare un match L3+L3 vs L3+L3 ma neanche
    // creare match 6 vs 2: i 2 L3 devono essere divisi come partner di L1.
    expect(maxMatchDelta(matches)).toBeLessThan(4)
  })

  it("4 L1 + 4 L2 → max |sumA − sumB| ≤ 1", () => {
    const players = [
      p("a", 1), p("b", 1), p("c", 1), p("d", 1),
      p("e", 2), p("f", 2), p("g", 2), p("h", 2),
    ]
    const matches = balanceTeams(players)
    expect(matches).toHaveLength(2)
    expect(maxMatchDelta(matches)).toBeLessThanOrEqual(1)
  })

  it("1 L3 + 3 L2 + 4 L1 (8 giocatori, no L3+L3 possibile) → match bilanciati", () => {
    const players = [
      p("x", 3),
      p("a", 2), p("b", 2), p("c", 2),
      p("d", 1), p("e", 1), p("f", 1), p("g", 1),
    ]
    const matches = balanceTeams(players)
    expect(matches).toHaveLength(2)
    expect(maxMatchDelta(matches)).toBeLessThan(4)
  })

  it("8 giocatori mix (2 L3 + 4 L2 + 2 L1) → max delta ≤ 2", () => {
    const players = [
      p("x", 3), p("y", 3),
      p("a", 2), p("b", 2), p("c", 2), p("d", 2),
      p("e", 1), p("f", 1),
    ]
    const matches = balanceTeams(players)
    expect(matches).toHaveLength(2)
    expect(maxMatchDelta(matches)).toBeLessThanOrEqual(2)
  })

  it("ogni giocatore appare esattamente una volta per round", () => {
    const players = [
      p("a", 3), p("b", 3), p("c", 3), p("d", 3),
      p("e", 2), p("f", 2), p("g", 1), p("h", 1),
    ]
    const matches = balanceTeams(players)
    expect(allPlayersAppearOnce(matches, 8)).toBe(true)
  })

  it("skillLevel null trattato come 2", () => {
    const levels: Record<string, number> = {
      a: 2, b: 2, c: 2, d: 2,
    }
    const players = [
      p("a", null), p("b", null),
      p("c", null), p("d", null),
    ]
    const matches = balanceTeams(players)
    expect(matches).toHaveLength(1)
    expect(teamSum(matches[0].teamA.playerIds, levels)).toBe(4)
    expect(teamSum(matches[0].teamB.playerIds, levels)).toBe(4)
  })

  it("lancia errore con numero giocatori non multiplo di 4", () => {
    expect(() => balanceTeams([p("a", 2), p("b", 2)])).toThrow()
  })

  it("12 giocatori con 4 L3 + 4 L2 + 4 L1 → almeno 1 match L3+L3 vs L3+L3", () => {
    const players = [
      p("x1", 3), p("x2", 3), p("x3", 3), p("x4", 3),
      p("m1", 2), p("m2", 2), p("m3", 2), p("m4", 2),
      p("l1", 1), p("l2", 1), p("l3", 1), p("l4", 1),
    ]
    const matches = balanceTeams(players)
    expect(matches).toHaveLength(3)
    const hasL3DerbyCount = matches.filter(
      (m) => m.teamA.sum === 6 && m.teamB.sum === 6,
    ).length
    expect(hasL3DerbyCount).toBeGreaterThanOrEqual(1)
    expect(maxMatchDelta(matches)).toBeLessThan(4)
  })
})

describe("pairTeamsIntoMatches", () => {
  it("accoppia due team con somme più vicine", () => {
    const teams = [
      { playerIds: ["a", "b"] as [string, string], sum: 6 },
      { playerIds: ["c", "d"] as [string, string], sum: 2 },
      { playerIds: ["e", "f"] as [string, string], sum: 6 },
      { playerIds: ["g", "h"] as [string, string], sum: 2 },
    ]
    const matches = pairTeamsIntoMatches(teams)
    expect(matches).toHaveLength(2)
    // Nessun match 6 vs 2 — preferiti 6 vs 6 e 2 vs 2
    expect(maxMatchDelta(matches)).toBe(0)
  })
})
