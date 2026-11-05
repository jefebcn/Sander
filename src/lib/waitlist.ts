import { db } from "@/lib/db"
import { SEAT_FREE_STATUSES, seatLimit } from "@/lib/tournament/capacity"

/** Seats, waiting list and my place in it, for the sign-up box of a tournament page. */
export async function waitlistState(tournamentId: string, playerId: string | null) {
  const t = await db.tournament.findUnique({ where: { id: tournamentId }, select: { type: true, maxTeams: true } })
  const limit = t ? seatLimit(t.type, t.maxTeams) : null
  const [taken, mine, myReg] = await Promise.all([
    limit == null ? 0 : db.tournamentRegistration.count({ where: { tournamentId, isSpectator: false, paymentStatus: { notIn: [...SEAT_FREE_STATUSES] } } }),
    playerId ? db.tournamentWaitlist.findUnique({ where: { tournamentId_playerId: { tournamentId, playerId } }, select: { createdAt: true } }) : null,
    playerId ? db.tournamentRegistration.findUnique({ where: { tournamentId_playerId: { tournamentId, playerId } }, select: { id: true, paymentStatus: true } }) : null,
  ])
  const position = mine ? await db.tournamentWaitlist.count({ where: { tournamentId, createdAt: { lte: mine.createdAt } } }) : null
  return {
    full: limit != null && taken >= limit,
    waitlistPosition: position,
    /** For the check-in ticket. */
    myRegistrationId: myReg && !(SEAT_FREE_STATUSES as readonly string[]).includes(myReg.paymentStatus) ? myReg.id : null,
  }
}
