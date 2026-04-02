import { db } from "@/lib/db"

/** Counts completed sessions in the last 28 days, capped at 10 (used as activity streak). */
export async function getStreak(playerId: string): Promise<number> {
  const since = new Date(Date.now() - 28 * 24 * 60 * 60 * 1000)
  const count = await db.sessionParticipant.count({
    where: { playerId, session: { status: "COMPLETED", date: { gte: since } } },
  })
  return Math.min(count, 10)
}
