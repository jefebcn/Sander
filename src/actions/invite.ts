"use server"

import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"

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
 * Link a newly registered user to the player who invited them,
 * and award the inviter 50 XP.
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

  // Award 50 XP to the inviter
  await db.player.update({
    where: { id: inviterPlayerId },
    data: { xp: { increment: 50 } },
  })

  revalidatePath("/profile")
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
