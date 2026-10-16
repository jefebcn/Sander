"use server"

import { db } from "@/lib/db"
import { NOT_DELETED_PLAYER } from "@/lib/publicPlayer"
import { orderLeaderboard, ratedGames, rankStatus } from "@/lib/rankingEligibility"

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
  /** Decided games on record (lib/rankingEligibility). */
  games: number
  /** Fewer than PROVISIONAL_GAMES games: rating still being assessed. */
  provisional: boolean
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
    where: { createdAt: { gte: weekStart, lte: now }, player: NOT_DELETED_PLAYER },
    orderBy: { createdAt: "asc" },
    include: {
      player: {
        select: {
          id: true,
          name: true,
          avatarUrl: true,
          glickoRating: true,
          level: true,
          matchesWon: true,
          matchesLost: true,
        },
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

  // The rating just BEFORE the window gives an accurate weekly delta (fallback:
  // first in-window value). One query for every active player — this used to be
  // a findFirst per player, an N+1 on every /settimana view. Rows come newest
  // first, so the first one seen per player is their last pre-window rating.
  const activeIds = [...byPlayer.keys()]
  const preRows = activeIds.length
    ? await db.ratingHistory.findMany({
        where: { playerId: { in: activeIds }, createdAt: { lt: weekStart } },
        orderBy: { createdAt: "desc" },
        select: { playerId: true, rating: true },
      })
    : []
  const preByPlayer = new Map<string, number>()
  for (const r of preRows) if (!preByPlayer.has(r.playerId)) preByPlayer.set(r.playerId, r.rating)

  const results: RecapPlayer[] = [...byPlayer.entries()].map(([pid, entries]) => {
    const startRating = preByPlayer.get(pid) ?? entries[0].rating
    const endRating = entries[entries.length - 1].rating
    const p = entries[0].player
    const games = ratedGames(p)
    return {
      id: pid,
      name: p.name,
      avatarUrl: p.avatarUrl,
      glickoRating: p.glickoRating,
      level: p.level,
      ratingDelta: Math.round(endRating - startRating),
      matches: entries.length,
      games,
      provisional: rankStatus(games) !== "established",
    }
  })

  // A player's first games swing the rating the most (wide Glicko deviation):
  // they would top "in salita" every week. Same rule as every other board —
  // established players first, the ones still "in valutazione" after.
  const movers = orderLeaderboard(
    results,
    // Anyone with rated rows this week has played; never drop them here.
    (r) => Math.max(1, r.games),
    (a, b) => b.ratingDelta - a.ratingDelta,
  )
  const mostActive = [...results].sort((a, b) => b.matches - a.matches)
  const totalEvents = new Set(inWindow.map((h) => h.sourceId)).size
  const potw = movers.find((m) => !m.provisional && m.ratingDelta > 0) ?? null

  return {
    weekStart: weekStart.toISOString(),
    weekEnd: now.toISOString(),
    movers: movers.slice(0, 10),
    mostActive: mostActive.slice(0, 5),
    playerOfWeek: potw,
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
