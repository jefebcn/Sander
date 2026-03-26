import { describe, it, expect } from "vitest"
import { generateDoubleElimination, type DEBracketMatch } from "./doubleElim"
import type { BracketTeam } from "./types"

// ─── helpers ─────────────────────────────────────────────────────────────────

function makeTeams(n: number): BracketTeam[] {
  const result: BracketTeam[] = []
  for (let i = 0; i < n; i++) {
    result.push({ playerIds: [`p${i * 2 + 1}`, `p${i * 2 + 2}`] })
  }
  return result
}

function matchCount(matches: DEBracketMatch[], section: "WB" | "LB" | "GF") {
  return matches.filter((m) => m.bracketSection === section && !m.isBye).length
}

function allLoserRoutings(matches: DEBracketMatch[]) {
  // All non-bye WB matches must have loserNextMatchTempId set (pointing to LB)
  return matches.filter((m) => m.bracketSection === "WB" && !m.isBye)
}

// ─── structure ───────────────────────────────────────────────────────────────

describe("generateDoubleElimination — 4 teams (k=2)", () => {
  const teams = makeTeams(4)
  const matches = generateDoubleElimination(teams)

  it("produces WB: 3 matches, LB: 2, GF: 1", () => {
    expect(matchCount(matches, "WB")).toBe(3)
    expect(matchCount(matches, "LB")).toBe(2)
    expect(matchCount(matches, "GF")).toBe(1)
  })

  it("total matches = 2*(N-1) = 6", () => {
    expect(matches.filter((m) => !m.isBye).length).toBe(6)
  })

  it("all WB R1 matches have loserNextMatchTempId set", () => {
    const wbR1 = matches.filter((m) => m.bracketSection === "WB" && m.round === 2)
    expect(wbR1.every((m) => m.loserNextMatchTempId !== null)).toBe(true)
  })

  it("WB Final loser goes to LB", () => {
    const wbFinal = matches.find((m) => m.bracketSection === "WB" && m.round === 1)!
    expect(wbFinal.loserNextMatchTempId).not.toBeNull()
  })

  it("GF has no loserNextMatchTempId (elimination)", () => {
    const gf = matches.find((m) => m.bracketSection === "GF")!
    expect(gf.loserNextMatchTempId).toBeNull()
  })

  it("WB Final winner → GF slot 0", () => {
    const wbFinal = matches.find((m) => m.bracketSection === "WB" && m.round === 1)!
    const gf = matches.find((m) => m.bracketSection === "GF")!
    expect(wbFinal.nextMatchTempId).toBe(gf.tempId)
    expect(wbFinal.nextMatchSlot).toBe(0)
  })

  it("LB champion → GF slot 1", () => {
    const lbFinal = matches.find((m) => m.bracketSection === "LB" && m.round === 2)!
    const gf = matches.find((m) => m.bracketSection === "GF")!
    expect(lbFinal.nextMatchTempId).toBe(gf.tempId)
    expect(lbFinal.nextMatchSlot).toBe(1)
  })
})

describe("generateDoubleElimination — 8 teams (k=3)", () => {
  const teams = makeTeams(8)
  const matches = generateDoubleElimination(teams)

  it("produces WB: 7 matches, LB: 6, GF: 1", () => {
    expect(matchCount(matches, "WB")).toBe(7)
    expect(matchCount(matches, "LB")).toBe(6)
    expect(matchCount(matches, "GF")).toBe(1)
  })

  it("total matches = 2*(N-1) = 14", () => {
    expect(matches.filter((m) => !m.isBye).length).toBe(14)
  })

  it("LB has 4 rounds (2*(k-1))", () => {
    const lbRounds = new Set(matches.filter((m) => m.bracketSection === "LB").map((m) => m.round))
    expect(lbRounds.size).toBe(4)
  })

  it("LB R1 has 2 matches (N/4)", () => {
    expect(matchCount(matches.filter((m) => m.round === 1) as DEBracketMatch[], "LB")).toBe(2)
  })

  it("all WB non-bye matches have loserNextMatchTempId set", () => {
    const wbNonBye = allLoserRoutings(matches)
    expect(wbNonBye.every((m) => m.loserNextMatchTempId !== null)).toBe(true)
  })

  it("every loserNextMatchTempId points to an existing LB match", () => {
    const lbIds = new Set(matches.filter((m) => m.bracketSection === "LB").map((m) => m.tempId))
    const wbNonBye = allLoserRoutings(matches)
    expect(wbNonBye.every((m) => lbIds.has(m.loserNextMatchTempId!))).toBe(true)
  })

  it("all tempIds are unique", () => {
    const ids = matches.map((m) => m.tempId)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it("WB Final winner → GF slot 0", () => {
    const wbFinal = matches.find((m) => m.bracketSection === "WB" && m.round === 1)!
    const gf = matches.find((m) => m.bracketSection === "GF")!
    expect(wbFinal.nextMatchTempId).toBe(gf.tempId)
    expect(wbFinal.nextMatchSlot).toBe(0)
  })
})

describe("generateDoubleElimination — 6 teams (padded to 8)", () => {
  const teams = makeTeams(6)
  const matches = generateDoubleElimination(teams)

  it("bracket is padded to 8-team size", () => {
    // Should have byes but overall WB structure is 8-team sized
    const wbAll = matches.filter((m) => m.bracketSection === "WB")
    expect(wbAll.length).toBe(7) // 4 + 2 + 1
  })

  it("all tempIds unique", () => {
    const ids = matches.map((m) => m.tempId)
    expect(new Set(ids).size).toBe(ids.length)
  })
})
