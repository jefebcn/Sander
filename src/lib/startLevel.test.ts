import { describe, it, expect } from "vitest"
import { startingRating, canSeedRating, START_LEVELS } from "./startLevel"

describe("startingRating", () => {
  it("orders levels from beginner to expert around the Glicko default", () => {
    expect(startingRating("PRINCIPIANTE")).toBeLessThan(startingRating("INTERMEDIO"))
    expect(startingRating("INTERMEDIO")).toBe(1500)
    expect(startingRating("ESPERTO")).toBeGreaterThan(startingRating("INTERMEDIO"))
  })

  it("covers every level offered in the form", () => {
    for (const l of START_LEVELS) expect(startingRating(l.id)).toBe(l.rating)
  })
})

describe("canSeedRating", () => {
  it("allows seeding only before any rated game", () => {
    expect(canSeedRating({ matchesWon: 0, matchesLost: 0, ratedGames: 0 })).toBe(true)
    expect(canSeedRating({ matchesWon: 1, matchesLost: 0, ratedGames: 0 })).toBe(false)
    expect(canSeedRating({ matchesWon: 0, matchesLost: 0, ratedGames: 2 })).toBe(false)
  })
})
