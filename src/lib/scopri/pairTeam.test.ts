import { describe, it, expect } from "vitest"
import { teamForPair } from "./pairTeam"

describe("teamForPair", () => {
  it("leaves teams alone when nobody has one yet", () => {
    expect(teamForPair([null, null], 4)).toBeNull()
    expect(teamForPair([], 4)).toBeNull()
  })
  it("puts the pair on the empty side of a 2v2", () => {
    expect(teamForPair([0, 0], 4)).toBe(1)
    expect(teamForPair([1, 1], 4)).toBe(0)
    expect(teamForPair([0, null], 4)).toBe(1)
  })
  it("no side has room for two: no team, the organizer arranges it", () => {
    expect(teamForPair([0, 1], 4)).toBeNull()
  })
  it("larger formats: the side with room, the smaller one first", () => {
    expect(teamForPair([0, 1, 1], 6)).toBe(0)
    expect(teamForPair([0, 0, 0], 6)).toBe(1)
  })
})
