/* ────────────────────────────────────────────────────────────────────────── */
/*  From a 1-to-1 match to a game: a pair is half a 2v2.                       */
/*  - games that miss exactly a pair (two or more free seats), to join as two  */
/*  - how many pairs and pair-sized gaps are around, so a like has a point     */
/* ────────────────────────────────────────────────────────────────────────── */

import { db } from "@/lib/db"
import { JOIN_GRACE_MS } from "@/lib/sessionRules"
import type { GroupGame } from "@/components/scopri/types"

const DAY = 86_400_000

/** Open games in your comuni in the next week with room for the two of you. */
export async function pairSlotsNear(
  meId: string,
  partnerId: string,
  cities: string[],
  now: Date = new Date(),
  take = 5,
): Promise<GroupGame[]> {
  if (cities.length === 0) return []
  const rows = await db.session.findMany({
    where: {
      status: "OPEN",
      city: { in: cities },
      date: { gte: new Date(now.getTime() + JOIN_GRACE_MS), lte: new Date(now.getTime() + 7 * DAY) },
      participants: { none: { playerId: { in: [meId, partnerId] } } },
    },
    orderBy: { date: "asc" },
    take: 30,
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
    .filter((r) => r.maxPlayers - r._count.participants >= 2)
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

export interface PlayNearby {
  city: string
  /** Pairs (other than yours) with a member in your comune: ready to be challenged. */
  pairs: number
  /** Games in the next three days that miss at least a whole pair. */
  pairGames: number
}

/** What a like can turn into around you: pairs to challenge and games that need a pair. */
export async function playNearby(meId: string, city: string | null, now: Date = new Date()): Promise<PlayNearby | null> {
  if (!city) return null
  const [pairs, games] = await Promise.all([
    db.duo.count({
      where: {
        status: "ACTIVE",
        OR: [{ a: { homeCity: city } }, { b: { homeCity: city } }],
        NOT: { OR: [{ aId: meId }, { bId: meId }] },
      },
    }),
    db.session.findMany({
      where: {
        status: "OPEN",
        city,
        date: { gte: new Date(now.getTime() + JOIN_GRACE_MS), lte: new Date(now.getTime() + 3 * DAY) },
        participants: { none: { playerId: meId } },
      },
      take: 50,
      select: { maxPlayers: true, _count: { select: { participants: true } } },
    }),
  ])
  return { city, pairs, pairGames: games.filter((g) => g.maxPlayers - g._count.participants >= 2).length }
}
