import { describe, it, expect } from "vitest"
import {
  compatibilityScore,
  levelCloseness,
  ratingConfidence,
  MIN_CONFIDENCE,
  PARTNER_LEVEL_WEIGHT,
  type ScoreInput,
} from "./matchmakingScore"
import { PROVISIONAL_GAMES } from "./rankingEligibility"

const base: ScoreInput = {
  mode: "partner",
  band: 150,
  myRating: 1500,
  myRole: "DEFENDER",
  rating: 1500,
  role: "BLOCKER",
  games: 20,
}

describe("levelCloseness", () => {
  it("is 1 at equal ratings and 0 at the band edge", () => {
    expect(levelCloseness(1500, 1500, 150)).toBe(1)
    expect(levelCloseness(1500, 1650, 150)).toBe(0)
    expect(levelCloseness(1500, 1425, 150)).toBeCloseTo(0.5)
  })
  it("never goes negative outside the band", () => {
    expect(levelCloseness(1500, 1900, 150)).toBe(0)
  })
  it("survives a zero band", () => {
    expect(levelCloseness(1500, 1500, 0)).toBe(1)
    expect(levelCloseness(1500, 1501, 0)).toBe(0)
  })
})

describe("ratingConfidence", () => {
  it("starts low and reaches 1 once established", () => {
    expect(ratingConfidence(0)).toBe(MIN_CONFIDENCE)
    expect(ratingConfidence(PROVISIONAL_GAMES)).toBe(1)
    expect(ratingConfidence(100)).toBe(1)
    expect(ratingConfidence(2)).toBeGreaterThan(MIN_CONFIDENCE)
    expect(ratingConfidence(2)).toBeLessThan(1)
  })
})

describe("compatibilityScore — partner", () => {
  it("gives 100 only to a complementary, established player at the same level", () => {
    expect(compatibilityScore(base)).toBe(100)
  })

  it("caps a same-role player at the level share", () => {
    expect(compatibilityScore({ ...base, role: "DEFENDER" })).toBe(PARTNER_LEVEL_WEIGHT)
  })

  it("prefers a complementary player half a band away over a same-role twin", () => {
    const complementaryFar = compatibilityScore({ ...base, rating: 1575 })
    const sameRoleTwin = compatibilityScore({ ...base, role: "DEFENDER" })
    expect(complementaryFar).toBeGreaterThan(sameRoleTwin)
  })

  it("never shows a player with no games at 100%", () => {
    const fresh = compatibilityScore({ ...base, games: 0 })
    expect(fresh).toBeLessThan(100)
    expect(fresh).toBe(Math.round(100 * MIN_CONFIDENCE))
  })

  it("puts a same-role player with no games well down the list", () => {
    expect(compatibilityScore({ ...base, role: "DEFENDER", games: 0 })).toBeLessThan(50)
  })
})

describe("compatibilityScore — opponent", () => {
  it("ignores the role", () => {
    const a = compatibilityScore({ ...base, mode: "opponent", role: "DEFENDER" })
    const b = compatibilityScore({ ...base, mode: "opponent", role: "BLOCKER" })
    expect(a).toBe(100)
    expect(b).toBe(100)
  })

  it("scales with level closeness and confidence", () => {
    expect(compatibilityScore({ ...base, mode: "opponent", rating: 1575 })).toBe(50)
    expect(compatibilityScore({ ...base, mode: "opponent", games: 0 })).toBe(60)
  })
})
