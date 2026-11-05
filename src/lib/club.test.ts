import { describe, expect, it } from "vitest"
import { clubChecklist, clubSlug, freeSlug, instagramHandle, mapsUrl } from "./club"

describe("clubSlug", () => {
  it("makes a readable URL name", () => {
    expect(clubSlug("CUS Torino – Beach Volley")).toBe("cus-torino-beach-volley")
    expect(clubSlug("Bagno 26 «Da Gigi»")).toBe("bagno-26-da-gigi")
    expect(clubSlug("Società Sportiva Città")).toBe("societa-sportiva-citta")
  })
  it("never ends with a dash after trimming to 40", () => {
    expect(clubSlug("a".repeat(39) + " b c")).not.toMatch(/-$/)
  })
})

describe("freeSlug", () => {
  it("adds a number when taken", () => {
    expect(freeSlug("cus-torino", [])).toBe("cus-torino")
    expect(freeSlug("cus-torino", ["cus-torino", "cus-torino-2"])).toBe("cus-torino-3")
    expect(freeSlug("", [])).toBe("club")
  })
})

describe("instagramHandle", () => {
  it("accepts handles and profile URLs", () => {
    expect(instagramHandle("@beachvolleycustorino")).toBe("beachvolleycustorino")
    expect(instagramHandle("https://www.instagram.com/beachvolleycustorino/")).toBe("beachvolleycustorino")
    expect(instagramHandle("javascript:alert(1)")).toBeNull()
  })
})

describe("mapsUrl", () => {
  it("builds directions to address and city", () => {
    expect(mapsUrl("Via Panetti 30", "Torino")).toBe("https://www.google.com/maps/dir/?api=1&destination=Via%20Panetti%2030%2C%20Torino")
    expect(mapsUrl(null, "Torino")).toContain("destination=Torino")
  })
})

describe("clubChecklist", () => {
  it("marks what's done", () => {
    const list = clubChecklist({ logoUrl: "x", description: " ", courts: 3, photos: [], tournaments: 0 })
    expect(list.filter((i) => i.done).map((i) => i.key)).toEqual(["logo", "campi"])
  })
})
