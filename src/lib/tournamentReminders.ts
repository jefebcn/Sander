import { db } from "@/lib/db"
import { daysFromNow } from "@/lib/datetime"
import { notifyPlayer } from "@/lib/push"
import { tournamentReminder } from "@/lib/tournamentReminder"

/**
 * Morning sweep (daily cron): players of tomorrow's tournaments get a
 * reminder, with the fee to bring when it is paid at the court. Each
 * tournament is reminded once (reminderSentAt), even if the cron runs twice.
 */
export async function tournamentReminders(now: Date = new Date()): Promise<number> {
  const soon = await db.tournament.findMany({
    where: {
      status: "DRAFT",
      reminderSentAt: null,
      date: { gte: new Date(now.getTime() - 86_400_000), lte: new Date(now.getTime() + 3 * 86_400_000) },
    },
    select: { id: true, name: true, date: true, location: true, priceCents: true, priceCurrency: true, clubId: true },
  })
  let sent = 0
  for (const t of soon.filter((x) => daysFromNow(x.date, now) === 1)) {
    // Claim first: a second run (or a retry) never sends it twice.
    const { count } = await db.tournament.updateMany({ where: { id: t.id, reminderSentAt: null }, data: { reminderSentAt: now } })
    if (count === 0) continue
    const regs = await db.tournamentRegistration.findMany({
      where: { tournamentId: t.id, paymentStatus: { notIn: ["CANCELLED", "FAILED", "REFUNDED"] } },
      select: { playerId: true, paymentStatus: true, isSpectator: true },
    })
    for (const r of regs) {
      const msg = tournamentReminder({ ...t, paysOnSite: !!t.clubId }, r)
      await notifyPlayer(r.playerId, { ...msg, url: `/tournaments/${t.id}` }).catch(() => {})
      sent++
    }
  }
  return sent
}
