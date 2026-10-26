import { describe, expect, it } from "vitest"
import { installPromptDue } from "./installPrompt"

describe("installPromptDue", () => {
  it("never shows next to the cookie notice", () => {
    expect(installPromptDue({ cookieChoice: null, hasProfile: true, visits: 5 })).toBe(false)
  })
  it("waits for a sign-up or a second visit", () => {
    expect(installPromptDue({ cookieChoice: "accepted", hasProfile: false, visits: 1 })).toBe(false)
    expect(installPromptDue({ cookieChoice: "accepted", hasProfile: true, visits: 1 })).toBe(true)
    expect(installPromptDue({ cookieChoice: "rejected", hasProfile: false, visits: 2 })).toBe(true)
  })
})
