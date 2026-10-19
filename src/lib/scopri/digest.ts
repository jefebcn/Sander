import { db } from "@/lib/db"
import { NOT_DELETED_PLAYER } from "@/lib/publicPlayer"
import { MIN_AGE } from "./rules"
import { loadPool } from "./server"
import { canNudge, newcomerMessage, inviteMessage, NEWCOMER_EVERY_H, INVITE_EVERY_H, INVITE_MIN_POOL } from "./digestRules"

/** Cap per run: a reminder sweep must never turn into a blast. */
const MAX_PER_RUN = 400

/**
 * Daily Scopri reminders (run from the morning cron). Returns how many were
 * sent. Respects the "no reminder pushes" switch (nudgesOptOut) and never
 * writes to minors.
 */
export async function scopriDigest(now: Date = new Date()): Promise<number> {
  const pool = await loadPool(now)
  const byCity = new Map<string, typeof pool>()
  for (const p of pool) {
    if (!p.homeCity) continue
    byCity.set(p.homeCity, [...(byCity.get(p.homeCity) ?? []), p])
  }
  const since = new Date(now.getTime() - 24 * 3600_000)
  let sent = 0
  const { notifyPlayer } = await import("@/lib/push")

  // 1) Already on Scopri: newcomers in your comune since yesterday.
  for (const [city, people] of byCity) {
    const fresh = people.filter((p) => p.discoverProfile?.readyAt && p.discoverProfile.readyAt >= since)
    if (fresh.length === 0) continue
    for (const p of people) {
      if (sent >= MAX_PER_RUN) return sent
      const others = fresh.filter((f) => f.id !== p.id).length
      if (others === 0 || !canNudge(p.discoverProfile?.nudgedAt, now, NEWCOMER_EVERY_H)) continue
      const optOut = await db.player.findUnique({ where: { id: p.id }, select: { nudgesOptOut: true } })
      if (optOut?.nudgesOptOut) continue
      await notifyPlayer(p.id, newcomerMessage(others, city)).catch(() => {})
      await db.discoverProfile.update({ where: { playerId: p.id }, data: { nudgedAt: now } })
      sent++
    }
  }

  // 2) Not on Scopri yet, in a comune where enough people already are.
  const onScopri = new Set(pool.map((p) => p.id))
  const adultBefore = new Date(now)
  adultBefore.setUTCFullYear(adultBefore.getUTCFullYear() - MIN_AGE)
  for (const [city, people] of byCity) {
    if (people.length < INVITE_MIN_POOL) continue
    const targets = await db.player.findMany({
      where: {
        ...NOT_DELETED_PLAYER,
        userId: { not: null },
        homeCity: city,
        nudgesOptOut: false,
        OR: [{ birthDate: null }, { birthDate: { lte: adultBefore } }],
      },
      select: { id: true, discoverProfile: { select: { nudgedAt: true, paused: true } } },
      take: MAX_PER_RUN,
    })
    for (const t of targets) {
      if (sent >= MAX_PER_RUN) return sent
      if (onScopri.has(t.id) || t.discoverProfile?.paused) continue
      if (!canNudge(t.discoverProfile?.nudgedAt, now, INVITE_EVERY_H)) continue
      await notifyPlayer(t.id, inviteMessage(people.length, city)).catch(() => {})
      await db.discoverProfile.upsert({
        where: { playerId: t.id },
        create: { playerId: t.id, nudgedAt: now },
        update: { nudgedAt: now },
      })
      sent++
    }
  }
  return sent
}
