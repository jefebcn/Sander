import { describe, it, expect } from "vitest"
import { galeShapley, dailyPairs, isStable, type PoolPerson } from "./stableMatch"

describe("galeShapley", () => {
  it("finds the textbook stable matching", () => {
    const men = new Map([
      ["A", ["X", "Y", "Z"]],
      ["B", ["Y", "X", "Z"]],
      ["C", ["X", "Y", "Z"]],
    ])
    const women = new Map([
      ["X", ["B", "A", "C"]],
      ["Y", ["A", "B", "C"]],
      ["Z", ["A", "B", "C"]],
    ])
    const m = galeShapley(men, women)
    expect(Object.fromEntries(m)).toEqual({ A: "X", B: "Y", C: "Z" })
  })
  it("leaves out pairs either side won't accept", () => {
    const m = galeShapley(new Map([["A", ["X"]]]), new Map([["X", []]]))
    expect(m.size).toBe(0)
  })
})

describe("dailyPairs", () => {
  // Score = closeness of made-up ratings; same role is never paired by GS but
  // may be paired among leftovers.
  const rating: Record<string, number> = { b1: 1500, b2: 1700, b3: 1300, d1: 1510, d2: 1690, b4: 1320 }
  const pool: PoolPerson[] = [
    { id: "b1", role: "BLOCKER" },
    { id: "b2", role: "BLOCKER" },
    { id: "b3", role: "BLOCKER" },
    { id: "b4", role: "BLOCKER" },
    { id: "d1", role: "DEFENDER" },
    { id: "d2", role: "DEFENDER" },
  ]
  const score = (a: string, b: string) => 1000 - Math.abs(rating[a] - rating[b])

  it("pairs blockers with defenders, closest levels first", () => {
    const pairs = dailyPairs(pool, score)
    expect(pairs.get("b1")).toBe("d1")
    expect(pairs.get("d2")).toBe("b2")
  })
  it("pairs the leftovers among themselves", () => {
    const pairs = dailyPairs(pool, score)
    expect(pairs.get("b3")).toBe("b4")
    expect(pairs.get("b4")).toBe("b3")
  })
  it("is symmetric and stable across roles", () => {
    const pairs = dailyPairs(pool, score, false)
    for (const [a, b] of pairs) expect(pairs.get(b)).toBe(a)
    const cross = (a: string, b: string) =>
      pool.find((p) => p.id === a)?.role === pool.find((p) => p.id === b)?.role ? null : score(a, b)
    const crossPairs = new Map([...pairs].filter(([a, b]) => cross(a, b) !== null))
    expect(isStable(crossPairs, pool.map((p) => p.id), cross)).toBe(true)
  })
  it("never pairs people who must not meet", () => {
    const banned = (a: string, b: string) => ((a === "b1" && b === "d1") || (a === "d1" && b === "b1") ? null : score(a, b))
    const pairs = dailyPairs(pool, banned)
    expect(pairs.get("b1")).not.toBe("d1")
  })
  it("handles an empty or single pool", () => {
    expect(dailyPairs([], score).size).toBe(0)
    expect(dailyPairs([{ id: "b1", role: "BLOCKER" }], score).size).toBe(0)
  })
})
