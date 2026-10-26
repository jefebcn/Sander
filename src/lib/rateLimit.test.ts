import { describe, expect, it } from "vitest"
import { RATE_LIMITS, overLimit, since } from "./rateLimit"

describe("rate limits", () => {
  it("lets the ceiling's last action through and stops the next one", () => {
    expect(overLimit(RATE_LIMITS.messagesPerMinute - 1, RATE_LIMITS.messagesPerMinute)).toBe(false)
    expect(overLimit(RATE_LIMITS.messagesPerMinute, RATE_LIMITS.messagesPerMinute)).toBe(true)
  })

  it("counts back one minute or one hour from now", () => {
    const now = new Date("2026-10-26T12:00:00Z")
    expect(since("minute", now).toISOString()).toBe("2026-10-26T11:59:00.000Z")
    expect(since("hour", now).toISOString()).toBe("2026-10-26T11:00:00.000Z")
  })
})
