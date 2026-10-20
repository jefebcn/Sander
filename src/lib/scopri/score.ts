import { levelCloseness, ratingConfidence } from "@/lib/matchmakingScore"
import type { Role } from "./rules"

/* ────────────────────────────────────────────────────────────────────────── */
/*  How well two players would get on, on the sand.                            */
/*                                                                             */
/*  Level counts most, then a blocker with a defender, the same comune, the   */
/*  same free hours and the same reason to play. Every point comes with the    */
/*  sentence that explains it, so a card can say why it is in front of you.   */
/*  Pure logic so it can be unit-tested.                                        */
/* ────────────────────────────────────────────────────────────────────────── */

export const SCORE_WEIGHTS = {
  level: 35,
  role: 20,
  city: 15,
  slots: 15,
  goal: 10,
  side: 5,
} as const

/** Below this the percentage stays off the card: "35%" next to "Fai match"
 *  reads as "don't bother", while the reasons below it still say what you share. */
export const AFFINITY_SHOWN_FROM = 50

/** The affinity number to show on a card, or null to show only the reasons. */
export function shownAffinity(score: number | null | undefined): number | null {
  return typeof score === "number" && score >= AFFINITY_SHOWN_FROM ? score : null
}

/** Rating gap at which the level part reaches zero. */
export const LEVEL_BAND = 300

export interface DiscoverPerson {
  id: string
  rating: number
  role: Role
  /** Decided games behind the rating. */
  games: number
  homeCity: string | null
  /** Free slots as "weekday:SLOT" keys (see PlayerAvailability). */
  slots: string[]
  lookingFor: string[]
  side: string | null
}

export interface DiscoverScore {
  score: number
  reasons: string[]
}

function sharedCount(a: string[], b: string[]): number {
  const set = new Set(a)
  return b.filter((x) => set.has(x)).length
}

function sidesFit(a: string | null, b: string | null): boolean {
  if (!a || !b) return false
  if (a === "ENTRAMBI" || b === "ENTRAMBI") return true
  return a !== b
}

/** Compatibility 0–100 for a pair of players, with up to three reasons. */
export function discoverScore(me: DiscoverPerson, them: DiscoverPerson): DiscoverScore {
  const reasons: string[] = []
  const closeness = levelCloseness(me.rating, them.rating, LEVEL_BAND)
  let raw = closeness * SCORE_WEIGHTS.level

  if (me.role !== them.role) {
    raw += SCORE_WEIGHTS.role
    reasons.push("Muro + difesa")
  }
  if (me.homeCity && me.homeCity === them.homeCity) {
    raw += SCORE_WEIGHTS.city
    reasons.push(`Giocate a ${me.homeCity}`)
  }
  if (closeness >= 0.75) reasons.push("Livello vicino")
  const slots = sharedCount(me.slots, them.slots)
  if (slots > 0) {
    raw += SCORE_WEIGHTS.slots * Math.min(slots, 3) / 3
    reasons.push(slots === 1 ? "Un orario libero in comune" : `${slots} orari liberi in comune`)
  }
  if (sharedCount(me.lookingFor, them.lookingFor) > 0) {
    raw += SCORE_WEIGHTS.goal
    reasons.push("Cercate la stessa cosa")
  }
  if (sidesFit(me.side, them.side)) raw += SCORE_WEIGHTS.side

  // A rating with no games behind it is a guess: trust it a little less.
  const confidence = 0.85 + 0.15 * ((ratingConfidence(them.games) - 0.6) / 0.4)
  return { score: Math.round(Math.max(0, Math.min(100, raw * confidence))), reasons: reasons.slice(0, 3) }
}

export interface DuoSide {
  rating: number
  homeCity: string | null
  slots: string[]
}

export const DUO_BAND = 250

/** Compatibility 0–100 between two pairs for a 2v2: level of the pair first. */
export function duoScore(mine: [DuoSide, DuoSide], theirs: [DuoSide, DuoSide]): DiscoverScore {
  const reasons: string[] = []
  const avg = (p: [DuoSide, DuoSide]) => (p[0].rating + p[1].rating) / 2
  const closeness = levelCloseness(avg(mine), avg(theirs), DUO_BAND)
  let raw = closeness * 55
  if (closeness >= 0.7) reasons.push("Coppie dello stesso livello")

  const myCities = new Set(mine.map((p) => p.homeCity).filter(Boolean))
  const shared = theirs.map((p) => p.homeCity).find((c) => c && myCities.has(c))
  if (shared) {
    raw += 25
    reasons.push(`Giocate a ${shared}`)
  }

  const all = [...mine, ...theirs]
  const common = all.slice(1).reduce((acc, p) => acc.filter((s) => p.slots.includes(s)), all[0].slots)
  if (common.length > 0) {
    raw += 20 * Math.min(common.length, 2) / 2
    reasons.push("Liberi tutti e quattro negli stessi orari")
  }
  return { score: Math.round(Math.max(0, Math.min(100, raw))), reasons }
}

/**
 * A small, stable per-day nudge (0…spread-1) so the deck isn't the same order
 * every day among people with close scores. Same seed, same number.
 */
export function stableJitter(seed: string, spread = 7): number {
  let h = 2166136261
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return (h >>> 0) % spread
}
