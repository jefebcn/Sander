import { describe, it, expect } from "vitest"
import { formatTime, formatWhen, daysFromNow, relativeDay, dayKey, hasTimeOfDay } from "./datetime"

const d = (iso: string) => new Date(iso)

describe("formatTime", () => {
  it("shows Riviera time, not the server's UTC", () => {
    // 16:30 UTC in October (CEST, UTC+2) is 18:30 in Rimini.
    expect(formatTime(d("2026-10-13T16:30:00Z"))).toBe("18:30")
    // In winter (CET, UTC+1) the offset is one hour.
    expect(formatTime(d("2026-12-13T17:30:00Z"))).toBe("18:30")
  })
})

describe("dayKey / daysFromNow", () => {
  it("counts calendar days in Riviera time", () => {
    const now = d("2026-10-13T08:00:00Z")
    expect(daysFromNow(d("2026-10-13T20:00:00Z"), now)).toBe(0)
    expect(daysFromNow(d("2026-10-14T10:00:00Z"), now)).toBe(1)
    expect(daysFromNow(d("2026-10-12T10:00:00Z"), now)).toBe(-1)
  })

  it("puts 23:30 UTC on the next Italian day", () => {
    expect(dayKey(d("2026-10-13T23:30:00Z"))).toBe("2026-10-14")
  })
})

describe("formatWhen", () => {
  const now = d("2026-10-13T08:00:00Z")
  it("says today and tomorrow in words", () => {
    expect(formatWhen(d("2026-10-13T16:30:00Z"), now)).toBe("Oggi · 18:30")
    expect(formatWhen(d("2026-10-14T16:30:00Z"), now)).toBe("Domani · 18:30")
  })
  it("falls back to a short date further out", () => {
    expect(formatWhen(d("2026-10-17T16:30:00Z"), now)).toMatch(/^sab 17 ott · 18:30$/)
  })
})

describe("relativeDay", () => {
  const now = d("2026-10-13T08:00:00Z")
  it("reads naturally", () => {
    expect(relativeDay(d("2026-10-13T18:00:00Z"), now)).toBe("oggi")
    expect(relativeDay(d("2026-10-14T18:00:00Z"), now)).toBe("domani")
    expect(relativeDay(d("2026-10-16T18:00:00Z"), now)).toBe("tra 3 giorni")
    expect(relativeDay(d("2026-11-03T18:00:00Z"), now)).toBe("tra 3 settimane")
  })
})

describe("hasTimeOfDay", () => {
  it("treats a date-only value (midnight UTC) as having no time", () => {
    expect(hasTimeOfDay(d("2026-05-02T00:00:00Z"))).toBe(false)
  })
  it("keeps a real start time", () => {
    expect(hasTimeOfDay(d("2026-05-02T16:30:00Z"))).toBe(true)
    // Midnight in Rimini is 22:00 or 23:00 UTC, not a date-only value.
    expect(hasTimeOfDay(d("2026-05-01T22:00:00Z"))).toBe(true)
  })
})
