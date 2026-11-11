/* ────────────────────────────────────────────────────────────────────────── */
/*  Store reviews. Where "Valuta l'app" leads (Google Play or the App Store's  */
/*  "write a review"), and when the app asks for one: once, after a few games, */
/*  the same neutral question for everyone (Google and Apple forbid rewarding  */
/*  reviews or asking only happy players).                                     */
/* ────────────────────────────────────────────────────────────────────────── */

export const ANDROID_PACKAGE = "com.sanderbv.app"
export const APPLE_APP_ID = "6833176069"

export const PLAY_STORE_URL = `https://play.google.com/store/apps/details?id=${ANDROID_PACKAGE}`
export const APP_STORE_REVIEW_URL = `https://apps.apple.com/app/id${APPLE_APP_ID}?action=write-review`

export type StorePlatform = "ios" | "android" | "web"

/** The store page to review on: the app's own platform, else the phone's (by user agent), else Google Play. */
export function storeReviewUrl(platform: StorePlatform, userAgent = ""): string {
  if (platform === "ios") return APP_STORE_REVIEW_URL
  if (platform === "android") return PLAY_STORE_URL
  return /iPhone|iPad|iPod/i.test(userAgent) ? APP_STORE_REVIEW_URL : PLAY_STORE_URL
}

export function storeName(url: string): string {
  return url === APP_STORE_REVIEW_URL ? "App Store" : "Google Play"
}

/** Games before the app asks: enough to know it, early enough to still be fresh. */
export const REVIEW_AFTER_GAMES = 3
/** "Non ora" asks again after this long; a review click never again. */
export const REVIEW_SNOOZE_DAYS = 30

export const REVIEW_STATE_KEY = "sander_review_ask"

/** Stored in localStorage: "done", or the ISO date before which not to ask again. */
export function shouldAskReview({ games, native, state, now }: { games: number; native: boolean; state: string | null; now: Date }): boolean {
  if (!native || games < REVIEW_AFTER_GAMES) return false
  if (!state) return true
  if (state === "done") return false
  const until = Date.parse(state)
  return Number.isNaN(until) || now.getTime() >= until
}

export function snoozeUntil(now: Date): string {
  return new Date(now.getTime() + REVIEW_SNOOZE_DAYS * 86_400_000).toISOString()
}
