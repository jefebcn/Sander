import { describe, it, expect } from "vitest"
import { ratingDeltaFor } from "./matchRecap"

const at = (iso: string) => new Date(iso)

describe("ratingDeltaFor", () => {
  const history = [
    { rating: 1512.4, sourceId: "s1", createdAt: at("2026-08-01T10:00:00Z") },
    { rating: 1498.1, sourceId: "s2", createdAt: at("2026-08-03T10:00:00Z") },
    { rating: 1521.9, sourceId: "t1", createdAt: at("2026-08-05T10:00:00Z") },
  ]

  it("measures against the previous point, regardless of input order", () => {
    expect(ratingDeltaFor([...history].reverse(), "s2", 1500)).toBe(-14)
    expect(ratingDeltaFor(history, "t1", 1500)).toBe(24)
  })

  it("uses the starting rating as baseline for the first rated game", () => {
    expect(ratingDeltaFor(history, "s1", 1500)).toBe(12)
    expect(ratingDeltaFor(history, "s1", 1350)).toBe(162)
  })

  it("returns null when the match left no rating point", () => {
    expect(ratingDeltaFor(history, "unknown", 1500)).toBeNull()
    expect(ratingDeltaFor([], "s1", 1500)).toBeNull()
  })
})
