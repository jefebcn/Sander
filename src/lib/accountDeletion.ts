import { del } from "@vercel/blob"
import { db } from "@/lib/db"
import { DELETED_PLAYER_NAME } from "@/lib/publicPlayer"
import { refundSessionCredits } from "@/lib/sessionRefunds"
import { cancelPlusNow } from "@/lib/scopri/plus"

/* ────────────────────────────────────────────────────────────────────────── */
/*  Erase an account (GDPR). INTERNAL only (not a "use server" file): called   */
/*  by the player's own deleteMyAccount and by the admin's deletePlayer.        */
/*  Personal data and files go; anonymous match history stays for the others.  */
/* ────────────────────────────────────────────────────────────────────────── */

export const DELETED_MESSAGE = "Messaggio eliminato"

const OUR_BLOBS = /\.public\.blob\.vercel-storage\.com\//

export async function eraseAccount(playerId: string): Promise<void> {
  const player = await db.player.findUnique({
    where: { id: playerId },
    select: { userId: true, avatarUrl: true, user: { select: { email: true } } },
  })
  if (!player) throw new Error("Giocatore non trovato")
  const email = player.user?.email ?? null

  // SANDER+ is stopped on Stripe first: never a deleted account still paying.
  await cancelPlusNow(playerId)

  // Their uploaded files, removed from storage once the rows are gone.
  const [photos, selfies, videos] = await Promise.all([
    db.playerPhoto.findMany({ where: { playerId }, select: { url: true } }),
    db.selfieCheck.findMany({ where: { playerId }, select: { imageUrl: true } }),
    db.videoSubmission.findMany({ where: { playerId }, select: { blobUrl: true } }),
  ])
  const files = [
    ...new Set(
      [player.avatarUrl, ...photos.map((p) => p.url), ...selfies.map((s) => s.imageUrl), ...videos.map((v) => v.blobUrl)]
        .filter((u): u is string => !!u && OUR_BLOBS.test(u)),
    ),
  ]

  // Deleting the Player row is not an option: sessions they organised point at
  // it with no cascade (the delete failed for any organiser), and the cascade on
  // match/standing rows would rewrite other people's tournament history. So the
  // row stays as an anonymous placeholder, stripped of every personal field,
  // and only the login (User + its Account/AuthSession rows) is deleted.
  // All in one transaction: never a half-deleted account.
  await db.$transaction(async (tx) => {
    // Matches they were organising can't go ahead with a ghost organiser:
    // cancel them and give the other players their credits back.
    const organised = await tx.session.findMany({
      where: { organizerId: playerId, status: { in: ["OPEN", "FULL"] } },
      select: { id: true },
    })
    for (const s of organised) {
      await tx.session.update({ where: { id: s.id }, data: { status: "CANCELLED" } })
      await refundSessionCredits(tx, s.id)
    }
    // Free the seats they held in other people's upcoming matches.
    const seats = await tx.sessionParticipant.findMany({
      where: { playerId, session: { status: { in: ["OPEN", "FULL"] } } },
      select: { id: true, sessionId: true },
    })
    for (const seat of seats) {
      await tx.sessionParticipant.delete({ where: { id: seat.id } })
      await tx.session.updateMany({ where: { id: seat.sessionId, status: "FULL" }, data: { status: "OPEN" } })
    }

    // Rows that only ever concerned this person.
    await tx.pushSubscription.deleteMany({ where: { playerId } })
    await tx.notification.deleteMany({ where: { playerId } })
    await tx.playerAvailability.deleteMany({ where: { playerId } })
    await tx.sessionWaitlist.deleteMany({ where: { playerId } })
    await tx.sessionNudge.deleteMany({ where: { playerId } })
    // Scopri: photos, prompts, likes and pairs are personal, not history.
    await tx.playerPhoto.deleteMany({ where: { playerId } })
    await tx.playerPrompt.deleteMany({ where: { playerId } })
    await tx.discoverProfile.deleteMany({ where: { playerId } })
    await tx.playerSwipe.deleteMany({ where: { OR: [{ fromId: playerId }, { toId: playerId }] } })
    await tx.dailyPick.deleteMany({ where: { OR: [{ playerId }, { pickId: playerId }] } })
    await tx.playerMatch.updateMany({ where: { OR: [{ aId: playerId }, { bId: playerId }], endedAt: null }, data: { endedAt: new Date() } })
    await tx.duo.updateMany({ where: { OR: [{ aId: playerId }, { bId: playerId }], status: { not: "ENDED" } }, data: { status: "ENDED", endedAt: new Date() } })
    await tx.playAgainVote.deleteMany({ where: { OR: [{ voterId: playerId }, { targetId: playerId }] } })
    await tx.attendanceEvent.deleteMany({ where: { playerId } })
    // Blocks they made go; reports others made about them stay for safety.
    await tx.playerBlock.deleteMany({ where: { blockerId: playerId } })

    // Words and files that were theirs. Messages stay as placeholders so the
    // other side of a conversation still reads; the text itself is gone.
    await tx.chatMessage.updateMany({ where: { senderId: playerId }, data: { body: DELETED_MESSAGE } })
    // Out of every group and match chat; a private chat keeps its other side.
    await tx.chatParticipant.deleteMany({ where: { playerId, thread: { kind: { in: ["GROUP", "SESSION"] } } } })
    await tx.gameProposal.updateMany({
      where: { status: "PENDING", OR: [{ fromId: playerId }, { toId: playerId }] },
      data: { status: "CANCELLED" },
    })
    await tx.selfieCheck.deleteMany({ where: { playerId } })
    await tx.videoSubmission.deleteMany({ where: { playerId } })
    await tx.reaction.deleteMany({ where: { playerId } })
    await tx.duoSwipe.updateMany({ where: { byId: playerId }, data: { comment: null } })
    await tx.tournamentRegistration.updateMany({
      where: { playerId },
      data: { teamName: null, teamLogoUrl: null, adminNotes: null },
    })
    // Sign-in and password-reset tokens carry the email address.
    if (email) await tx.verificationToken.deleteMany({ where: { identifier: { in: [email, `reset:${email}`] } } })

    await tx.player.update({
      where: { id: playerId },
      data: {
        name: DELETED_PLAYER_NAME,
        firstName: null,
        lastName: null,
        birthDate: null,
        gender: null,
        nationality: null,
        avatarUrl: null,
        userId: null,
        homeCity: null,
        startLevel: null,
        nudgesOptOut: true,
        sanderCredits: 0,
        // Zero games: off every leaderboard (see lib/rankingEligibility).
        matchesWon: 0,
        matchesLost: 0,
        winRatePct: 0,
        tournamentsWon: 0,
        sessionsPlayed: 0,
        xp: 0,
        level: 1,
      },
    })

    // Cascades to Account + AuthSession rows.
    if (player.userId) {
      await tx.user.delete({ where: { id: player.userId } })
    }
  })


  // After the commit: a storage hiccup must not undo the erasure. What's left
  // is logged so it can be removed by hand.
  if (files.length > 0) {
    await del(files).catch((e) => console.error("[account erase] blob delete failed", playerId, files.length, e))
  }
}
