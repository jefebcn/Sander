import { describe, it, expect } from "vitest"
import { formatPrice } from "./utils"

describe("formatPrice", () => {
  it("returns 'Gratis' for null", () => {
    expect(formatPrice(null)).toBe("Gratis")
  })

  it("returns 'Gratis' for undefined", () => {
    expect(formatPrice(undefined)).toBe("Gratis")
  })

  it("formats 0 cents as €0,00 (not 'Gratis')", () => {
    // 0 cents is a real value — a paid event priced at €0 would be free conceptually
    // but formatPrice is a pure formatter: 0 → €0,00
    const result = formatPrice(0)
    expect(result).toContain("0,00")
    expect(result).toContain("€")
  })

  it("formats 2000 cents as €20,00", () => {
    const result = formatPrice(2000)
    expect(result).toContain("20,00")
    expect(result).toContain("€")
  })

  it("formats fractional cents correctly (1599 -> €15,99)", () => {
    const result = formatPrice(1599)
    expect(result).toContain("15,99")
  })

  it("handles USD currency", () => {
    const result = formatPrice(1000, "USD")
    // Italian locale formats USD as "US$"
    expect(result).toMatch(/10,00/)
    expect(result).toMatch(/\$|USD/)
  })
})
