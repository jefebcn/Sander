import { dayKey } from "@/lib/datetime"

/* ────────────────────────────────────────────────────────────────────────── */
/*  Affidabilità: what only SANDER knows about a teammate.                     */
/*                                                                             */
/*  A dating app takes your word for it; SANDER has the matches. Presences are */
/*  the completed matches you were in (Player.sessionsPlayed), the misses are */
/*  the times you left a match in its last hours. "Verificato" means real      */
/*  matches recorded with other people, and showing up to them.               */
/*  Pure logic so it can be unit-tested.                                        */
/* ────────────────────────────────────────────────────────────────────────── */

/** Leaving a match closer than this to its start counts as a missed presence. */
export const LATE_CANCEL_MS = 3 * 3600_000
export const VERIFIED_MIN_GAMES = 3
export const VERIFIED_MIN_RELIABILITY = 80

export function isLateCancel(sessionDate: Date, now: Date = new Date()): boolean {
  return sessionDate.getTime() - now.getTime() < LATE_CANCEL_MS
}

/** Share of presences, 0–100, or null with no history yet. */
export function reliabilityPct(played: number, lateCancels: number): number | null {
  const total = Math.max(0, played) + Math.max(0, lateCancels)
  if (total === 0) return null
  return Math.round((100 * Math.max(0, played)) / total)
}

export function isVerified(played: number, pct: number | null): boolean {
  return played >= VERIFIED_MIN_GAMES && (pct ?? 0) >= VERIFIED_MIN_RELIABILITY
}

// ── Libero oggi ──────────────────────────────────────────────────────────────

export const FREE_SLOTS = [
  { key: "MORNING", label: "Mattina" },
  { key: "AFTERNOON", label: "Pomeriggio" },
  { key: "EVENING", label: "Sera" },
  { key: "ANY", label: "Tutto il giorno" },
] as const

export type FreeSlot = (typeof FREE_SLOTS)[number]["key"]
export const FREE_SLOT_KEYS = FREE_SLOTS.map((s) => s.key) as [FreeSlot, ...FreeSlot[]]

/** The slot someone is free in today, or null if the flag is from another day. */
export function freeToday(freeDay: string | null | undefined, freeSlot: string | null | undefined, now: Date = new Date()): FreeSlot | null {
  if (!freeDay || freeDay !== dayKey(now)) return null
  return (FREE_SLOT_KEYS as readonly string[]).includes(freeSlot ?? "") ? (freeSlot as FreeSlot) : "ANY"
}

export function freeSlotLabel(slot: FreeSlot): string {
  return FREE_SLOTS.find((s) => s.key === slot)?.label ?? "Oggi"
}

/** Two "free today" flags overlap when either is all day or the slots match. */
export function slotsOverlap(a: FreeSlot, b: FreeSlot): boolean {
  return a === "ANY" || b === "ANY" || a === b
}

// ── Deck order ───────────────────────────────────────────────────────────────

export interface RankInput {
  /** Affinity 0–100 (what the card shows). */
  score: number
  /** Small daily shuffle among close scores. */
  jitter: number
  reliability: number | null
  verified: boolean
  /** Their "libero oggi" slot and mine. */
  themFree: FreeSlot | null
  meFree: FreeSlot | null
}

/**
 * Where a card goes in the deck. Affinity stays what the card shows; the order
 * also rewards people who show up, are verified, and are free today (most of
 * all in the same slot as you), because that is how a match becomes a game.
 */
export function rankKey(r: RankInput): number {
  const showUp = r.reliability === null ? 0.95 : 0.8 + 0.2 * (r.reliability / 100)
  let key = r.score * showUp + r.jitter
  if (r.verified) key += 4
  if (r.themFree) key += r.meFree && slotsOverlap(r.themFree, r.meFree) ? 25 : 12
  return key
}
