import { describe, it, expect } from "vitest"
import { COMUNI, isKnownPlace, regionOfComune } from "."
import { CITY_NAMES } from "@/lib/cities"

describe("comuni", () => {
  it("covers every Italian comune plus San Marino, in 21 regions", () => {
    expect(COMUNI.comuni.length).toBeGreaterThan(7800)
    expect(COMUNI.regions).toHaveLength(21)
    expect(new Set(COMUNI.comuni.map(([n]) => n)).size).toBe(COMUNI.comuni.length)
  })

  it("knows the region of a comune", () => {
    expect(regionOfComune("Rimini")).toBe("Emilia-Romagna")
    expect(regionOfComune("Bologna")).toBe("Emilia-Romagna")
    expect(regionOfComune("Roma")).toBe("Lazio")
    expect(regionOfComune("San Marino")).toBe("San Marino")
    expect(regionOfComune("Atlantide")).toBeNull()
    expect(regionOfComune(null)).toBeNull()
  })

  it("keeps names shared by two comuni apart with the province", () => {
    expect(isKnownPlace("Castro (BG)")).toBe(true)
    expect(isKnownPlace("Castro (LE)")).toBe(true)
    expect(isKnownPlace("Castro")).toBe(false)
  })

  it("accepts any comune and the Riviera names, nothing else", () => {
    for (const name of CITY_NAMES) expect(isKnownPlace(name)).toBe(true)
    expect(isKnownPlace("Gatteo a Mare")).toBe(true)
    expect(isKnownPlace("Milano")).toBe(true)
    expect(isKnownPlace("Milano Marittima")).toBe(false)
    expect(isKnownPlace("")).toBe(false)
    expect(isKnownPlace(undefined)).toBe(false)
  })
})
