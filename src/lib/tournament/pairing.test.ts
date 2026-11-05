import { describe, expect, it } from "vitest"
import { mixedPairOrder, pairingOrder, playingRegistrations, regroupKeepingPairs, startProblem } from "./pairing"

const d = (m: number) => new Date(2026, 10, 1, 10, m)

describe("pairingOrder", () => {
  it("keeps seeds, then puts players without a seed in sign-up order", () => {
    const regs = [
      { id: "solo2", seedPosition: null, createdAt: d(5) },
      { id: "b", seedPosition: 2, createdAt: d(1) },
      { id: "solo1", seedPosition: null, createdAt: d(3) },
      { id: "a", seedPosition: 1, createdAt: d(1) },
    ]
    expect(pairingOrder(regs).map((r) => r.id)).toEqual(["a", "b", "solo1", "solo2"])
  })
})

describe("playingRegistrations", () => {
  it("drops spectators and cancelled rows", () => {
    const regs = [
      { id: "p", paymentStatus: "PENDING", isSpectator: false },
      { id: "s", paymentStatus: "PAID", isSpectator: true },
      { id: "c", paymentStatus: "CANCELLED", isSpectator: false },
    ]
    expect(playingRegistrations(regs).map((r) => r.id)).toEqual(["p"])
  })
})

describe("startProblem", () => {
  it("needs full pairs in fixed-pair formats", () => {
    expect(startProblem("ROUND_ROBIN", 2)).toMatch(/almeno 2 coppie/)
    expect(startProblem("ROUND_ROBIN", 7)).toMatch(/dispari/)
    expect(startProblem("ROUND_ROBIN", 16)).toBeNull()
  })
  it("knows the other formats", () => {
    expect(startProblem("CHICECE", 6)).toMatch(/multiplo di 4/)
    expect(startProblem("KING_OF_THE_BEACH", 5)).toBeNull()
  })
})

describe("mixedPairOrder", () => {
  it("pairs a man with a woman while both are left", () => {
    const players = [
      { id: "m1", gender: "Uomo" }, { id: "m2", gender: "Uomo" }, { id: "m3", gender: "Uomo" },
      { id: "w1", gender: "Donna" }, { id: "w2", gender: "Donna" }, { id: "x", gender: null },
    ]
    const order = mixedPairOrder(players, () => 0.3)
    const pairs = [order.slice(0, 2), order.slice(2, 4)]
    for (const p of pairs) expect(p.map((id) => id[0]).sort()).toEqual(["m", "w"])
    expect(order).toHaveLength(6)
    expect(new Set(order).size).toBe(6)
  })
})

describe("regroupKeepingPairs", () => {
  it("keeps the pairs that signed up together and reshuffles only the singles", () => {
    const ordered = [
      { id: "luca", pairKey: "Coppia su invito: Luca & Sofia", gender: "Uomo" },
      { id: "sofia", pairKey: "Coppia su invito: Luca & Sofia", gender: "Donna" },
      { id: "paolo", pairKey: null, gender: "Uomo" },
      { id: "davide", pairKey: null, gender: "Uomo" },
      { id: "elena", pairKey: null, gender: "Donna" },
      { id: "chiara", pairKey: null, gender: "Donna" },
    ]
    const order = regroupKeepingPairs(ordered, "mixed", () => 0.6)
    expect(order.slice(0, 2)).toEqual(["luca", "sofia"])
    const genders = Object.fromEntries(ordered.map((o) => [o.id, o.gender]))
    for (const pair of [order.slice(2, 4), order.slice(4, 6)]) {
      expect(pair.map((id) => genders[id]).sort()).toEqual(["Donna", "Uomo"])
    }
  })
  it("treats a pair split by hand as two singles", () => {
    const ordered = [
      { id: "a", pairKey: "k", gender: null },
      { id: "x", pairKey: null, gender: null },
      { id: "b", pairKey: "k", gender: null },
    ]
    expect(regroupKeepingPairs(ordered, "random", () => 0).sort()).toEqual(["a", "b", "x"])
  })
})
