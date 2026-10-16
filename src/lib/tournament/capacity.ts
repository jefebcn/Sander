/**
 * Tournament capacity rules (pure — no DB imports).
 *
 * `Tournament.maxTeams` is entered by the organizer as "Max squadre", but
 * registrations are per player. Fixed-pair formats (classic bracket, double
 * elimination, round robin) pair consecutive players into teams, so one team
 * takes two seats; rotating-partner formats (King of the Beach, Chicece) count
 * one seat per player.
 *
 * Seat rule: every non-spectator registration that is not CANCELLED / FAILED /
 * REFUNDED holds a seat — PENDING included. A PENDING Stripe row is freed by the
 * `checkout.session.expired` webhook after 30 minutes, and a stale manual one can
 * be removed by the organizer, so counting them never oversells a tournament.
 */

export const PAIR_FORMATS = ["BRACKETS", "DOUBLE_ELIMINATION", "ROUND_ROBIN"] as const

/** Payment statuses that do NOT hold a seat. */
export const SEAT_FREE_STATUSES = ["CANCELLED", "FAILED", "REFUNDED"] as const

export function playersPerTeam(type: string): number {
  return (PAIR_FORMATS as readonly string[]).includes(type) ? 2 : 1
}

/** Maximum number of player registrations, or null when unlimited. */
export function seatLimit(type: string, maxTeams: number | null | undefined): number | null {
  if (maxTeams == null || maxTeams <= 0) return null
  return maxTeams * playersPerTeam(type)
}

export function holdsSeat(reg: { paymentStatus: string; isSpectator: boolean }): boolean {
  if (reg.isSpectator) return false
  return !(SEAT_FREE_STATUSES as readonly string[]).includes(reg.paymentStatus)
}

/**
 * True when one more player can register.
 * @param takenSeats seats held by OTHER players (exclude the registering player)
 */
export function hasFreeSeat(
  type: string,
  maxTeams: number | null | undefined,
  takenSeats: number,
): boolean {
  const limit = seatLimit(type, maxTeams)
  return limit == null || takenSeats < limit
}

export const TOURNAMENT_FULL_MESSAGE = "Torneo al completo: non ci sono più posti disponibili."
