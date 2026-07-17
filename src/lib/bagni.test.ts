import { describe, it, expect } from "vitest"
import { parseBagno, canonicalLocation, bagnoLabel, POPULAR_BAGNI } from "./bagni"

describe("bagni", () => {
  it("parses common bagno formats", () => {
    expect(parseBagno("Bagno 26")).toBe(26)
    expect(parseBagno("bagno26")).toBe(26)
    expect(parseBagno("B44")).toBe(44)
    expect(parseBagno("bag. 60")).toBe(60)
    expect(parseBagno("42")).toBe(42)
    expect(parseBagno("Bagno 29 Rimini")).toBe(29)
  })

  it("rejects non-bagno / out-of-range locations", () => {
    expect(parseBagno("Rimini Nord")).toBeNull()
    expect(parseBagno("Riccione")).toBeNull()
    expect(parseBagno("Bagno 999")).toBeNull()
    expect(parseBagno("0")).toBeNull()
    expect(parseBagno("")).toBeNull()
    expect(parseBagno(null)).toBeNull()
  })

  it("does not false-match a 'b' inside another word", () => {
    expect(parseBagno("club 42")).toBeNull()
    expect(parseBagno("beach 12")).toBeNull()
  })

  it("canonicalises bagno references to a single label", () => {
    expect(canonicalLocation("bagno26")).toBe("Bagno 26")
    expect(canonicalLocation("B 26")).toBe("Bagno 26")
    expect(canonicalLocation("26")).toBe("Bagno 26")
    expect(canonicalLocation("Rimini Nord")).toBe("Rimini Nord")
    expect(canonicalLocation("  spiaggia   centrale ")).toBe("spiaggia centrale")
  })

  it("labels and popular list are consistent", () => {
    expect(bagnoLabel(26)).toBe("Bagno 26")
    expect(POPULAR_BAGNI).toContain(26)
    expect(POPULAR_BAGNI.every((n) => n >= 1 && n <= 150)).toBe(true)
  })
})
