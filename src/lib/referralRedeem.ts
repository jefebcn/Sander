import { db } from "@/lib/db"
import { INVITER_SC, INVITER_XP } from "@/lib/referral"
import { revalidatePath } from "next/cache"

/* ────────────────────────────────────────────────────────────────────────── */
/*  Referral redemption — INTERNAL only (called from registration).            */
/*                                                                             */
/*  NOT a "use server" action: it must never be a client-callable endpoint,    */
/*  or anyone could farm SanderCredits by looping it against their own player. */
/*  Idempotent: the inviter is rewarded exactly once, the first time the new    */
/*  user is linked (guarded by an atomic conditional update).                   */
/* ────────────────────────────────────────────────────────────────────────── */

export async function redeemInvite(userId: string, inviterPlayerId: string): Promise<void> {
  // Guard against self-invite (the inviter's own account, if any).
  const inviterPlayer = await db.player.findUnique({
    where: { id: inviterPlayerId },
    select: { userId: true },
  })
  if (inviterPlayer?.userId && inviterPlayer.userId === userId) return

  const rewarded = await db.$transaction(async (tx) => {
    // Link only if not already linked → the idempotency guard.
    const linked = await tx.user.updateMany({
      where: { id: userId, invitedByPlayerId: null },
      data: { invitedByPlayerId: inviterPlayerId },
    })
    if (linked.count === 0) return false

    await tx.player.update({
      where: { id: inviterPlayerId },
      data: {
        xp: { increment: INVITER_XP },
        sanderCredits: { increment: INVITER_SC },
      },
    })
    return true
  })

  if (!rewarded) return

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
