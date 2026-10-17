import { describe, it, expect } from "vitest"
import { creditCost, joinPrice } from "./joinPrice"

const base = { paymentType: "FREE", quotaAmount: null, courtCost: null, maxPlayers: 4 }

describe("joinPrice", () => {
  it("is null for free seats and for 'chi perde paga'", () => {
    expect(joinPrice(base)).toBeNull()
    expect(joinPrice({ ...base, paymentType: "LOSER_PAYS" })).toBeNull()
  })

  it("shows credits for SanderCredits matches", () => {
    expect(joinPrice({ ...base, paymentType: "SC", quotaAmount: 4 })).toBe("4 crediti")
    expect(joinPrice({ ...base, paymentType: "SC", quotaAmount: 1 })).toBe("1 credito")
  })

  it("shows the per-person quota in euro, from cents", () => {
    expect(joinPrice({ ...base, paymentType: "QUOTA", quotaAmount: 500 })).toBe("5,00 € a testa")
    expect(joinPrice({ ...base, paymentType: "QUOTA", quotaAmount: 250 })).toBe("2,50 € a testa")
  })

  it("splits a court cost between the seats, rounding up", () => {
    expect(joinPrice({ ...base, courtCost: 1000 })).toBe("3 € a testa per il campo")
    expect(joinPrice({ ...base, courtCost: 1000, maxPlayers: 0 })).toBeNull()
  })

  it("ignores a zero amount instead of advertising a 0 price", () => {
    expect(joinPrice({ ...base, paymentType: "SC", quotaAmount: 0 })).toBeNull()
    expect(joinPrice({ ...base, paymentType: "QUOTA", quotaAmount: 0 })).toBeNull()
  })
})

describe("creditCost", () => {
  it("is what the app debits on join: only credits, never euro paid on the sand", () => {
    expect(creditCost({ ...base, paymentType: "SC", quotaAmount: 4 })).toBe(4)
    expect(creditCost({ ...base, paymentType: "QUOTA", quotaAmount: 500 })).toBe(0)
    expect(creditCost({ ...base, courtCost: 2400 })).toBe(0)
    expect(creditCost(base)).toBe(0)
  })
})
