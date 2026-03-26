import { describe, it, expect } from "vitest"
import { updateRating, ratingToDisplayLevel } from "./glicko2"

describe("Glicko-2 algorithm", () => {
  const avg: import("./glicko2").Glicko2Player = {
    rating: 1500,
    rd: 200,
    volatility: 0.06,
  }

  it("no games played → only RD increases, rating unchanged", () => {
    const updated = updateRating(avg, [])
    expect(updated.rating).toBeCloseTo(1500, 0)
    expect(updated.rd).toBeGreaterThan(200)
  })

  it("win against equal opponent → rating increases", () => {
    const updated = updateRating(avg, [{ opponent: avg, score: 1 }])
    expect(updated.rating).toBeGreaterThan(1500)
  })

  it("loss against equal opponent → rating decreases", () => {
    const updated = updateRating(avg, [{ opponent: avg, score: 0 }])
    expect(updated.rating).toBeLessThan(1500)
  })

  it("RD decreases after playing games (more certainty)", () => {
    const updated = updateRating(avg, [{ opponent: avg, score: 1 }])
    expect(updated.rd).toBeLessThan(200)
  })

  it("win against much stronger opponent → bigger rating gain", () => {
    const strong: import("./glicko2").Glicko2Player = { rating: 1900, rd: 100, volatility: 0.06 }
    const weak:   import("./glicko2").Glicko2Player = { rating: 1200, rd: 100, volatility: 0.06 }
    const gainVsStrong = updateRating(avg, [{ opponent: strong, score: 1 }]).rating
    const gainVsWeak   = updateRating(avg, [{ opponent: weak,   score: 1 }]).rating
    expect(gainVsStrong).toBeGreaterThan(gainVsWeak)
  })

  it("more games → lower RD", () => {
    const many = Array.from({ length: 5 }, () => ({ opponent: avg, score: 0.5 as number }))
    const one  = [{ opponent: avg, score: 0.5 }]
    expect(updateRating(avg, many).rd).toBeLessThan(updateRating(avg, one).rd)
  })
})

describe("ratingToDisplayLevel", () => {
  it("1500 maps to 5.0 (average)", () => {
    expect(parseFloat(ratingToDisplayLevel(1500))).toBeCloseTo(5.0, 1)
  })

  it("600 maps to 2.0 (lower bound)", () => {
    expect(parseFloat(ratingToDisplayLevel(600))).toBeCloseTo(2.0, 1)
  })

  it("2400 maps to 8.0 (upper bound)", () => {
    expect(parseFloat(ratingToDisplayLevel(2400))).toBeCloseTo(8.0, 1)
  })

  it("clamps below 2.0", () => {
    expect(parseFloat(ratingToDisplayLevel(0))).toBeGreaterThanOrEqual(2.0)
  })

  it("clamps above 8.0", () => {
    expect(parseFloat(ratingToDisplayLevel(9999))).toBeLessThanOrEqual(8.0)
  })
})
