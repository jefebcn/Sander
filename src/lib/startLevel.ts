/* ────────────────────────────────────────────────────────────────────────── */
/*  Self-declared level at sign-up.                                            */
/*                                                                             */
/*  Everyone used to start at the same Glicko rating (1500, shown as "5.0"),    */
/*  so "partite al tuo livello" meant nothing until a few games were played.   */
/*  Asking once seeds a sensible starting point. The rating deviation stays at  */
/*  its maximum, so real results still move it quickly to where it belongs.     */
/* ────────────────────────────────────────────────────────────────────────── */

export const START_LEVELS = [
  { id: "PRINCIPIANTE", label: "Principiante", hint: "Ho iniziato da poco", rating: 1350 },
  { id: "INTERMEDIO", label: "Intermedio", hint: "Gioco ogni tanto", rating: 1500 },
  { id: "ESPERTO", label: "Esperto", hint: "Gioco spesso o faccio tornei", rating: 1650 },
] as const

export type StartLevel = (typeof START_LEVELS)[number]["id"]

export const START_LEVEL_IDS = START_LEVELS.map((l) => l.id) as [StartLevel, ...StartLevel[]]

/** Starting Glicko rating for a self-declared level. */
export function startingRating(level: StartLevel): number {
  return START_LEVELS.find((l) => l.id === level)?.rating ?? 1500
}

/**
 * Whether a declared level may still set the rating: only before any rated
 * game, so editing the profile later can't be used to reset a bad rating.
 */
export function canSeedRating(p: { matchesWon: number; matchesLost: number; ratedGames: number }): boolean {
  return p.matchesWon + p.matchesLost === 0 && p.ratedGames === 0
}
