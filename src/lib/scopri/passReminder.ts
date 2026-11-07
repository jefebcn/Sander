import { db } from "@/lib/db"
import { notifyPlayer } from "@/lib/push"

/** Days before the end of a SANDER+ pass when the reminder goes out. */
export const PASS_REMINDER_DAYS = 3

/**
 * SANDER+ bought by card (SumUp) is a 30-day pass that doesn't renew by
 * itself: tell the player a few days before it ends, once per pass end date.
 * Not for active subscriptions (they renew).
 */
export async function plusPassReminders(now: Date = new Date()): Promise<number> {
  const until = new Date(now.getTime() + PASS_REMINDER_DAYS * 86_400_000)
  const due = await db.discoverProfile.findMany({
    where: { plusPassUntil: { gt: now, lte: until }, OR: [{ plusUntil: null }, { plusUntil: { lt: now } }] },
    select: { playerId: true, plusPassUntil: true, plusPassRemindedFor: true },
    take: 500,
  })
  let sent = 0
  for (const p of due) {
    if (p.plusPassRemindedFor && p.plusPassUntil && p.plusPassRemindedFor.getTime() === p.plusPassUntil.getTime()) continue
    // Claim first: a second cron run sends nothing.
    const claimed = await db.discoverProfile.updateMany({
      where: { playerId: p.playerId, OR: [{ plusPassRemindedFor: null }, { plusPassRemindedFor: { not: p.plusPassUntil! } }] },
      data: { plusPassRemindedFor: p.plusPassUntil },
    })
    if (claimed.count === 0) continue
    const days = Math.max(1, Math.ceil((p.plusPassUntil!.getTime() - now.getTime()) / 86_400_000))
    await notifyPlayer(p.playerId, {
      title: "SANDER+ sta per scadere",
      // No call to buy: the same push reaches the iPhone app (store rules).
      body: `Il tuo SANDER+ finisce tra ${days === 1 ? "1 giorno" : `${days} giorni`}: poi tornano i limiti della versione gratuita.`,
      url: "/scopri/plus",
    }).catch(() => {})
    sent++
  }
  return sent
}
