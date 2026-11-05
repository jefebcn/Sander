import { db } from "@/lib/db"
import { isAdminEmail } from "@/lib/isAdmin"

/** The club role of a player, or null. Only approved clubs grant anything. */
export async function clubRole(playerId: string, clubId: string): Promise<"OWNER" | "STAFF" | null> {
  const m = await db.clubMember.findUnique({
    where: { clubId_playerId: { clubId, playerId } },
    select: { role: true, club: { select: { status: true } } },
  })
  return m && m.club.status === "APPROVED" ? m.role : null
}

/** SANDER admins, or the club's own staff (approved clubs only). */
export async function canManageClub(email: string | null | undefined, playerId: string | null, clubId: string): Promise<boolean> {
  if (isAdminEmail(email)) return true
  return !!playerId && (await clubRole(playerId, clubId)) !== null
}

/** Approved clubs this player runs: where "Nuovo torneo" can be created. */
export async function myManagedClubs(playerId: string) {
  return db.club.findMany({
    where: { status: "APPROVED", members: { some: { playerId } } },
    select: { id: true, slug: true, name: true },
    orderBy: { name: "asc" },
  })
}
