"use server"

import { db } from "@/lib/db"

/* ────────────────────────────────────────────────────────────────────────── */
/*  Weekly recap — computes the last-7-days movers from RatingHistory.         */
/*                                                                             */
/*  RatingHistory is the cleanest weekly signal: one row per player per rated  */
/*  session/tournament, with the resulting rating. We derive per-player rating */
/*  deltas + activity, powering the public /settimana page, the shareable      */
/*  Story image, and the Monday cron notification.                             */
/* ────────────────────────────────────────────────────────────────────────── */

export interface RecapPlayer {
  id: string
  name: string
  avatarUrl: string | null
  glickoRating: number
  level: number
  ratingDelta: number
  matches: number
}

export interface WeeklyRecap {
  weekStart: string
  weekEnd: string
  movers: RecapPlayer[] // sorted by rating gain desc
  mostActive: RecapPlayer[] // sorted by matches desc
  playerOfWeek: RecapPlayer | null
  totalEvents: number // distinct rated sessions/tournaments this week
  activePlayers: number
}

const WEEK_MS = 7 * 24 * 60 * 60 * 1000

export async function getWeeklyRecap(referenceDate?: Date): Promise<WeeklyRecap> {
  const now = referenceDate ?? new Date()
  const weekStart = new Date(now.getTime() - WEEK_MS)

  const inWindow = await db.ratingHistory.findMany({
    where: { createdAt: { gte: weekStart, lte: now } },
    orderBy: { createdAt: "asc" },
    include: {
      player: {
        select: { id: true, name: true, avatarUrl: true, glickoRating: true, level: true },
      },
    },
  })

  // Group rating-history rows by player
  const byPlayer = new Map<string, typeof inWindow>()
  for (const h of inWindow) {
    const arr = byPlayer.get(h.playerId)
    if (arr) arr.push(h)
    else byPlayer.set(h.playerId, [h])
  }

  // For each active player, find the rating just BEFORE the window for an
  // accurate weekly delta (fallback: first in-window value).
  const results = await Promise.all(
    [...byPlayer.entries()].map(async ([pid, entries]) => {
      const pre = await db.ratingHistory.findFirst({
        where: { playerId: pid, createdAt: { lt: weekStart } },
        orderBy: { createdAt: "desc" },
        select: { rating: true },
      })
      const startRating = pre?.rating ?? entries[0].rating
      const endRating = entries[entries.length - 1].rating
      const p = entries[0].player
      return {
        id: pid,
        name: p.name,
        avatarUrl: p.avatarUrl,
        glickoRating: p.glickoRating,
        level: p.level,
        ratingDelta: Math.round(endRating - startRating),
        matches: entries.length,
      } satisfies RecapPlayer
    }),
  )

  const movers = [...results].sort((a, b) => b.ratingDelta - a.ratingDelta)
  const mostActive = [...results].sort((a, b) => b.matches - a.matches)
  const totalEvents = new Set(inWindow.map((h) => h.sourceId)).size

  return {
    weekStart: weekStart.toISOString(),
    weekEnd: now.toISOString(),
    movers: movers.slice(0, 10),
    mostActive: mostActive.slice(0, 5),
    playerOfWeek: movers.length > 0 && movers[0].ratingDelta > 0 ? movers[0] : null,
    totalEvents,
    activePlayers: results.length,
  }
}
