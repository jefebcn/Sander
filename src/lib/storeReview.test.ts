import { describe, expect, it } from "vitest"
import { APP_STORE_REVIEW_URL, PLAY_STORE_URL, shouldAskReview, snoozeUntil, storeName, storeReviewUrl } from "./storeReview"

const NOW = new Date("2026-11-11T18:00:00Z")

describe("storeReviewUrl", () => {
  it("follows the app's platform, then the phone", () => {
    expect(storeReviewUrl("ios")).toBe(APP_STORE_REVIEW_URL)
    expect(storeReviewUrl("android")).toBe(PLAY_STORE_URL)
    expect(storeReviewUrl("web", "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)")).toBe(APP_STORE_REVIEW_URL)
    expect(storeReviewUrl("web", "Mozilla/5.0 (Linux; Android 14)")).toBe(PLAY_STORE_URL)
    expect(PLAY_STORE_URL).toBe("https://play.google.com/store/apps/details?id=com.sanderbv.app")
    expect(storeName(APP_STORE_REVIEW_URL)).toBe("App Store")
  })
})

describe("shouldAskReview", () => {
  it("asks in the store app after 3 games, never on the web or earlier", () => {
    expect(shouldAskReview({ games: 3, native: true, state: null, now: NOW })).toBe(true)
    expect(shouldAskReview({ games: 2, native: true, state: null, now: NOW })).toBe(false)
    expect(shouldAskReview({ games: 9, native: false, state: null, now: NOW })).toBe(false)
  })
  it("never again after a review click, again after the snooze", () => {
    expect(shouldAskReview({ games: 5, native: true, state: "done", now: NOW })).toBe(false)
    const later = snoozeUntil(NOW)
    expect(shouldAskReview({ games: 5, native: true, state: later, now: NOW })).toBe(false)
    expect(shouldAskReview({ games: 5, native: true, state: later, now: new Date(Date.parse(later) + 1000) })).toBe(true)
  })
})
