import { db } from "@/lib/db"
import { clubRoster, type RosterCsvRow } from "@/lib/clubRoster"
import { NOT_DELETED_PLAYER } from "@/lib/publicPlayer"

export type ClubRosterEntry = RosterCsvRow & { avatarUrl: string | null }

/** Everyone who signed up to the club's tournaments or follows it, with names and contacts (staff only). */
export async function loadClubRoster(clubId: string): Promise<ClubRosterEntry[]> {
  const [regs, follows] = await Promise.all([
    db.tournamentRegistration.findMany({
      where: { tournament: { clubId } },
      select: {
        playerId: true,
        tournamentId: true,
        paymentStatus: true,
        isSpectator: true,
        checkedInAt: true,
        createdAt: true,
        tournament: { select: { date: true, priceCents: true } },
      },
    }),
    db.clubFollow.findMany({ where: { clubId }, select: { playerId: true, createdAt: true } }),
  ])
  const rows = clubRoster(
    regs.map((r) => ({ ...r, tournamentDate: r.tournament.date, priceCents: r.tournament.priceCents })),
    follows,
    new Date(),
  )
  const players = await db.player.findMany({
    where: { id: { in: rows.map((r) => r.playerId) }, ...NOT_DELETED_PLAYER },
    select: { id: true, name: true, avatarUrl: true, homeCity: true, user: { select: { email: true } } },
  })
  const by = new Map(players.map((p) => [p.id, p]))
  return rows.flatMap((r) => {
    const p = by.get(r.playerId)
    if (!p) return []
    // A follower who never signed up shared nothing with the club: no email.
    return [{ ...r, name: p.name, avatarUrl: p.avatarUrl, city: p.homeCity, email: r.tournaments > 0 ? (p.user?.email ?? null) : null }]
  })
}
