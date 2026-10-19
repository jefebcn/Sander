/* ────────────────────────────────────────────────────────────────────────── */
/*  "Rigiocheresti con lui/lei?" — asked after a match played together.       */
/*  The share of "sì" becomes social proof on the card and a small push in    */
/*  the deck; a "no" keeps the two apart on Scopri; many "no" from different  */
/*  people in a short time go to the admins. Pure logic, unit-tested.         */
/* ────────────────────────────────────────────────────────────────────────── */

/** Below this many votes the share isn't shown (one bad day isn't a reputation). */
export const PLAY_AGAIN_MIN_VOTES = 3
/** Distinct "no" voters within the window that flag a player for review. */
export const PLAY_AGAIN_FLAG_NOS = 3
export const PLAY_AGAIN_FLAG_DAYS = 30

export function againPct(yes: number, no: number): number | null {
  const total = Math.max(0, yes) + Math.max(0, no)
  if (total < PLAY_AGAIN_MIN_VOTES) return null
  return Math.round((100 * Math.max(0, yes)) / total)
}

/** Deck nudge from the share of "sì": −5 at 0%, 0 at 50%, +5 at 100%. */
export function againBonus(pct: number | null): number {
  if (pct === null) return 0
  return (pct - 50) / 10
}

export function shouldFlag(distinctNoVoters: number): boolean {
  return distinctNoVoters >= PLAY_AGAIN_FLAG_NOS
}
