import { describe, expect, it } from "vitest"
import { proofStats } from "./proofStats"

describe("proofStats", () => {
  it("drops figures too small to impress", () => {
    expect(proofStats({ players: 48, matches: 3, comuni: 1 })).toEqual([])
  })
  it("keeps the ones that are worth showing, in order", () => {
    expect(proofStats({ players: 120, matches: 4, comuni: 7 })).toEqual([
      { n: 120, label: "Giocatori" },
      { n: 7, label: "Comuni" },
    ])
  })
})
