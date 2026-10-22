import { db } from "@/lib/db"
import { CITY_NAMES } from "@/lib/cities"
import { regionOfComune } from "@/lib/comuni"
import { lastMonths, monthKey, type Activity } from "@/lib/metrics/compute"
import { activeByWeek, cumulativeByWeek, distinctActive, growth, lastWeeks, topCounts } from "@/lib/metrics/investor"

/* ────────────────────────────────────────────────────────────────────────── */
/*  Traction numbers for /admin/investitori: growth, engagement, reach.        */
/*  Revenue and retention come from getAdminMetrics, Scopri from               */
/*  getScopriMetrics; this adds what an investor asks first.                    */
/*                                                                             */
/*  Not a "use server" file, for the same reason as adminMetrics.ts: the page   */
/*  checks the admin before calling it.                                         */
/* ────────────────────────────────────────────────────────────────────────── */

const DAY = 86_400_000
export const INVESTOR_WEEKS = 26
export const INVESTOR_MONTHS = 12
/** WAU per week is shown for 12 weeks; MAU compares two 30-day windows. */
const ACTIVITY_DAYS = 84

/** The Riviera frazioni SANDER offered before the ISTAT list are all in Romagna. */
const regionOf = (city: string) => regionOfComune(city) ?? (CITY_NAMES.includes(city) ? "Emilia-Romagna" : null)

export async function getInvestorMetrics(now = new Date()) {
  const since = new Date(now.getTime() - ACTIVITY_DAYS * DAY)
  const months = lastMonths(now, INVESTOR_MONTHS)
  const weeks = lastWeeks(now, INVESTOR_WEEKS)
  const yearAgo = new Date(`${months[0]}-01T00:00:00Z`)

  const [players, played, tournamentPlayed, messages, swipes, everPlayed, everTournament, completedSessions, completedTotal, tournaments] =
    await Promise.all([
      db.player.findMany({ select: { createdAt: true, homeCity: true } }),
      db.sessionParticipant.findMany({
        where: { playerId: { not: null }, session: { status: "COMPLETED", date: { gte: since, lte: now } } },
        select: { playerId: true, session: { select: { date: true } } },
      }),
      db.tournamentRegistration.findMany({
        where: { isSpectator: false, paymentStatus: { in: ["FREE", "PAID"] }, tournament: { date: { gte: since, lte: now } } },
        select: { playerId: true, tournament: { select: { date: true } } },
      }),
      db.chatMessage.findMany({ where: { createdAt: { gte: since } }, select: { senderId: true, createdAt: true } }),
      db.playerSwipe.findMany({ where: { createdAt: { gte: since } }, select: { fromId: true, createdAt: true } }),
      db.sessionParticipant.findMany({
        where: { playerId: { not: null }, session: { status: "COMPLETED", date: { lte: now } } },
        distinct: ["playerId"],
        select: { playerId: true },
      }),
      db.tournamentRegistration.findMany({
        where: { isSpectator: false, paymentStatus: { in: ["FREE", "PAID"] }, tournament: { date: { lte: now } } },
        distinct: ["playerId"],
        select: { playerId: true },
      }),
      db.session.findMany({
        where: { status: "COMPLETED", date: { gte: yearAgo, lte: now } },
        select: { date: true, _count: { select: { participants: true } } },
      }),
      db.session.count({ where: { status: "COMPLETED", date: { lte: now } } }),
      db.tournament.count({ where: { date: { lte: now }, status: { not: "DRAFT" } } }),
    ])

  /* ── Engagement: active = played, wrote in a chat or used Scopri ──────── */
  const activity: Activity[] = [
    ...played.map((p) => ({ playerId: p.playerId!, date: p.session.date })),
    ...tournamentPlayed.map((t) => ({ playerId: t.playerId, date: t.tournament.date })),
    ...messages.map((m) => ({ playerId: m.senderId, date: m.createdAt })),
    ...swipes.map((s) => ({ playerId: s.fromId, date: s.createdAt })),
  ]
  const ago = (days: number) => new Date(now.getTime() - days * DAY)
  const mau = distinctActive(activity, ago(30), now)
  const mauPrev = distinctActive(activity, ago(60), ago(30))
  const wau = distinctActive(activity, ago(7), now)

  /* ── Growth ───────────────────────────────────────────────────────────── */
  const joined = players.map((p) => p.createdAt)
  const total30Ago = joined.filter((d) => d < ago(30)).length
  const new30 = players.length - total30Ago
  const new30Prev = joined.filter((d) => d >= ago(60) && d < ago(30)).length

  /* ── Games ────────────────────────────────────────────────────────────── */
  const games30 = completedSessions.filter((s) => s.date >= ago(30)).length
  const games30Prev = completedSessions.filter((s) => s.date >= ago(60) && s.date < ago(30)).length
  const gamesByMonth = months.map((month) => {
    const inMonth = completedSessions.filter((s) => monthKey(s.date) === month)
    return { month, games: inMonth.length, seats: inMonth.reduce((n, s) => n + s._count.participants, 0) }
  })

  /* ── Reach ────────────────────────────────────────────────────────────── */
  const cities = players.map((p) => p.homeCity)
  const comuni = new Set(cities.filter(Boolean))
  const regions = new Set([...comuni].map((c) => regionOf(c!)).filter(Boolean))

  const playedEver = new Set([
    ...everPlayed.map((p) => p.playerId!),
    ...everTournament.map((t) => t.playerId),
  ])

  return {
    weeks,
    growth: {
      totalPlayers: players.length,
      new30,
      /** How much the user base grew in 30 days. */
      base30: growth(players.length, total30Ago),
      /** New sign-ups this 30 days against the 30 before. */
      signups30: growth(new30, new30Prev),
      cumulativeByWeek: cumulativeByWeek(joined, weeks),
    },
    engagement: {
      mau,
      mau30: growth(mau, mauPrev),
      wau,
      /** WAU ÷ MAU: how many of the month's players come back every week. */
      stickiness: mau > 0 ? wau / mau : null,
      activeByWeek: activeByWeek(activity, weeks.slice(-12)),
      activeWeeks: weeks.slice(-12),
    },
    games: {
      completedTotal,
      games30,
      games30Change: growth(games30, games30Prev),
      byMonth: gamesByMonth,
      tournaments,
    },
    reach: {
      comuni: comuni.size,
      regions: regions.size,
      topComuni: topCounts(cities, 8),
      withCity: cities.filter(Boolean).length,
    },
    funnel: {
      signedUp: players.length,
      withCity: cities.filter(Boolean).length,
      played: playedEver.size,
    },
  }
}

export type InvestorMetrics = Awaited<ReturnType<typeof getInvestorMetrics>>
