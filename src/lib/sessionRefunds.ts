import { db } from "@/lib/db"
import type { Prisma } from "@/generated/prisma/client"
import { STALE_SESSION_MS } from "@/lib/sessionRules"

/* Internal only (not a "use server" file): moves SanderCredits. */

type Tx = Prisma.TransactionClient

/**
 * Give every participant back exactly what they paid for this match and zero
 * the record, so a second call refunds nothing. Run inside the transaction that
 * cancels or deletes the match.
 */
export async function refundSessionCredits(tx: Tx, sessionId: string): Promise<string[]> {
  const paid = await tx.sessionParticipant.findMany({
    where: { sessionId, paidCredits: { gt: 0 }, playerId: { not: null } },
    select: { id: true, playerId: true, paidCredits: true },
  })
  for (const p of paid) {
    const cleared = await tx.sessionParticipant.updateMany({
      where: { id: p.id, paidCredits: p.paidCredits },
      data: { paidCredits: 0 },
    })
    if (cleared.count === 0) continue
    await tx.player.update({
      where: { id: p.playerId! },
      data: { sanderCredits: { increment: p.paidCredits } },
    })
  }
  return paid.map((p) => p.playerId!)
}

/**
 * Matches left OPEN/FULL more than a week after their date were never played or
 * never closed: cancel them and refund the credits. Run by the daily cron.
 */
export async function cancelStaleSessions(now: Date = new Date()): Promise<number> {
  const stale = await db.session.findMany({
    where: { status: { in: ["OPEN", "FULL"] }, date: { lt: new Date(now.getTime() - STALE_SESSION_MS) } },
    select: { id: true },
    take: 200,
  })
  let cancelled = 0
  for (const s of stale) {
    const done = await db.$transaction(async (tx) => {
      const claimed = await tx.session.updateMany({
        where: { id: s.id, status: { in: ["OPEN", "FULL"] } },
        data: { status: "CANCELLED" },
      })
      if (claimed.count === 0) return false
      await refundSessionCredits(tx, s.id)
      return true
    })
    if (done) cancelled++
  }
  return cancelled
}
