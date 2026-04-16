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
 * Returns true if the user is a global admin OR the creator of the specific tournament.
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
    select: { createdByPlayerId: true },
  })
  return !!t?.createdByPlayerId && t.createdByPlayerId === player.id
}
