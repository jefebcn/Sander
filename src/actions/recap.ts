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

/* ────────────────────────────────────────────────────────────────────────── */
/*  Personal "SANDER Wrapped" — a shareable period recap for one player.       */
/* ────────────────────────────────────────────────────────────────────────── */

export interface PlayerRecap {
  days: number
  matches: number
  wins: number
  winRate: number
  ratingDelta: number
  peakRating: number
  currentRating: number
  level: number
  favouriteSpot: string | null
}

export async function getPlayerRecap(playerId: string, days = 30): Promise<PlayerRecap> {
  const now = new Date()
  const windowStart = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)

  const [player, history, sessions] = await Promise.all([
    db.player.findUniqueOrThrow({
      where: { id: playerId },
      select: { glickoRating: true, level: true },
    }),
    db.ratingHistory.findMany({
      where: { playerId, createdAt: { gte: windowStart, lte: now } },
      orderBy: { createdAt: "asc" },
      select: { rating: true },
    }),
    db.session.findMany({
      where: {
        status: "COMPLETED",
        date: { gte: windowStart },
        participants: { some: { playerId } },
        sets: { some: {} },
      },
      select: {
        location: true,
        sets: { select: { teamAScore: true, teamBScore: true } },
        participants: { where: { playerId }, select: { team: true } },
      },
    }),
  ])

  // Rating delta + peak over the window
  const pre = await db.ratingHistory.findFirst({
    where: { playerId, createdAt: { lt: windowStart } },
    orderBy: { createdAt: "desc" },
    select: { rating: true },
  })
  const startRating = pre?.rating ?? history[0]?.rating ?? player.glickoRating
  const endRating = history[history.length - 1]?.rating ?? player.glickoRating
  const peakRating = history.reduce((m, h) => Math.max(m, h.rating), endRating)

  // Wins / matches / favourite spot from completed sessions
  let wins = 0
  let matches = 0
  const spotCount = new Map<string, number>()
  for (const s of sessions) {
    const myTeam = s.participants[0]?.team
    if (myTeam !== 0 && myTeam !== 1) continue
    const aWins = s.sets.filter((x) => x.teamAScore > x.teamBScore).length
    const bWins = s.sets.filter((x) => x.teamBScore > x.teamAScore).length
    if (aWins === bWins) continue
    matches += 1
    if ((myTeam === 0 && aWins > bWins) || (myTeam === 1 && bWins > aWins)) wins += 1
    const loc = s.location.trim()
    if (loc) spotCount.set(loc, (spotCount.get(loc) ?? 0) + 1)
  }

  const favouriteSpot =
    [...spotCount.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null

  return {
    days,
    matches,
    wins,
    winRate: matches > 0 ? Math.round((wins / matches) * 100) : 0,
    ratingDelta: Math.round(endRating - startRating),
    peakRating: Math.round(peakRating),
    currentRating: Math.round(player.glickoRating),
    level: player.level,
    favouriteSpot,
  }
}
