import { db } from "@/lib/db"
import { JOIN_GRACE_MS } from "@/lib/sessionRules"
import type { GroupGame } from "@/components/scopri/types"

/**
 * Open matches in your comune in the next three days that still need people:
 * the group side of Scopri, woven into the deck between players.
 */
export async function openGamesNear(meId: string, city: string | null, now: Date = new Date(), take = 2): Promise<GroupGame[]> {
  if (!city) return []
  const rows = await db.session.findMany({
    where: {
      status: "OPEN",
      city,
      date: { gte: new Date(now.getTime() + JOIN_GRACE_MS), lte: new Date(now.getTime() + 3 * 86_400_000) },
      organizerId: { not: meId },
      participants: { none: { playerId: meId } },
    },
    orderBy: { date: "asc" },
    take: 6,
    select: {
      id: true,
      title: true,
      location: true,
      date: true,
      maxPlayers: true,
      _count: { select: { participants: true } },
      participants: { take: 4, select: { guestName: true, player: { select: { name: true, avatarUrl: true } } } },
    },
  })
  return rows
    .filter((r) => r._count.participants < r.maxPlayers)
    .slice(0, take)
    .map((r) => ({
      id: r.id,
      title: r.title,
      location: r.location,
      date: r.date.toISOString(),
      missing: r.maxPlayers - r._count.participants,
      maxPlayers: r.maxPlayers,
      faces: r.participants.map((p) => ({ name: p.player?.name ?? p.guestName ?? "Ospite", avatarUrl: p.player?.avatarUrl ?? null })),
    }))
}
