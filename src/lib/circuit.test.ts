import { describe, expect, it } from "vitest"
import { circuitStandings, pointsForRank } from "./circuit"

describe("pointsForRank", () => {
  it("gives the scale, then participation points", () => {
    expect(pointsForRank(1)).toBe(100)
    expect(pointsForRank(2)).toBe(80)
    expect(pointsForRank(15)).toBe(10)
  })
})

describe("circuitStandings", () => {
  it("sums the stages; pair mates share points and rank", () => {
    const rows = circuitStandings([
      { standings: [{ playerId: "luca", rank: 1 }, { playerId: "sofia", rank: 1 }, { playerId: "marco", rank: 2 }] },
      { standings: [{ playerId: "marco", rank: 1 }, { playerId: "luca", rank: 3 }, { playerId: "sofia", rank: 3 }] },
    ])
    expect(rows.map((r) => [r.playerId, r.points, r.rank])).toEqual([
      ["marco", 180, 1],
      ["luca", 165, 2],
      ["sofia", 165, 2],
    ])
  })
  it("ignores a stage without scores", () => {
    expect(circuitStandings([{ standings: [{ playerId: "a", rank: 0 }] }])).toEqual([])
  })
})
