import { db } from "@/lib/db"

/**
 * Returns true if the given email is in the ADMIN_EMAILS env var.
 * ADMIN_EMAILS can be a single email or a comma-separated list.
 * Falls back to ADMIN_EMAIL for backwards compatibility.
 */
export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false
  const raw = process.env.ADMIN_EMAILS ?? process.env.ADMIN_EMAIL ?? ""
  return raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
    .includes(email.toLowerCase())
}

/**
 * Returns true if the user is a global admin, the creator of the tournament, or
 * staff of the approved club that organises it.
 */
export async function canManageTournament(
  email: string | null | undefined,
  tournamentId: string,
): Promise<boolean> {
  if (isAdminEmail(email)) return true
  if (!email) return false

  const player = await db.player.findFirst({
    where: { user: { email } },
    select: { id: true },
  })
  if (!player) return false

  const t = await db.tournament.findUnique({
    where: { id: tournamentId },
    select: { createdByPlayerId: true, clubId: true },
  })
  if (!t) return false
  if (t.createdByPlayerId && t.createdByPlayerId === player.id) return true
  if (!t.clubId) return false
  const staff = await db.clubMember.findFirst({
    where: { clubId: t.clubId, playerId: player.id, club: { status: "APPROVED" } },
    select: { id: true },
  })
  return !!staff
}
