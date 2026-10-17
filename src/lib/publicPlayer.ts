import type { Prisma } from "@/generated/prisma/client"

/* ────────────────────────────────────────────────────────────────────────── */
/*  The fields of a Player anyone may see.                                     */
/*                                                                             */
/*  Server actions are public RPC endpoints and their results reach client    */
/*  components as-is: returning a whole Player row handed out birth date,      */
/*  gender, credits balance and the auth user id to anyone who asked. Every    */
/*  query that serves other people's profiles selects this instead.            */
/* ────────────────────────────────────────────────────────────────────────── */

export const PUBLIC_PLAYER_SELECT = {
  id: true,
  name: true,
  firstName: true,
  lastName: true,
  // Shown as the flag on the SanderCard.
  nationality: true,
  preferredRole: true,
  avatarUrl: true,
  matchesWon: true,
  matchesLost: true,
  tournamentsWon: true,
  winRatePct: true,
  level: true,
  glickoRating: true,
  glickoRD: true,
  sessionsPlayed: true,
  attPct: true,
  difPct: true,
  murPct: true,
  alzPct: true,
  ricPct: true,
  staPct: true,
} as const satisfies Prisma.PlayerSelect

export type PublicPlayer = Prisma.PlayerGetPayload<{ select: typeof PUBLIC_PLAYER_SELECT }>

/**
 * Name given to a player whose account was deleted. The row stays so match
 * history, standings and organised sessions keep pointing at something, but
 * it holds no personal data and is left out of lists and leaderboards.
 */
export const DELETED_PLAYER_NAME = "Giocatore eliminato"

/** Prisma filter that skips anonymised (deleted) players. */
export const NOT_DELETED_PLAYER = {
  NOT: { name: DELETED_PLAYER_NAME, userId: null },
} as const satisfies Prisma.PlayerWhereInput
