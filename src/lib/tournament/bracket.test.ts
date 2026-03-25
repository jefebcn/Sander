import { describe, it, expect, beforeEach } from "vitest"
import { generateBracket, advanceWinner } from "./bracket"
import type { BracketTeam } from "./types"

function makeTeams(n: number): BracketTeam[] {
  return Array.from({ length: n }, (_, i) => ({
    playerIds: [`p${i * 2 + 1}`, `p${i * 2 + 2}`],
    label: `Team ${i + 1}`,
  }))
}

describe("Bracket generation", () => {
  it("8 teams: produces 7 total non-bye matches", () => {
    const bracket = generateBracket(makeTeams(8))
    expect(bracket.filter((m) => !m.isBye)).toHaveLength(7)
  })

  it("4 teams: produces 3 total matches", () => {
    const bracket = generateBracket(makeTeams(4))
    expect(bracket.filter((m) => !m.isBye)).toHaveLength(3)
  })

  it("5 teams: bracket size is 8 with 3 byes", () => {
    const bracket = generateBracket(makeTeams(5))
    expect(bracket.filter((m) => m.isBye)).toHaveLength(3)
  })

  it("final match has no nextMatchTempId", () => {
    const bracket = generateBracket(makeTeams(8))
    const final = bracket.find((m) => m.round === 1)!
    expect(final).toBeDefined()
    expect(final.nextMatchTempId).toBeNull()
  })

  it("first-round matches all have nextMatchTempId set", () => {
    const bracket = generateBracket(makeTeams(8))
    const totalRounds = Math.log2(8)
    const firstRound = bracket.filter((m) => m.round === totalRounds)
    firstRound.forEach((m) => expect(m.nextMatchTempId).not.toBeNull())
  })

  it("each match has a unique tempId", () => {
    const bracket = generateBracket(makeTeams(8))
    const ids = bracket.map((m) => m.tempId)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it("semi-final matches advance to the final", () => {
    const bracket = generateBracket(makeTeams(4))
    const semis = bracket.filter((m) => m.round === 2)
    const final = bracket.find((m) => m.round === 1)!
    semis.forEach((s) => expect(s.nextMatchTempId).toBe(final.tempId))
  })
})

describe("Winner advancement", () => {
  it("advances team A winner to next match slot 0", () => {
    const bracket = generateBracket(makeTeams(4))
    const firstRound = bracket.filter((m) => m.round === 2)
    const match = firstRound[0]

    const updated = advanceWinner(bracket, match.tempId, 0)
    const next = updated.find((m) => m.tempId === match.nextMatchTempId)!
    expect(next.teamA).toEqual(match.teamA)
  })

  it("advances team B winner to next match slot 1", () => {
    const bracket = generateBracket(makeTeams(4))
    const firstRound = bracket.filter((m) => m.round === 2)
    const match = firstRound[1]

    const updated = advanceWinner(bracket, match.tempId, 1)
    const next = updated.find((m) => m.tempId === match.nextMatchTempId)!
    expect(next.teamB).toEqual(match.teamB)
  })

  it("does nothing when match has no nextMatchTempId", () => {
    const bracket = generateBracket(makeTeams(4))
    const final = bracket.find((m) => m.round === 1)!
    const updated = advanceWinner(bracket, final.tempId, 0)
    expect(updated).toEqual(bracket)
  })
})
