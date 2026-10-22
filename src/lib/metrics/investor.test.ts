import { describe, expect, it } from "vitest"
import { activeByWeek, cumulativeByWeek, distinctActive, growth, lastWeeks, topCounts, weekKey } from "./investor"

describe("weekKey", () => {
  it("returns the Monday of the week", () => {
    expect(weekKey(new Date("2026-10-22T10:00:00Z"))).toBe("2026-10-19") // Thursday
    expect(weekKey(new Date("2026-10-19T10:00:00Z"))).toBe("2026-10-19") // Monday
    expect(weekKey(new Date("2026-10-25T10:00:00Z"))).toBe("2026-10-19") // Sunday
  })

  it("uses Riviera time: Sunday 23:30 UTC is already Monday in Rimini", () => {
    expect(weekKey(new Date("2026-08-09T23:30:00Z"))).toBe("2026-08-10")
  })
})

describe("lastWeeks", () => {
  it("lists consecutive Mondays, oldest first, ending with the current week", () => {
    expect(lastWeeks(new Date("2026-10-22T10:00:00Z"), 3)).toEqual(["2026-10-05", "2026-10-12", "2026-10-19"])
  })

  it("crosses the daylight-saving change without drifting", () => {
    expect(lastWeeks(new Date("2026-11-04T10:00:00Z"), 2)).toEqual(["2026-10-26", "2026-11-02"])
  })
})

describe("cumulativeByWeek", () => {
  it("starts from everyone who joined before the window", () => {
    const dates = [
      new Date("2025-01-01T10:00:00Z"),
      new Date("2026-10-06T10:00:00Z"),
      new Date("2026-10-20T10:00:00Z"),
      new Date("2026-10-21T10:00:00Z"),
    ]
    expect(cumulativeByWeek(dates, ["2026-10-05", "2026-10-12", "2026-10-19"])).toEqual([2, 2, 4])
  })
})

describe("active players", () => {
  const activity = [
    { playerId: "a", date: new Date("2026-10-20T10:00:00Z") },
    { playerId: "a", date: new Date("2026-10-21T10:00:00Z") },
    { playerId: "b", date: new Date("2026-10-13T10:00:00Z") },
    { playerId: "c", date: new Date("2026-09-01T10:00:00Z") },
  ]

  it("counts each player once in a window", () => {
    expect(distinctActive(activity, new Date("2026-10-01T00:00:00Z"), new Date("2026-10-22T00:00:00Z"))).toBe(2)
  })

  it("counts per week and ignores activity outside the weeks", () => {
    expect(activeByWeek(activity, ["2026-10-12", "2026-10-19"])).toEqual([1, 1])
  })
})

describe("growth", () => {
  it("is relative to the previous value", () => {
    expect(growth(15, 10)).toBeCloseTo(0.5)
    expect(growth(5, 10)).toBeCloseTo(-0.5)
  })

  it("is null without a base", () => {
    expect(growth(12, 0)).toBeNull()
  })
})

describe("topCounts", () => {
  it("ranks by count, then name, skipping blanks", () => {
    expect(topCounts(["Rimini", "Cesenatico", null, "Rimini", "", "Bellaria", "Cesenatico", "Rimini"], 2)).toEqual([
      { name: "Rimini", count: 3 },
      { name: "Cesenatico", count: 2 },
    ])
  })
})
