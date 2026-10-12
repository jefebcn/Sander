import { describe, it, expect } from "vitest"
import { CREDIT_PACKS, getCreditPack, packBonusPct, SC_PER_EURO } from "./pricing"

describe("credit packs", () => {
  it("never sells below the base rate", () => {
    for (const p of CREDIT_PACKS) {
      expect(p.credits).toBeGreaterThanOrEqual((p.priceCents / 100) * SC_PER_EURO)
    }
  })

  it("reports the bonus over the base rate", () => {
    expect(packBonusPct(getCreditPack("small")!)).toBe(0)
    expect(packBonusPct(getCreditPack("medium")!)).toBe(10)
    expect(packBonusPct(getCreditPack("large")!)).toBe(20)
  })

  it("rejects unknown pack ids instead of guessing", () => {
    expect(getCreditPack("huge")).toBeNull()
    expect(getCreditPack("")).toBeNull()
  })
})
