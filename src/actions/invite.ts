"use server"

import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { INVITER_SC, INVITER_XP } from "@/lib/referral"

// Must match the buildPromoCode function in profile/page.tsx
function buildPromoCode(id: string): string {
  const clean = id.replace(/[^a-z0-9]/gi, "").toUpperCase()
  return `${clean.slice(2, 6)}-${clean.slice(6, 10)}`
}

/**
 * Given an invite code (e.g. "ABCD-EFGH"), find the Player whose ID maps to it.
 * Returns the Player id or null if not found.
 */
export async function findPlayerByInviteCode(code: string): Promise<string | null> {
  const normalized = code.trim().toUpperCase()
  if (!normalized || normalized.length !== 9) return null

  const players = await db.player.findMany({ select: { id: true } })
  const match = players.find((p) => buildPromoCode(p.id) === normalized)
  return match?.id ?? null
}

/**
 * Link a newly registered user to the player who invited them, and reward the
 * inviter with XP + SanderCredits. The invitee's welcome bonus is granted later,
 * when their Player profile is created during onboarding (see saveProfile).
 */
export async function redeemInvite(
  userId: string,
  inviterPlayerId: string,
): Promise<void> {
  // Link the user to the inviter
  await db.user.update({
    where: { id: userId },
    data: { invitedByPlayerId: inviterPlayerId },
  })

  // Reward the inviter: XP + SanderCredits
  await db.player.update({
    where: { id: inviterPlayerId },
    data: {
      xp: { increment: INVITER_XP },
      sanderCredits: { increment: INVITER_SC },
    },
  })

  // Notify the inviter (fire-and-forget)
  import("@/lib/push")
    .then(({ notifyPlayer }) =>
      notifyPlayer(inviterPlayerId, {
        title: "🎉 Un amico si è iscritto!",
        body: `Hai guadagnato +${INVITER_SC} SanderCredits e +${INVITER_XP} XP. Continua a invitare!`,
        url: "/profile?tab=invita",
      }),
    )
    .catch(() => {})

  revalidatePath("/profile")
}

/** Ranking of players by number of friends invited (with a linked account). */
export async function getReferralLeaderboard(
  limit = 10,
): Promise<{ id: string; name: string; avatarUrl: string | null; invites: number }[]> {
  const grouped = await db.user.groupBy({
    by: ["invitedByPlayerId"],
    where: { invitedByPlayerId: { not: null } },
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
 * Count how many users were invited by the current player.
 */
export async function getInviteCount(): Promise<number> {
  const session = await auth()
  if (!session?.user?.id) return 0

  const player = await db.player.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  })
  if (!player) return 0

  return db.user.count({ where: { invitedByPlayerId: player.id } })
}
