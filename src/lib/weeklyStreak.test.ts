import { describe, it, expect } from "vitest"
import { weekKey, weeklyStreak } from "./weeklyStreak"

const at = (iso: string) => new Date(iso)

describe("weekKey", () => {
  it("returns the Monday of the week, Riviera time", () => {
    expect(weekKey(at("2026-10-14T10:00:00Z"))).toBe("2026-10-12") // Wednesday
    expect(weekKey(at("2026-10-12T00:30:00Z"))).toBe("2026-10-12") // Monday
    expect(weekKey(at("2026-10-18T20:00:00Z"))).toBe("2026-10-12") // Sunday evening
  })

  it("uses the Riviera clock, not UTC, at the week boundary", () => {
    // Sunday 23:30 UTC is already Monday 01:30 in Rome (CEST).
    expect(weekKey(at("2026-10-18T23:30:00Z"))).toBe("2026-10-19")
  })
})

describe("weeklyStreak", () => {
  const now = at("2026-10-17T12:00:00Z") // Saturday, week of 2026-10-12

  it("counts consecutive weeks ending this week", () => {
    const played = [at("2026-10-15T17:00:00Z"), at("2026-10-08T17:00:00Z"), at("2026-10-01T17:00:00Z")]
    expect(weeklyStreak(played, now)).toEqual({ weeks: 3, playedThisWeek: true })
  })

  it("keeps the run alive from last week while this week isn't over", () => {
    const played = [at("2026-10-08T17:00:00Z"), at("2026-10-01T17:00:00Z")]
    expect(weeklyStreak(played, now)).toEqual({ weeks: 2, playedThisWeek: false })
  })

  it("is broken by a week without matches", () => {
    const played = [at("2026-10-15T17:00:00Z"), at("2026-09-24T17:00:00Z")]
    expect(weeklyStreak(played, now)).toEqual({ weeks: 1, playedThisWeek: true })
  })

  it("is zero when the last match is two weeks old or there are none", () => {
    expect(weeklyStreak([at("2026-09-30T17:00:00Z")], now)).toEqual({ weeks: 0, playedThisWeek: false })
    expect(weeklyStreak([], now)).toEqual({ weeks: 0, playedThisWeek: false })
  })

  it("counts several matches in one week once", () => {
    const played = [at("2026-10-13T17:00:00Z"), at("2026-10-14T17:00:00Z"), at("2026-10-16T09:00:00Z")]
    expect(weeklyStreak(played, now).weeks).toBe(1)
  })
})
