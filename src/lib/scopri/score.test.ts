import { describe, it, expect } from "vitest"
import { discoverScore, duoScore, stableJitter, type DiscoverPerson } from "./score"

const p = (o: Partial<DiscoverPerson> = {}): DiscoverPerson => ({
  id: "x",
  rating: 1500,
  role: "BLOCKER",
  games: 10,
  homeCity: "Rimini",
  slots: [],
  lookingFor: [],
  side: null,
  ...o,
})

describe("discoverScore", () => {
  it("tops out for the ideal teammate", () => {
    const me = p({ slots: ["6:EVENING", "0:MORNING", "3:EVENING"], lookingFor: ["COMPAGNO"], side: "SINISTRA" })
    const them = p({ id: "y", role: "DEFENDER", slots: ["6:EVENING", "0:MORNING", "3:EVENING"], lookingFor: ["COMPAGNO"], side: "DESTRA" })
    const s = discoverScore(me, them)
    expect(s.score).toBe(100)
    expect(s.reasons).toEqual(["Muro + difesa", "Giocate a Rimini", "Livello vicino"])
  })
  it("rewards a complementary role", () => {
    const same = discoverScore(p(), p({ id: "y" })).score
    const other = discoverScore(p(), p({ id: "y", role: "DEFENDER" })).score
    expect(other - same).toBeGreaterThanOrEqual(19)
  })
  it("drops the level part at the band edge", () => {
    const close = discoverScore(p(), p({ id: "y", homeCity: null })).score
    const far = discoverScore(p(), p({ id: "y", rating: 1900, homeCity: null })).score
    expect(close).toBe(35)
    expect(far).toBe(0)
  })
  it("trusts an unplayed rating a little less", () => {
    const sure = discoverScore(p(), p({ id: "y", games: 10 })).score
    const guess = discoverScore(p(), p({ id: "y", games: 0 })).score
    expect(guess).toBeLessThan(sure)
    expect(guess).toBeGreaterThanOrEqual(Math.floor(sure * 0.85))
  })
  it("stays within 0–100", () => {
    const s = discoverScore(p({ rating: 0 }), p({ id: "y", rating: 3000 })).score
    expect(s).toBeGreaterThanOrEqual(0)
    expect(s).toBeLessThanOrEqual(100)
  })
})

describe("duoScore", () => {
  const d = (rating: number, homeCity: string | null, slots: string[] = []) => ({ rating, homeCity, slots })
  it("likes pairs at the same level, in the same comune, free together", () => {
    const s = duoScore([d(1500, "Rimini", ["6:EVENING"]), d(1600, null, ["6:EVENING"])], [d(1550, "Rimini", ["6:EVENING"]), d(1550, "Cervia", ["6:EVENING", "0:MORNING"])])
    expect(s.score).toBe(90)
    expect(s.reasons).toContain("Giocate a Rimini")
    expect(s.reasons).toContain("Liberi tutti e quattro negli stessi orari")
  })
  it("compares the pair's average, not each player", () => {
    const s = duoScore([d(1300, null), d(1700, null)], [d(1500, null), d(1500, null)])
    expect(s.score).toBe(55)
  })
})

describe("stableJitter", () => {
  it("is stable and bounded", () => {
    expect(stableJitter("2026-10-18:a:b")).toBe(stableJitter("2026-10-18:a:b"))
    for (const s of ["a", "b", "c", "d", "eeee"]) {
      const j = stableJitter(s, 5)
      expect(j).toBeGreaterThanOrEqual(0)
      expect(j).toBeLessThan(5)
    }
  })
})
