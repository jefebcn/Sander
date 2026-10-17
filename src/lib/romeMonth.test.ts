import { describe, it, expect } from "vitest"
import { romeMonthStart, romeMonthRange, romeYearMonth, romeWeekStart } from "./romeMonth"

describe("romeMonthStart", () => {
  it("is 23:00 UTC of the previous day in winter (CET, +1)", () => {
    expect(romeMonthStart(2026, 1).toISOString()).toBe("2025-12-31T23:00:00.000Z")
    expect(romeMonthStart(2026, 11).toISOString()).toBe("2026-10-31T23:00:00.000Z")
  })

  it("is 22:00 UTC of the previous day in summer (CEST, +2)", () => {
    expect(romeMonthStart(2026, 7).toISOString()).toBe("2026-06-30T22:00:00.000Z")
    expect(romeMonthStart(2026, 10).toISOString()).toBe("2026-09-30T22:00:00.000Z")
  })

  it("rolls month 13 into January of the next year", () => {
    expect(romeMonthStart(2026, 13).toISOString()).toBe("2026-12-31T23:00:00.000Z")
  })
})

describe("romeYearMonth", () => {
  it("reads the month on the Rome calendar, not UTC", () => {
    // CET (+1) applies from 25 Oct 2026: 23:30 UTC on 31 Oct is 00:30 on 1 Nov in Rome.
    expect(romeYearMonth(new Date("2026-10-31T23:30:00Z"))).toEqual({ year: 2026, month: 11 })
    expect(romeYearMonth(new Date("2026-10-31T22:30:00Z"))).toEqual({ year: 2026, month: 10 })
  })
})

describe("romeMonthRange", () => {
  it("returns this month as a half-open range", () => {
    const r = romeMonthRange(new Date("2026-10-16T10:00:00Z"))
    expect(r.year).toBe(2026)
    expect(r.month).toBe(10)
    expect(r.start.toISOString()).toBe("2026-09-30T22:00:00.000Z")
    expect(r.end.toISOString()).toBe("2026-10-31T23:00:00.000Z")
  })

  it("counts a win at 00:30 on the 1st in the new month", () => {
    const winAt = new Date("2026-10-31T23:30:00Z") // 00:30 on 1 Nov in Rome
    const nov = romeMonthRange(winAt)
    expect(nov.month).toBe(11)
    expect(winAt >= nov.start && winAt < nov.end).toBe(true)
  })

  it("steps back across the year boundary", () => {
    const r = romeMonthRange(new Date("2026-01-10T10:00:00Z"), -1)
    expect(r).toMatchObject({ year: 2025, month: 12 })
    expect(r.start.toISOString()).toBe("2025-11-30T23:00:00.000Z")
    expect(r.end.toISOString()).toBe("2025-12-31T23:00:00.000Z")
  })
})

describe("romeWeekStart", () => {
  it("is Monday 00:00 in Rome", () => {
    // Friday 16 Oct 2026 (CEST, +2) → Monday 12 Oct 00:00 Rome = 11 Oct 22:00 UTC
    expect(romeWeekStart(new Date("2026-10-16T10:00:00Z")).toISOString()).toBe("2026-10-11T22:00:00.000Z")
  })
  it("treats Sunday night in Rome as the same week", () => {
    // 22:30 UTC Sunday 18 Oct = 00:30 Monday 19 Oct in Rome → new week
    expect(romeWeekStart(new Date("2026-10-18T22:30:00Z")).toISOString()).toBe("2026-10-18T22:00:00.000Z")
    expect(romeWeekStart(new Date("2026-10-18T21:30:00Z")).toISOString()).toBe("2026-10-11T22:00:00.000Z")
  })
  it("handles the switch to winter time", () => {
    // Wednesday 28 Oct 2026 (CET, +1) → Monday 26 Oct 00:00 Rome = 25 Oct 23:00 UTC
    expect(romeWeekStart(new Date("2026-10-28T12:00:00Z")).toISOString()).toBe("2026-10-25T23:00:00.000Z")
  })
})
