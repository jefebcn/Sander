/* ────────────────────────────────────────────────────────────────────────── */
/*  Pair rating for the Coppie leaderboard: classic Elo, one step per 2v2      */
/*  played against another pair. Simple on purpose — pairs play far fewer      */
/*  matches than players, and everyone understands "beat a stronger pair, win */
/*  more points". Pure logic so it can be unit-tested.                         */
/* ────────────────────────────────────────────────────────────────────────── */

export const DUO_START_RATING = 1500
export const DUO_K = 32

/** Probability that a pair rated `ra` beats one rated `rb`. */
export function expectedScore(ra: number, rb: number): number {
  return 1 / (1 + 10 ** ((rb - ra) / 400))
}

/** New ratings after a match; `aWon` says who won. Points are zero-sum, rounded. */
export function eloUpdate(ra: number, rb: number, aWon: boolean, k: number = DUO_K): [number, number] {
  const delta = Math.round(k * ((aWon ? 1 : 0) - expectedScore(ra, rb)))
  return [ra + delta, rb - delta]
}
