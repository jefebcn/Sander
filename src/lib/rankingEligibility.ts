/* ────────────────────────────────────────────────────────────────────────── */
/*  Who belongs on a leaderboard, and how sure we are of their place.          */
/*                                                                             */
/*  A player who never finished a game still carries the seed rating from      */
/*  sign-up (1350/1500/1650), so they sat above people who had actually played */
/*  and lost a few. And with only one or two results the Glicko deviation is   */
/*  so wide that a single win throws someone into the top ten. One rule for    */
/*  every board:                                                               */
/*    - 0 decided games      → not ranked at all;                              */
/*    - fewer than 5 games   → "in valutazione", listed after everyone else;   */
/*    - 5 or more            → ranked normally.                                */
/*  Pure logic, no DB: used by server actions and pages alike.                 */
/* ────────────────────────────────────────────────────────────────────────── */

/** Decided games needed before a player's position counts as established. */
export const PROVISIONAL_GAMES = 5

export type RankStatus = "unranked" | "provisional" | "established"

/** Decided games (wins + losses, tournaments and sessions) a player has on record. */
export function ratedGames(p: { matchesWon: number; matchesLost: number }): number {
  return Math.max(0, p.matchesWon) + Math.max(0, p.matchesLost)
}

export function rankStatus(games: number): RankStatus {
  if (games <= 0) return "unranked"
  if (games < PROVISIONAL_GAMES) return "provisional"
  return "established"
}

export function isProvisional(games: number): boolean {
  return rankStatus(games) === "provisional"
}

export interface SplitLeaderboard<T> {
  /** Players with enough games, in board order. */
  established: T[]
  /** Players still being assessed, in board order. */
  provisional: T[]
}

/**
 * Split a board into established and provisional players, each sorted with
 * `compare`; players with no decided games are dropped.
 */
export function splitLeaderboard<T>(
  items: readonly T[],
  gamesOf: (item: T) => number,
  compare: (a: T, b: T) => number,
): SplitLeaderboard<T> {
  const established: T[] = []
  const provisional: T[] = []
  for (const item of items) {
    const status = rankStatus(gamesOf(item))
    if (status === "established") established.push(item)
    else if (status === "provisional") provisional.push(item)
  }
  established.sort(compare)
  provisional.sort(compare)
  return { established, provisional }
}

/** Same rule as splitLeaderboard, flattened: established first, then provisional. */
export function orderLeaderboard<T>(
  items: readonly T[],
  gamesOf: (item: T) => number,
  compare: (a: T, b: T) => number,
): T[] {
  const { established, provisional } = splitLeaderboard(items, gamesOf, compare)
  return [...established, ...provisional]
}
