import { db } from "@/lib/db"
import { NOT_DELETED_PLAYER } from "@/lib/publicPlayer"
import { MIN_AGE } from "./rules"
import { dayKey } from "@/lib/datetime"
import { loadPool, computeDailyPicks } from "./server"
import {
  canNudge,
  newcomerMessage,
  inviteMessage,
  dailyPickMessage,
  turnMessage,
  turnNeedsReminder,
  NEWCOMER_EVERY_H,
  INVITE_EVERY_H,
  INVITE_MIN_POOL,
  DUO_REMIND_AFTER_H,
} from "./digestRules"

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

/**
 * Morning Scopri round (daily cron): compute today's stable pairing, then
 * tell each player their pick, recall chats waiting on them and pair
 * challenges left unanswered, then the newcomer/invite reminders.
 */
export async function scopriMorning(now: Date = new Date()) {
  const day = dayKey(now)
  const { notifyPlayer } = await import("@/lib/push")
  const done = await db.dailyPick.count({ where: { day } })
  const paired = done === 0 ? await computeDailyPicks(day, now) : done

  // 1) Il più compatibile di oggi — once per pick.
  let picks = 0
  const todays = await db.dailyPick.findMany({
    where: { day, notifiedAt: null, player: { nudgesOptOut: false } },
    select: { id: true, playerId: true, reasons: true, pick: { select: { firstName: true, name: true } } },
    take: MAX_PER_RUN,
  })
  for (const p of todays) {
    await notifyPlayer(p.playerId, dailyPickMessage(p.pick.firstName?.trim() || p.pick.name.split(" ")[0], p.reasons)).catch(() => {})
    await db.dailyPick.update({ where: { id: p.id }, data: { notifiedAt: now } })
    picks++
  }

  // 2) Tocca a te — the other wrote over a day ago, no reply yet.
  let turns = 0
  const matches = await db.playerMatch.findMany({
    where: { endedAt: null, threadId: { not: null } },
    select: {
      id: true,
      aId: true,
      bId: true,
      aNudgedAt: true,
      bNudgedAt: true,
      a: { select: { firstName: true, name: true, nudgesOptOut: true } },
      b: { select: { firstName: true, name: true, nudgesOptOut: true } },
      threadId: true,
    },
    take: 2000,
  })
  const threads = await db.chatThread.findMany({
    where: { id: { in: matches.map((m) => m.threadId as string) } },
    select: { id: true, messages: { orderBy: { createdAt: "desc" }, take: 1, select: { senderId: true, createdAt: true } } },
  })
  const lastBy = new Map(threads.map((t) => [t.id, t.messages[0] ?? null]))
  for (const m of matches) {
    if (turns >= MAX_PER_RUN) break
    const last = lastBy.get(m.threadId as string) ?? null
    for (const side of ["a", "b"] as const) {
      const meId = side === "a" ? m.aId : m.bId
      const other = side === "a" ? m.b : m.a
      const nudgedAt = side === "a" ? m.aNudgedAt : m.bNudgedAt
      if ((side === "a" ? m.a : m.b).nudgesOptOut) continue
      if (!turnNeedsReminder(last, meId, nudgedAt, now)) continue
      await notifyPlayer(meId, turnMessage(other.firstName?.trim() || other.name.split(" ")[0])).catch(() => {})
      await db.playerMatch.update({ where: { id: m.id }, data: side === "a" ? { aNudgedAt: now } : { bNudgedAt: now } })
      turns++
    }
  }

  // 3) Sfide di coppia ancora senza risposta.
  let duos = 0
  const pending = await db.duoSwipe.findMany({
    where: {
      liked: true,
      status: "PENDING",
      remindedAt: null,
      createdAt: { lte: new Date(now.getTime() - DUO_REMIND_AFTER_H * 3600_000) },
      toDuo: { status: "ACTIVE" },
      fromDuo: { status: "ACTIVE" },
    },
    select: { id: true, toDuo: { select: { aId: true, bId: true } }, fromDuo: { select: { name: true, a: { select: { firstName: true, name: true } }, b: { select: { firstName: true, name: true } } } } },
    take: MAX_PER_RUN,
  })
  for (const d of pending) {
    const from = d.fromDuo.name?.trim() || `${d.fromDuo.a.firstName ?? d.fromDuo.a.name} & ${d.fromDuo.b.firstName ?? d.fromDuo.b.name}`
    for (const id of [d.toDuo.aId, d.toDuo.bId]) {
      await notifyPlayer(id, { title: `${from} aspetta la vostra risposta`, body: "Accettate la sfida e si apre la chat a quattro.", url: "/scopri/coppie" }).catch(() => {})
    }
    await db.duoSwipe.update({ where: { id: d.id }, data: { remindedAt: now } })
    duos++
  }

  const reminders = await scopriDigest(now)
  return { paired, picks, turns, duos, reminders }
}
