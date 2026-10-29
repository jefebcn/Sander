import { describe, expect, it } from "vitest"
import { isPaidAsExpected } from "./sumup"

describe("isPaidAsExpected", () => {
  const expected = { reference: "sc_abc", amountCents: 1000 }
  it("accepts our checkout, paid in full", () => {
    expect(isPaidAsExpected({ status: "PAID", checkout_reference: "sc_abc", amount: 10, currency: "EUR" }, expected)).toBe(true)
    expect(isPaidAsExpected({ status: "PAID", checkout_reference: "sc_abc", amount: 9.999999, currency: "EUR" }, expected)).toBe(true)
  })
  it("refuses anything else", () => {
    expect(isPaidAsExpected({ status: "PENDING", checkout_reference: "sc_abc", amount: 10, currency: "EUR" }, expected)).toBe(false)
    expect(isPaidAsExpected({ status: "PAID", checkout_reference: "other", amount: 10, currency: "EUR" }, expected)).toBe(false)
    expect(isPaidAsExpected({ status: "PAID", checkout_reference: "sc_abc", amount: 1, currency: "EUR" }, expected)).toBe(false)
    expect(isPaidAsExpected({ status: "PAID", checkout_reference: "sc_abc", amount: 10, currency: "USD" }, expected)).toBe(false)
  })
})
