import { describe, it, expect } from "vitest"
import {
  generateRoundRobinSchedule,
  validateNoRepeatOpponents,
  countAppearances,
} from "./roundRobin"

// ─── helpers ─────────────────────────────────────────────────────────────────

function ids(n: number): string[] {
  return Array.from({ length: n }, (_, i) => `p${i + 1}`)
}

// ─── basic structure ──────────────────────────────────────────────────────────

describe("generateRoundRobinSchedule", () => {
  it("throws for fewer than 4 players", () => {
    expect(() => generateRoundRobinSchedule(ids(2))).toThrow()
  })

  it("throws for an odd number of players", () => {
    expect(() => generateRoundRobinSchedule(ids(5))).toThrow()
  })

  it("4 players → 2 teams, 1 round, 1 match", () => {
    const schedule = generateRoundRobinSchedule(ids(4))
    expect(schedule.teams).toHaveLength(2)
    expect(schedule.totalRounds).toBe(1)
    expect(schedule.rounds).toHaveLength(1)
    expect(schedule.rounds[0].matches).toHaveLength(1)
    expect(schedule.rounds[0].byes).toHaveLength(0)
  })

  it("6 players → 3 teams, 3 rounds (odd teams → BYE padding)", () => {
    const schedule = generateRoundRobinSchedule(ids(6))
    // 3 teams → padded to 4 → 3 rounds
    expect(schedule.teams).toHaveLength(3)
    expect(schedule.totalRounds).toBe(3)
    expect(schedule.rounds).toHaveLength(3)
  })

  it("8 players → 4 teams, 3 rounds, 2 matches per round", () => {
    const schedule = generateRoundRobinSchedule(ids(8))
    expect(schedule.teams).toHaveLength(4)
    expect(schedule.totalRounds).toBe(3)
    for (const round of schedule.rounds) {
      expect(round.matches).toHaveLength(2)
      expect(round.byes).toHaveLength(0)
    }
  })

  it("every team pair meets exactly once (4 players)", () => {
    const schedule = generateRoundRobinSchedule(ids(4))
    expect(validateNoRepeatOpponents(schedule.rounds)).toBe(true)
  })

  it("every team pair meets exactly once (8 players)", () => {
    const schedule = generateRoundRobinSchedule(ids(8))
    expect(validateNoRepeatOpponents(schedule.rounds)).toBe(true)
  })

  it("every team pair meets exactly once (12 players)", () => {
    const schedule = generateRoundRobinSchedule(ids(12))
    expect(validateNoRepeatOpponents(schedule.rounds)).toBe(true)
  })

  it("total matches = T*(T-1)/2 for even T (4 players)", () => {
    const schedule = generateRoundRobinSchedule(ids(4))
    const total = schedule.rounds.reduce((s, r) => s + r.matches.length, 0)
    expect(total).toBe(1) // 2 teams → 1 match
  })

  it("total matches = T*(T-1)/2 for even T (8 players)", () => {
    const schedule = generateRoundRobinSchedule(ids(8))
    const total = schedule.rounds.reduce((s, r) => s + r.matches.length, 0)
    expect(total).toBe(6) // 4 teams → 6 matches
  })

  it("correct total matches for 6 players (3 teams → 3 matches)", () => {
    const schedule = generateRoundRobinSchedule(ids(6))
    const total = schedule.rounds.reduce((s, r) => s + r.matches.length, 0)
    expect(total).toBe(3) // 3 teams → 3 matches
  })

  it("teams are formed from sequential pairs", () => {
    const schedule = generateRoundRobinSchedule(["a", "b", "c", "d"])
    expect(schedule.teams[0]).toEqual(["a", "b"])
    expect(schedule.teams[1]).toEqual(["c", "d"])
  })

  it("bye round: one team per BYE round sits out in byes array (6 players)", () => {
    const schedule = generateRoundRobinSchedule(ids(6))
    // Each round should have exactly one team (2 players) sitting out
    for (const round of schedule.rounds) {
      // 1 match + 2 byes = 4 players accounted for, 6-4=2 in byes
      expect(round.byes).toHaveLength(2)
    }
  })

  it("all players appear an equal number of times (8 players)", () => {
    const schedule = generateRoundRobinSchedule(ids(8))
    const appearances = countAppearances(schedule.rounds)
    const counts = Object.values(appearances)
    expect(counts.every((c) => c === counts[0])).toBe(true)
  })

  it("each player plays in every non-bye round (8 players)", () => {
    const schedule = generateRoundRobinSchedule(ids(8))
    const appearances = countAppearances(schedule.rounds)
    // 4 teams, 3 rounds — each player appears in all 3 rounds
    for (const pid of ids(8)) {
      expect(appearances[pid]).toBe(3)
    }
  })
})
