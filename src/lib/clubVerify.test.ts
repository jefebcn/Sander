import { describe, expect, it } from "vitest"
import { clubVerifyCode, SANDER_INSTAGRAM, SANDER_INSTAGRAM_DM } from "./clubVerify"

describe("clubVerifyCode", () => {
  it("is stable for a club, different across clubs and secrets, easy to read", () => {
    const a = clubVerifyCode("club_a", "s1")
    expect(a).toMatch(/^SANDER-[A-HJ-NP-Z2-9]{6}$/)
    expect(clubVerifyCode("club_a", "s1")).toBe(a)
    expect(clubVerifyCode("club_b", "s1")).not.toBe(a)
    expect(clubVerifyCode("club_a", "s2")).not.toBe(a)
  })
})

describe("SANDER Instagram", () => {
  it("is the handle clubs write to", () => {
    expect(SANDER_INSTAGRAM).toBe("sanderbeachvolley")
    expect(SANDER_INSTAGRAM_DM).toBe("https://ig.me/m/sanderbeachvolley")
  })
})
