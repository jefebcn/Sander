/* ────────────────────────────────────────────────────────────────────────── */
/*  Anti-spam ceilings, counted on rows that already exist (messages, groups,  */
/*  proposals, photos) so no extra table or store is needed. Far above what a  */
/*  person does by hand; they only stop scripts and copy-paste floods.         */
/* ────────────────────────────────────────────────────────────────────────── */

export const RATE_LIMITS = {
  messagesPerMinute: 20,
  messagesPerHour: 300,
  groupsPerHour: 10,
  proposalsPerHour: 20,
  photosPerHour: 12,
} as const

export const SLOW_DOWN = "Stai andando troppo veloce: riprova tra poco."

const MINUTE = 60_000
const HOUR = 60 * MINUTE

/** Start of the window that ends now. */
export function since(window: "minute" | "hour", now: Date = new Date()): Date {
  return new Date(now.getTime() - (window === "minute" ? MINUTE : HOUR))
}

/** True once `count` actions in the window have reached the ceiling. */
export function overLimit(count: number, max: number): boolean {
  return count >= max
}
