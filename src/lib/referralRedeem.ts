import { db } from "@/lib/db"
import { INVITER_SC, INVITER_XP, INVITEE_SC } from "@/lib/referral"

/* ────────────────────────────────────────────────────────────────────────── */
/*  Referrals — INTERNAL only (called from registration and match closing).    */
/*                                                                             */
/*  NOT a "use server" action: it must never be a client-callable endpoint,    */
/*  or anyone could farm SanderCredits by looping it against their own player. */
/*                                                                             */
/*  Signing up only links the inviter. Both rewards are paid the first time    */
/*  the invited player finishes a real match with other people, so a pile of   */
/*  fake accounts earns nothing. Each guard is an atomic conditional update.   */
/* ────────────────────────────────────────────────────────────────────────── */

export async function linkInvite(userId: string, inviterPlayerId: string): Promise<void> {
  // Guard against self-invite (the inviter's own account, if any).
  const inviterPlayer = await db.player.findUnique({
    where: { id: inviterPlayerId },
    select: { userId: true },
  })
  if (inviterPlayer?.userId && inviterPlayer.userId === userId) return

  await db.user.updateMany({
    where: { id: userId, invitedByPlayerId: null },
    data: { invitedByPlayerId: inviterPlayerId },
  })
}

/**
 * Pay pending referral rewards for these players, if this was their first match.
 * Safe to call on every match close: a user is rewarded at most once.
 */
export async function rewardInvitesAfterMatch(playerIds: string[]): Promise<void> {
  if (playerIds.length === 0) return
  const pending = await db.player.findMany({
    where: {
      id: { in: playerIds },
      user: { invitedByPlayerId: { not: null }, inviteRewardedAt: null },
    },
    select: { id: true, userId: true, user: { select: { invitedByPlayerId: true } } },
  })

  for (const p of pending) {
    const inviterId = p.user?.invitedByPlayerId
    if (!p.userId || !inviterId) continue

    const paid = await db.$transaction(async (tx) => {
      const claimed = await tx.user.updateMany({
        where: { id: p.userId!, inviteRewardedAt: null },
        data: { inviteRewardedAt: new Date() },
      })
      if (claimed.count === 0) return false
      await tx.player.update({
        where: { id: inviterId },
        data: { xp: { increment: INVITER_XP }, sanderCredits: { increment: INVITER_SC } },
      })
      await tx.player.update({
        where: { id: p.id },
        data: { sanderCredits: { increment: INVITEE_SC } },
      })
      return true
    })
    if (!paid) continue

    try {
      const { notifyPlayer } = await import("@/lib/push")
      await notifyPlayer(inviterId, {
        title: "🎉 Il tuo amico ha giocato la prima partita!",
        body: `Hai guadagnato +${INVITER_SC} SanderCredits e +${INVITER_XP} XP. Continua a invitare!`,
        url: "/profile?tab=invita",
      })
      await notifyPlayer(p.id, {
        title: "Prima partita giocata! 🏐",
        body: `Ecco i tuoi +${INVITEE_SC} SanderCredits di benvenuto.`,
        url: "/profile",
      })
    } catch {
      // A failed push must never undo a reward.
    }
  }
}
