import { describe, it, expect } from "vitest"
import { expectedScore, eloUpdate } from "./duoElo"
import { againPct, againBonus, shouldFlag } from "./playAgain"

describe("duo Elo", () => {
  it("gives even pairs even odds", () => {
    expect(expectedScore(1500, 1500)).toBeCloseTo(0.5)
  })
  it("moves 16 points between even pairs", () => {
    expect(eloUpdate(1500, 1500, true)).toEqual([1516, 1484])
    expect(eloUpdate(1500, 1500, false)).toEqual([1484, 1516])
  })
  it("rewards beating a stronger pair more", () => {
    const [up] = eloUpdate(1400, 1600, true)
    const [up2] = eloUpdate(1600, 1400, true)
    expect(up - 1400).toBeGreaterThan(up2 - 1600)
  })
  it("is zero-sum", () => {
    const [a, b] = eloUpdate(1530, 1470, false)
    expect(a + b).toBe(3000)
  })
})

describe("rigiocheresti", () => {
  it("hides the share until there are enough votes", () => {
    expect(againPct(2, 0)).toBeNull()
    expect(againPct(3, 0)).toBe(100)
    expect(againPct(3, 1)).toBe(75)
  })
  it("nudges the deck both ways", () => {
    expect(againBonus(null)).toBe(0)
    expect(againBonus(100)).toBe(5)
    expect(againBonus(0)).toBe(-5)
  })
  it("flags after three different people said no", () => {
    expect(shouldFlag(2)).toBe(false)
    expect(shouldFlag(3)).toBe(true)
  })
})
