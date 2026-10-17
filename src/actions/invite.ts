"use server"

import { db } from "@/lib/db"
import { auth } from "@/lib/auth"

import { buildPromoCode } from "@/lib/referral"

/**
 * Given an invite code (e.g. "ABCD-EFGH"), find the Player whose ID maps to it.
 * Returns the Player id or null if not found.
 */
export async function findPlayerByInviteCode(code: string): Promise<string | null> {
  const normalized = code.trim().toUpperCase()
  if (!normalized || normalized.length !== 9) return null

  // The code is characters 3-10 of the id (see buildPromoCode): match it in the
  // database instead of loading every player into memory on each sign-up.
  const key = normalized.replace("-", "")
  if (!/^[A-Z0-9]{8}$/.test(key)) return null
  const rows = await db.$queryRaw<{ id: string }[]>`
    SELECT id FROM players WHERE upper(substring(id from 3 for 8)) = ${key} LIMIT 5`
  const match = rows.find((p) => buildPromoCode(p.id) === normalized)
  return match?.id ?? null
}

// NOTE: invite linking and rewards live in src/lib/referralRedeem.ts (internal,
// not a callable server action) so they can't be farmed by clients. Do not
// re-export them.

/** Ranking of players by number of invited friends who have played a first match. */
export async function getReferralLeaderboard(
  limit = 10,
): Promise<{ id: string; name: string; avatarUrl: string | null; invites: number }[]> {
  const grouped = await db.user.groupBy({
    by: ["invitedByPlayerId"],
    where: { invitedByPlayerId: { not: null }, inviteRewardedAt: { not: null } },
    _count: { _all: true },
  })
  if (grouped.length === 0) return []

  const ids = grouped.map((g) => g.invitedByPlayerId!).filter(Boolean)
  const players = await db.player.findMany({
    where: { id: { in: ids } },
    select: { id: true, name: true, avatarUrl: true },
  })
  const nameById = new Map(players.map((p) => [p.id, p]))

  return grouped
    .map((g) => {
      const p = nameById.get(g.invitedByPlayerId!)
      return p
        ? { id: p.id, name: p.name, avatarUrl: p.avatarUrl, invites: g._count._all }
        : null
    })
    .filter((x): x is { id: string; name: string; avatarUrl: string | null; invites: number } => x !== null)
    .sort((a, b) => b.invites - a.invites)
    .slice(0, limit)
}

/**
 * Count how many invited friends of the current player have played a first
 * match, i.e. the invites that actually earned credits.
 */
export async function getInviteCount(): Promise<number> {
  const session = await auth()
  if (!session?.user?.id) return 0

  const player = await db.player.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  })
  if (!player) return 0

  return db.user.count({ where: { invitedByPlayerId: player.id, inviteRewardedAt: { not: null } } })
}
