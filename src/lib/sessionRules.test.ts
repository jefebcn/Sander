import { describe, it, expect } from "vitest"
import {
  sessionDateError,
  joinWindowOpen,
  completionError,
  countsForProgress,
  isStale,
} from "./sessionRules"

const now = new Date("2026-10-16T18:00:00Z")
const min = (m: number) => new Date(now.getTime() + m * 60_000)

describe("sessionDateError", () => {
  it("accepts future dates and a few minutes of slack", () => {
    expect(sessionDateError(min(60), now)).toBeNull()
    expect(sessionDateError(min(-3), now)).toBeNull()
  })
  it("rejects past dates and invalid ones", () => {
    expect(sessionDateError(min(-60), now)).toMatch(/già passata/)
    expect(sessionDateError(new Date("nope"), now)).toMatch(/non valida/)
  })
})

describe("joinWindowOpen", () => {
  it("is open before the start and for 30 minutes after", () => {
    expect(joinWindowOpen(min(10), now)).toBe(true)
    expect(joinWindowOpen(min(-29), now)).toBe(true)
    expect(joinWindowOpen(min(-31), now)).toBe(false)
  })
})

describe("completionError", () => {
  const two = [
    { team: 0, playerId: "a" },
    { team: 1, playerId: "b" },
  ]
  it("allows a started match with both teams", () => {
    expect(completionError({ status: "OPEN", date: min(-60), now, participants: two, withScore: true })).toBeNull()
  })
  it("rejects closed, cancelled or future matches", () => {
    expect(completionError({ status: "CANCELLED", date: min(-60), now, participants: two, withScore: false })).toMatch(/non può/)
    expect(completionError({ status: "COMPLETED", date: min(-60), now, participants: two, withScore: false })).toMatch(/non può/)
    expect(completionError({ status: "OPEN", date: min(120), now, participants: two, withScore: false })).toMatch(/non è ancora iniziata/)
  })
  it("allows entering results from 15 minutes before the start", () => {
    expect(completionError({ status: "FULL", date: min(10), now, participants: two, withScore: false })).toBeNull()
  })
  it("needs two players and, with a score, both teams filled", () => {
    expect(completionError({ status: "OPEN", date: min(-60), now, participants: [two[0]], withScore: false })).toMatch(/almeno 2/)
    const oneSided = [
      { team: 0, playerId: "a" },
      { team: 0, playerId: "b" },
    ]
    expect(completionError({ status: "OPEN", date: min(-60), now, participants: oneSided, withScore: true })).toMatch(/entrambe/)
    expect(completionError({ status: "OPEN", date: min(-60), now, participants: oneSided, withScore: false })).toBeNull()
  })
})

describe("countsForProgress", () => {
  it("needs two real accounts, guests don't count", () => {
    expect(countsForProgress([{ playerId: "a" }, { playerId: null }])).toBe(false)
    expect(countsForProgress([{ playerId: "a" }, { playerId: "b" }])).toBe(true)
  })
})

describe("staleness", () => {
  it("marks matches older than a week as stale", () => {
    expect(isStale(new Date(now.getTime() - 8 * 86400_000), now)).toBe(true)
    expect(isStale(new Date(now.getTime() - 6 * 86400_000), now)).toBe(false)
  })
})
