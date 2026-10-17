/* ────────────────────────────────────────────────────────────────────────── */
/*  Right after a match: what happened, and how to record it if nobody did.    */
/*                                                                             */
/*  Pure, so the home's "Com'è andata?" card always points somewhere that      */
/*  actually saves the result.                                                 */
/* ────────────────────────────────────────────────────────────────────────── */

export type MatchOutcome = "win" | "loss" | "draw"

/**
 * Result of a set-scored match for one side (team 0 = A, team 1 = B), by sets
 * won. Null when there are no sets or the player had no team.
 */
export function matchOutcome(
  sets: { teamAScore: number; teamBScore: number }[],
  team: number | null | undefined,
): MatchOutcome | null {
  if (sets.length === 0 || (team !== 0 && team !== 1)) return null
  const a = sets.filter((s) => s.teamAScore > s.teamBScore).length
  const b = sets.filter((s) => s.teamBScore > s.teamAScore).length
  if (a === b) return "draw"
  return (team === 0) === a > b ? "win" : "loss"
}

export interface UnscoredMatch {
  id: string
  organizerId: string
  matchMode: boolean
  /** A live board was started for this match (Session.liveScore is set). */
  hasLiveScore: boolean
  participants: { team: number | null; playerId: string | null }[]
}

export type ResultEntry =
  /** The organizer types the sets on the match page: the 10-second path. */
  | { kind: "organizer"; href: string }
  /** The organizer must split the teams first, or the score moves no rating. */
  | { kind: "teams"; href: string }
  /** A live board is already running: finish it and save. */
  | { kind: "board"; href: string }
  /** Nothing to do here but wait for the organizer. */
  | { kind: "wait"; href: string }

/**
 * Where `playerId` can record the result of a match that's over but still
 * open. Typing the final sets is the organizer's, on the match page, once the
 * teams are split (players without a team get no rating change). The live
 * board counts point by point, so it's only offered to finish a board someone
 * already started (it saves only with both teams set and one match per
 * session). Everyone else waits for the organizer.
 */
export function resultEntryFor(match: UnscoredMatch, playerId: string): ResultEntry {
  const page = `/sessions/${match.id}`
  const teamsReady =
    match.participants.some((p) => p.team === 0) && match.participants.some((p) => p.team === 1)
  if (match.organizerId === playerId) {
    // Multi-match sessions are scored match by match, teams set per match.
    if (!match.matchMode && !teamsReady) return { kind: "teams", href: page }
    return { kind: "organizer", href: `${page}#risultato` }
  }
  if (match.hasLiveScore && !match.matchMode && teamsReady) return { kind: "board", href: `/segna?session=${match.id}` }
  return { kind: "wait", href: page }
}

/** Fewer registered players than this and the match didn't really happen. */
export const MIN_PLAYED = 2

/** Whether a match with these seats was actually played, so it's worth scoring. */
export function wasPlayed(participants: { playerId: string | null }[]): boolean {
  return participants.filter((p) => p.playerId !== null).length >= MIN_PLAYED
}
