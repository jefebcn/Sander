import { describe, expect, it } from "vitest"
import { clubSlug, freeSlug, instagramHandle } from "./club"

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
