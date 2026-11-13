import { describe, it, expect } from "vitest"
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

/** First-round pairings as [seedA, seedB] (seed = 1-based team index, null = bye). */
function firstRoundPairings(teams: BracketTeam[]) {
  const bracket = generateBracket(teams)
  const firstRound = Math.max(...bracket.map((m) => m.round))
  const seedOf = (t: BracketTeam | null) => (t ? teams.indexOf(t) + 1 : null)
  return bracket
    .filter((m) => m.round === firstRound)
    .sort((a, b) => a.matchNumber - b.matchNumber)
    .map((m) => [seedOf(m.teamA), seedOf(m.teamB)])
}

describe("Bracket seeding (first-round pairings)", () => {
  it("4 teams: 1v4, 2v3", () => {
    expect(firstRoundPairings(makeTeams(4))).toEqual([
      [1, 4],
      [2, 3],
    ])
  })

  it("8 teams: 1v8, 4v5, 2v7, 3v6", () => {
    expect(firstRoundPairings(makeTeams(8))).toEqual([
      [1, 8],
      [4, 5],
      [2, 7],
      [3, 6],
    ])
  })

  it("5 teams: seeds 1-3 get byes, 4v5 is the only real match", () => {
    expect(firstRoundPairings(makeTeams(5))).toEqual([
      [1, null],
      [4, 5],
      [2, null],
      [3, null],
    ])
  })

  it("every bye pairs exactly one real team with an empty slot", () => {
    for (let n = 2; n <= 16; n++) {
      const bracket = generateBracket(makeTeams(n))
      const firstRound = Math.max(...bracket.map((m) => m.round))
      for (const m of bracket.filter((x) => x.round === firstRound)) {
        expect(m.teamA === null && m.teamB === null).toBe(false)
        expect(m.isBye).toBe(m.teamA === null || m.teamB === null)
      }
    }
  })

  it("seeds 1 and 2 can only meet in the final (8 teams)", () => {
    const bracket = generateBracket(makeTeams(8))
    const r1 = bracket.filter((m) => m.round === 3).sort((a, b) => a.matchNumber - b.matchNumber)
    const semis = bracket.filter((m) => m.round === 2).sort((a, b) => a.matchNumber - b.matchNumber)
    const final = bracket.find((m) => m.round === 1)!
    // Seed 1's half feeds semi 1 → final slot 0; seed 2's half feeds semi 2 → final slot 1
    expect(r1[0].nextMatchTempId).toBe(semis[0].tempId)
    expect(r1[0].nextMatchSlot).toBe(0)
    expect(r1[1].nextMatchTempId).toBe(semis[0].tempId)
    expect(r1[1].nextMatchSlot).toBe(1)
    expect(r1[2].nextMatchTempId).toBe(semis[1].tempId)
    expect(r1[2].nextMatchSlot).toBe(0)
    expect(r1[3].nextMatchTempId).toBe(semis[1].tempId)
    expect(r1[3].nextMatchSlot).toBe(1)
    expect(semis[0].nextMatchTempId).toBe(final.tempId)
    expect(semis[0].nextMatchSlot).toBe(0)
    expect(semis[1].nextMatchTempId).toBe(final.tempId)
    expect(semis[1].nextMatchSlot).toBe(1)
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
