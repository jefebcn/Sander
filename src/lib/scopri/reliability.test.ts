import { describe, it, expect } from "vitest"
import {
  isLateCancel,
  reliabilityPct,
  isVerified,
  freeToday,
  slotsOverlap,
  rankKey,
  LATE_CANCEL_MS,
  type RankInput,
} from "./reliability"

describe("affidabilità", () => {
  const now = new Date("2026-10-19T10:00:00Z")
  it("counts a leave in the last hours as late", () => {
    expect(isLateCancel(new Date(now.getTime() + LATE_CANCEL_MS - 1), now)).toBe(true)
    expect(isLateCancel(new Date(now.getTime() + LATE_CANCEL_MS + 60_000), now)).toBe(false)
    expect(isLateCancel(new Date(now.getTime() - 60_000), now)).toBe(true)
  })
  it("is the share of presences, or null without history", () => {
    expect(reliabilityPct(0, 0)).toBeNull()
    expect(reliabilityPct(19, 1)).toBe(95)
    expect(reliabilityPct(0, 2)).toBe(0)
    expect(reliabilityPct(5, 0)).toBe(100)
  })
  it("verifies only real, reliable players", () => {
    expect(isVerified(3, 100)).toBe(true)
    expect(isVerified(2, 100)).toBe(false)
    expect(isVerified(10, 79)).toBe(false)
    expect(isVerified(10, null)).toBe(false)
  })
})

describe("libero oggi", () => {
  const now = new Date("2026-10-19T10:00:00Z")
  it("only counts today's flag (Rome calendar)", () => {
    expect(freeToday("2026-10-19", "EVENING", now)).toBe("EVENING")
    expect(freeToday("2026-10-18", "EVENING", now)).toBeNull()
    expect(freeToday(null, null, now)).toBeNull()
    expect(freeToday("2026-10-19", "bogus", now)).toBe("ANY")
  })
  it("overlaps on the same slot or all day", () => {
    expect(slotsOverlap("EVENING", "EVENING")).toBe(true)
    expect(slotsOverlap("ANY", "MORNING")).toBe(true)
    expect(slotsOverlap("MORNING", "EVENING")).toBe(false)
  })
})

describe("rankKey", () => {
  const base: RankInput = { score: 70, jitter: 0, reliability: 100, verified: false, themFree: null, meFree: null }
  it("rewards showing up", () => {
    expect(rankKey(base)).toBeGreaterThan(rankKey({ ...base, reliability: 50 }))
  })
  it("puts unknown history just under a perfect record", () => {
    expect(rankKey({ ...base, reliability: null })).toBeLessThan(rankKey(base))
    expect(rankKey({ ...base, reliability: null })).toBeGreaterThan(rankKey({ ...base, reliability: 60 }))
  })
  it("lifts verified players a little", () => {
    expect(rankKey({ ...base, verified: true }) - rankKey(base)).toBe(4)
  })
  it("brings people free today forward, most when your slots match", () => {
    const free = rankKey({ ...base, themFree: "EVENING" })
    const both = rankKey({ ...base, themFree: "EVENING", meFree: "EVENING" })
    const other = rankKey({ ...base, themFree: "EVENING", meFree: "MORNING" })
    expect(free).toBeGreaterThan(rankKey(base))
    expect(both).toBeGreaterThan(free)
    expect(other).toBe(free)
  })
  it("lets a free-today player overtake a slightly better match", () => {
    expect(rankKey({ ...base, score: 60, themFree: "ANY", meFree: "ANY" })).toBeGreaterThan(rankKey({ ...base, score: 80 }))
  })
})
