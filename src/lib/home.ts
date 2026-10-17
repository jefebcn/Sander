/* ────────────────────────────────────────────────────────────────────────── */
/*  What the home shows a player about their own matches: the one still to     */
/*  score, the one just played, the town board and the weekly habit.           */
/*                                                                             */
/*  Kept out of page.tsx so the page reads as layout. The decisions live in    */
/*  the pure, tested helpers (afterMatch, matchRecap, weeklyStreak).           */
/* ────────────────────────────────────────────────────────────────────────── */

import { db } from "@/lib/db"
import type { CityLeaderboard } from "@/actions/territories"
import { parseCity } from "@/lib/cities"
import { ratingDeltaFor } from "@/lib/matchRecap"
import { startingRating, type StartLevel } from "@/lib/startLevel"
import { matchOutcome, resultEntryFor, wasPlayed, type MatchOutcome, type ResultEntry } from "@/lib/afterMatch"
import { weeklyStreak, type WeeklyStreak } from "@/lib/weeklyStreak"

const HOUR = 3600_000

/** A match that started a while ago and nobody has closed. */
export interface UnscoredMatchCard {
  id: string
  title: string
  location: string
  date: Date
  organizerName: string
  entry: ResultEntry
}

/**
 * The most recent match of the last week that started over an hour ago, is
 * still open and was actually played (two players or more), organized or
 * played by `playerId`. The next-match card covers the hour before that, so a
 * match never drops off the home.
 */
export async function getUnscoredMatch(playerId: string, now: Date): Promise<UnscoredMatchCard | null> {
  const rows = await db.session.findMany({
    where: {
      status: { in: ["OPEN", "FULL"] },
      date: { lt: new Date(now.getTime() - HOUR), gte: new Date(now.getTime() - 7 * 24 * HOUR) },
      OR: [{ organizerId: playerId }, { participants: { some: { playerId } } }],
    },
    orderBy: { date: "desc" },
    take: 5,
    select: {
      id: true, title: true, location: true, date: true, matchMode: true, organizerId: true, liveScore: true,
      organizer: { select: { name: true } },
      participants: { select: { team: true, playerId: true } },
    },
  })
  const s = rows.find((r) => wasPlayed(r.participants))
  if (!s) return null
  return {
    id: s.id, title: s.title, location: s.location, date: s.date,
    organizerName: s.organizer.name.split(" ")[0],
    entry: resultEntryFor({ ...s, hasLiveScore: s.liveScore !== null }, playerId),
  }
}

/** The match just played, while it's still news (three days). */
export interface FreshRecap {
  id: string
  title: string
  location: string
  date: Date
  outcome: MatchOutcome | null
  /** Sets from the player's side, "21-18 · 15-21 · 15-12"; null without sets. */
  score: string | null
  /** Rating points this match moved; null when it left no rating point. */
  delta: number | null
  city: { name: string; rank: number; total: number } | null
}

export async function getFreshRecap(
  player: { id: string; startLevel: string | null },
  boards: Promise<CityLeaderboard[]>,
  now: Date,
): Promise<FreshRecap | null> {
  const s = await db.session.findFirst({
    where: {
      status: "COMPLETED",
      participants: { some: { playerId: player.id } },
      // Edits are blocked once completed, so updatedAt is when it was closed.
      updatedAt: { gte: new Date(now.getTime() - 72 * HOUR) },
    },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true, title: true, location: true, city: true, date: true,
      sets: { orderBy: { setNumber: "asc" }, select: { teamAScore: true, teamBScore: true } },
      participants: { where: { playerId: player.id }, select: { team: true } },
    },
  })
  if (!s) return null

  const [history, allBoards] = await Promise.all([
    db.ratingHistory.findMany({
      where: { playerId: player.id },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: { rating: true, sourceId: true, createdAt: true },
    }),
    boards.catch(() => [] as CityLeaderboard[]),
  ])
  const team = s.participants[0]?.team
  const baseline = player.startLevel ? startingRating(player.startLevel as StartLevel) : 1500
  const cityName = s.city ?? parseCity(s.location)
  const board = cityName ? allBoards.find((b) => b.city === cityName) : undefined
  const myIndex = board ? board.standings.findIndex((p) => p.id === player.id) : -1
  const mine = (set: { teamAScore: number; teamBScore: number }) =>
    team === 1 ? `${set.teamBScore}-${set.teamAScore}` : `${set.teamAScore}-${set.teamBScore}`

  return {
    id: s.id, title: s.title, location: s.location, date: s.date,
    outcome: matchOutcome(s.sets, team),
    score: s.sets.length ? s.sets.map(mine).join(" · ") : null,
    delta: ratingDeltaFor(history, s.id, baseline),
    city: board && myIndex >= 0 ? { name: board.city, rank: myIndex + 1, total: board.standings.length } : null,
  }
}

/** Weeks in a row with a completed match, looking back a year. */
export async function getWeeklyStreak(playerId: string, now: Date): Promise<WeeklyStreak> {
  const rows = await db.sessionParticipant.findMany({
    where: {
      playerId,
      session: { status: "COMPLETED", date: { gte: new Date(now.getTime() - 53 * 7 * 24 * HOUR), lte: now } },
    },
    select: { session: { select: { date: true } } },
  })
  return weeklyStreak(rows.map((r) => r.session.date), now)
}

export interface CityRank {
  city: string
  rank: number
  total: number
  wins: number
  /** Wins still needed to reach the podium (0 when already on it). */
  winsToPodium: number
  king: string | null
}

/** A town's board for someone who hasn't played there yet. */
export interface CityPreview {
  city: string
  king: string | null
  players: number
  matches: number
}

/**
 * Where the player stands in the comune they play in most — or, before their
 * first game there, a preview of their home comune's board so even a brand-new
 * account sees a crown to chase.
 */
export async function getMyCityRank(
  playerId: string,
  homeCity: string | null,
  boards: Promise<CityLeaderboard[]>,
): Promise<{ rank: CityRank | null; preview: CityPreview | null }> {
  try {
    let best: CityRank | null = null
    let bestMatches = 0
    const all = await boards
    for (const b of all) {
      const i = b.standings.findIndex((p) => p.id === playerId)
      if (i === -1) continue
      const me = b.standings[i]
      if (me.matches <= bestMatches) continue
      bestMatches = me.matches
      const third = b.standings[2]
      best = {
        city: b.city,
        rank: i + 1,
        total: b.standings.length,
        wins: me.wins,
        winsToPodium: i < 3 || !third ? 0 : Math.max(1, third.wins - me.wins + 1),
        king: b.king && b.king.id !== playerId ? b.king.name : null,
      }
    }
    if (best || !homeCity) return { rank: best, preview: null }
    const home = all.find((b) => b.city === homeCity)
    return {
      rank: null,
      preview: {
        city: homeCity,
        king: home?.king?.name ?? null,
        players: home?.standings.length ?? 0,
        matches: home?.totalMatches ?? 0,
      },
    }
  } catch {
    return { rank: null, preview: null }
  }
}
