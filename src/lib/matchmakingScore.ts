import { PROVISIONAL_GAMES } from "@/lib/rankingEligibility"

/* ────────────────────────────────────────────────────────────────────────── */
/*  Compatibility score for /trova.                                            */
/*                                                                             */
/*  The page promises "livello simile e ruolo complementare", but the role was */
/*  only worth +12 on top of a closeness score that already hit 100: a         */
/*  defender saw other defenders at 100%, several of whom had never played.    */
/*  Now, for partners, the level is worth at most 60 and the role 40, so a     */
/*  same-role player tops out at 60%. And a rating backed by no games is a     */
/*  guess: the score is scaled down until the candidate has played enough.     */
/*  Pure logic so it can be unit-tested.                                        */
/* ────────────────────────────────────────────────────────────────────────── */

export type MatchMode = "partner" | "opponent"
export type Role = "BLOCKER" | "DEFENDER"

/** Share of the partner score that comes from the level; the rest is the role. */
export const PARTNER_LEVEL_WEIGHT = 60
export const PARTNER_ROLE_WEIGHT = 40

/** Confidence given to a rating with no games behind it (0–1). */
export const MIN_CONFIDENCE = 0.6

export interface ScoreInput {
  mode: MatchMode
  /** Rating window: closeness is 1 at equal ratings and 0 at the edge. */
  band: number
  myRating: number
  myRole: Role
  rating: number
  role: Role
  /** Decided games behind the candidate's rating. */
  games: number
}

/** 1 at identical ratings, 0 at (or beyond) the band edge. */
export function levelCloseness(myRating: number, rating: number, band: number): number {
  if (band <= 0) return myRating === rating ? 1 : 0
  return Math.max(0, 1 - Math.abs(rating - myRating) / band)
}

/** How much a rating can be trusted: MIN_CONFIDENCE at 0 games, 1 once established. */
export function ratingConfidence(games: number): number {
  const g = Math.max(0, Math.min(games, PROVISIONAL_GAMES))
  return MIN_CONFIDENCE + (1 - MIN_CONFIDENCE) * (g / PROVISIONAL_GAMES)
}

/** Compatibility 0–100. */
export function compatibilityScore(input: ScoreInput): number {
  const closeness = levelCloseness(input.myRating, input.rating, input.band)
  const base =
    input.mode === "partner"
      ? closeness * PARTNER_LEVEL_WEIGHT + (input.role !== input.myRole ? PARTNER_ROLE_WEIGHT : 0)
      : closeness * 100
  return Math.round(Math.max(0, Math.min(100, base * ratingConfidence(input.games))))
}
