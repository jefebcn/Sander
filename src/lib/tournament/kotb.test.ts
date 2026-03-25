import { describe, it, expect } from "vitest"
import {
  generateKOTBSchedule,
  validateNoRepeatPartners,
  applyMatchResult,
  rankStandings,
} from "./kotb"
import type { StandingEntry } from "./types"

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeIds(n: number): string[] {
  return Array.from({ length: n }, (_, i) => `p${i + 1}`)
}

function makeStanding(playerId: string, overrides: Partial<StandingEntry> = {}): StandingEntry {
  return {
    playerId,
    points: 0,
    matchesWon: 0,
    matchesLost: 0,
    pointsFor: 0,
    pointsAgainst: 0,
    rank: 0,
    ...overrides,
  }
}

// ─── Partner Uniqueness ───────────────────────────────────────────────────────

describe("KOTB — partner uniqueness", () => {
  it("8 players: no partner appears twice", () => {
    const schedule = generateKOTBSchedule(makeIds(8))
    expect(validateNoRepeatPartners(schedule.rounds)).toBe(true)
  })

  it("12 players: no partner appears twice", () => {
    const schedule = generateKOTBSchedule(makeIds(12))
    expect(validateNoRepeatPartners(schedule.rounds)).toBe(true)
  })

  it("16 players: no partner appears twice", () => {
    const schedule = generateKOTBSchedule(makeIds(16))
    expect(validateNoRepeatPartners(schedule.rounds)).toBe(true)
  })
})

// ─── Round Structure ──────────────────────────────────────────────────────────

describe("KOTB — round structure", () => {
  it("8 players: each round has 2 matches", () => {
    const schedule = generateKOTBSchedule(makeIds(8))
    schedule.rounds.forEach((r) => expect(r.matches).toHaveLength(2))
  })

  it("each match has exactly 4 unique player IDs", () => {
    const schedule = generateKOTBSchedule(makeIds(8))
    schedule.rounds.forEach((r) => {
      r.matches.forEach((m) => {
        const ids = [...m.teamA, ...m.teamB]
        expect(new Set(ids).size).toBe(4)
      })
    })
  })

  it("8 players: produces 7 rounds (n-1)", () => {
    const schedule = generateKOTBSchedule(makeIds(8))
    expect(schedule.totalRounds).toBe(7)
    expect(schedule.rounds).toHaveLength(7)
  })

  it("respects requestedRounds cap", () => {
    const schedule = generateKOTBSchedule(makeIds(8), 3)
    expect(schedule.rounds).toHaveLength(3)
  })

  it("throws for fewer than 4 players", () => {
    expect(() => generateKOTBSchedule(makeIds(3))).toThrow()
  })
})

// ─── Bye Handling ─────────────────────────────────────────────────────────────

describe("KOTB — bye handling", () => {
  it("10 players: generates at least one bye across all rounds", () => {
    const schedule = generateKOTBSchedule(makeIds(10))
    const totalByes = schedule.rounds.flatMap((r) => r.byes).length
    expect(totalByes).toBeGreaterThan(0)
  })

  it("bye player IDs are drawn from the original player list", () => {
    const players = makeIds(10)
    const schedule = generateKOTBSchedule(players)
    schedule.rounds.forEach((r) => {
      r.byes.forEach((b) => expect(players).toContain(b))
    })
  })
})

// ─── Score Application ────────────────────────────────────────────────────────

describe("KOTB — score application", () => {
  it("gives 3 pts to winner and 1 pt to loser", () => {
    const standings = makeIds(4).map((id) => makeStanding(id))
    const updated = applyMatchResult(standings, {
      teamAScore: 21,
      teamBScore: 15,
      teamAPlayerIds: ["p1", "p2"],
      teamBPlayerIds: ["p3", "p4"],
    })
    const p1 = updated.find((s) => s.playerId === "p1")!
    const p3 = updated.find((s) => s.playerId === "p3")!
    expect(p1.points).toBe(3)
    expect(p3.points).toBe(1)
  })

  it("increments matchesWon for winning team", () => {
    const standings = makeIds(4).map((id) => makeStanding(id))
    const updated = applyMatchResult(standings, {
      teamAScore: 21,
      teamBScore: 18,
      teamAPlayerIds: ["p1", "p2"],
      teamBPlayerIds: ["p3", "p4"],
    })
    expect(updated.find((s) => s.playerId === "p1")!.matchesWon).toBe(1)
    expect(updated.find((s) => s.playerId === "p3")!.matchesLost).toBe(1)
  })

  it("records pointsFor and pointsAgainst correctly", () => {
    const standings = makeIds(4).map((id) => makeStanding(id))
    const updated = applyMatchResult(standings, {
      teamAScore: 21,
      teamBScore: 14,
      teamAPlayerIds: ["p1", "p2"],
      teamBPlayerIds: ["p3", "p4"],
    })
    expect(updated.find((s) => s.playerId === "p1")!.pointsFor).toBe(21)
    expect(updated.find((s) => s.playerId === "p1")!.pointsAgainst).toBe(14)
    expect(updated.find((s) => s.playerId === "p3")!.pointsFor).toBe(14)
    expect(updated.find((s) => s.playerId === "p3")!.pointsAgainst).toBe(21)
  })

  it("leaves players not in the match unchanged", () => {
    const standings = makeIds(6).map((id) => makeStanding(id))
    const updated = applyMatchResult(standings, {
      teamAScore: 21,
      teamBScore: 18,
      teamAPlayerIds: ["p1", "p2"],
      teamBPlayerIds: ["p3", "p4"],
    })
    const p5 = updated.find((s) => s.playerId === "p5")!
    expect(p5.points).toBe(0)
  })
})

// ─── Ranking ──────────────────────────────────────────────────────────────────

describe("KOTB — ranking", () => {
  it("assigns rank numbers starting from 1", () => {
    const standings = makeIds(4).map((id) => makeStanding(id))
    const ranked = rankStandings(standings)
    expect(ranked.map((s) => s.rank)).toEqual([1, 2, 3, 4])
  })

  it("sorts by points descending", () => {
    const standings = [
      makeStanding("p1", { points: 9 }),
      makeStanding("p2", { points: 12 }),
      makeStanding("p3", { points: 6 }),
    ]
    const ranked = rankStandings(standings)
    expect(ranked[0].playerId).toBe("p2")
    expect(ranked[1].playerId).toBe("p1")
    expect(ranked[2].playerId).toBe("p3")
  })

  it("breaks ties by point differential", () => {
    const standings = [
      makeStanding("p1", { points: 9, pointsFor: 60, pointsAgainst: 50 }), // +10
      makeStanding("p2", { points: 9, pointsFor: 55, pointsAgainst: 40 }), // +15
    ]
    const ranked = rankStandings(standings)
    expect(ranked[0].playerId).toBe("p2")
  })

  it("breaks differential ties by points scored", () => {
    const standings = [
      makeStanding("p1", { points: 9, pointsFor: 60, pointsAgainst: 50 }), // +10, 60
      makeStanding("p2", { points: 9, pointsFor: 65, pointsAgainst: 55 }), // +10, 65
    ]
    const ranked = rankStandings(standings)
    expect(ranked[0].playerId).toBe("p2")
  })
})
