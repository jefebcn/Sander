import { describe, it, expect } from "vitest"
import {
  monthKey,
  prevMonthKey,
  lastMonths,
  sumByMonth,
  average,
  monthlyRetention,
  seasonOf,
  seasonRetention,
} from "./compute"

const d = (iso: string) => new Date(iso)

describe("monthKey", () => {
  it("buckets by Riviera time, not UTC", () => {
    // 22:30 UTC on 31 July is 00:30 on 1 August in Rimini (UTC+2 in summer).
    expect(monthKey(d("2026-07-31T22:30:00Z"))).toBe("2026-08")
    expect(monthKey(d("2026-07-31T21:30:00Z"))).toBe("2026-07")
  })

  it("handles winter time (UTC+1)", () => {
    expect(monthKey(d("2026-12-31T23:30:00Z"))).toBe("2027-01")
  })
})

describe("prevMonthKey / lastMonths", () => {
  it("crosses the year boundary", () => {
    expect(prevMonthKey("2026-01")).toBe("2025-12")
    expect(prevMonthKey("2026-10")).toBe("2026-09")
  })

  it("lists the window oldest first, ending with the current month", () => {
    expect(lastMonths(d("2026-02-15T12:00:00Z"), 4)).toEqual([
      "2025-11", "2025-12", "2026-01", "2026-02",
    ])
  })
})

describe("sumByMonth", () => {
  const months = ["2026-07", "2026-08"]

  it("totals per month, zero-filling and ignoring rows outside the window", () => {
    const rows = [
      { at: d("2026-07-10T10:00:00Z"), v: 1500 },
      { at: d("2026-08-02T10:00:00Z"), v: 2000 },
      { at: d("2026-08-20T10:00:00Z"), v: 500 },
      { at: d("2026-03-01T10:00:00Z"), v: 9999 }, // outside
      { at: null, v: 9999 }, // undated
    ]
    expect(sumByMonth(rows, (r) => r.at, (r) => r.v, months)).toEqual({
      "2026-07": 1500,
      "2026-08": 2500,
    })
  })

  it("returns zeros, not missing keys, when there is no data", () => {
    expect(sumByMonth([], () => null, () => 0, months)).toEqual({ "2026-07": 0, "2026-08": 0 })
  })
})

describe("average", () => {
  it("is null with no data, so 'nothing yet' never reads as 0 €", () => {
    expect(average([])).toBeNull()
  })

  it("averages values", () => {
    expect(average([1000, 2000, 3000])).toBe(2000)
  })
})

describe("monthlyRetention", () => {
  const activity = [
    { playerId: "veteran", date: d("2026-05-10T10:00:00Z") }, // before the window
    { playerId: "veteran", date: d("2026-07-10T10:00:00Z") },
    { playerId: "a", date: d("2026-07-12T10:00:00Z") },
    { playerId: "a", date: d("2026-07-20T10:00:00Z") }, // twice in a month = once
    { playerId: "b", date: d("2026-07-15T10:00:00Z") },
    { playerId: "a", date: d("2026-08-03T10:00:00Z") },
    { playerId: "c", date: d("2026-08-04T10:00:00Z") },
  ]

  it("counts distinct actives, true newcomers and players retained from last month", () => {
    const [jul, aug] = monthlyRetention(activity, ["2026-07", "2026-08"])

    // veteran played in May, so in July they are active but not new.
    expect(jul).toMatchObject({ month: "2026-07", active: 3, newcomers: 2, retained: 0 })
    // Nobody played in June → no base to retain from.
    expect(jul.retainedPct).toBeNull()

    // Of July's 3, only "a" came back; "c" is new.
    expect(aug).toMatchObject({ month: "2026-08", active: 2, newcomers: 1, retained: 1 })
    expect(aug.retainedPct).toBeCloseTo(1 / 3)
  })

  it("reports an empty month as zero activity, not an error", () => {
    const [sep] = monthlyRetention(activity, ["2026-09"])
    expect(sep).toEqual({ month: "2026-09", active: 0, newcomers: 0, retained: 0, retainedPct: 0 })
  })
})

describe("seasonOf", () => {
  it("is May–September only", () => {
    expect(seasonOf(d("2026-05-01T10:00:00Z"))).toBe(2026)
    expect(seasonOf(d("2026-09-30T10:00:00Z"))).toBe(2026)
    expect(seasonOf(d("2026-04-30T10:00:00Z"))).toBeNull()
    expect(seasonOf(d("2026-10-01T10:00:00Z"))).toBeNull()
  })
})

describe("seasonRetention", () => {
  it("leaves a season's return rate open until the next season has started", () => {
    const result = seasonRetention([
      { playerId: "a", date: d("2026-07-01T10:00:00Z") },
      { playerId: "b", date: d("2026-08-01T10:00:00Z") },
      { playerId: "a", date: d("2026-11-01T10:00:00Z") }, // off-season: ignored
    ])
    expect(result).toEqual([{ season: 2026, players: 2, returned: null, returnedPct: null }])
  })

  it("measures who came back the following season", () => {
    const result = seasonRetention([
      { playerId: "a", date: d("2026-07-01T10:00:00Z") },
      { playerId: "b", date: d("2026-08-01T10:00:00Z") },
      { playerId: "a", date: d("2027-06-01T10:00:00Z") },
      { playerId: "new", date: d("2027-06-02T10:00:00Z") },
    ])
    expect(result[0]).toEqual({ season: 2026, players: 2, returned: 1, returnedPct: 0.5 })
    expect(result[1]).toMatchObject({ season: 2027, players: 2, returned: null })
  })
})
