import { db } from "@/lib/db"
import { notifyPlayer } from "@/lib/push"
import { parseCity } from "@/lib/cities"
import {
  NUDGE_COOLDOWN_HOURS,
  RATING_BAND,
  nudgeLimit,
  nudgeMessage,
  rankCandidates,
  type NudgeReason,
  type Slot,
} from "@/lib/missingPlayer"

/* ────────────────────────────────────────────────────────────────────────── */
/*  Send "manca un giocatore" pushes — INTERNAL only.                          */
/*                                                                             */
/*  Not a "use server" file: every export there is a public endpoint, and an   */
/*  open endpoint that pushes notifications to other people is a spam cannon.  */
/*  Called from session actions (via after()) and the daily cron.              */
/* ────────────────────────────────────────────────────────────────────────── */

const HOUR = 3600_000

/**
 * Invite the best-matching players to one match that still has free seats.
 * Returns how many were notified. Safe to call repeatedly: the unique
 * (session, player) row means nobody hears about the same match twice.
 */
export async function nudgeForSession(sessionId: string, reason: NudgeReason, now = new Date()): Promise<number> {
  const session = await db.session.findUnique({
    where: { id: sessionId },
    select: {
      id: true, date: true, location: true, city: true, status: true, maxPlayers: true, organizerId: true,
      participants: { select: { playerId: true, player: { select: { glickoRating: true } } } },
      waitlist: { select: { playerId: true } },
      nudges: { select: { playerId: true } },
    },
  })
  if (!session || session.status !== "OPEN" || session.date <= now) return 0
  // A match more than a week out is noise today; it gets its turn later.
  if (session.date.getTime() - now.getTime() > 7 * 24 * HOUR) return 0

  const spotsLeft = session.maxPlayers - session.participants.length
  const limit = nudgeLimit(spotsLeft)
  if (limit === 0) return 0

  const ratings = session.participants.map((p) => p.player?.glickoRating).filter((r): r is number => typeof r === "number")
  const avgRating = ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : null
  const city = session.city ?? parseCity(session.location)

  const exclude = new Set<string>([
    session.organizerId,
    ...session.participants.map((p) => p.playerId).filter((id): id is string => !!id),
    ...session.waitlist.map((w) => w.playerId),
    ...session.nudges.map((n) => n.playerId),
  ])

  const recentlyNudged = await db.sessionNudge.findMany({
    where: { createdAt: { gte: new Date(now.getTime() - NUDGE_COOLDOWN_HOURS * HOUR) } },
    select: { playerId: true },
  })
  for (const r of recentlyNudged) exclude.add(r.playerId)

  // Only real accounts that can receive a push, near the match's level.
  const candidates = await db.player.findMany({
    where: {
      userId: { not: null },
      nudgesOptOut: false,
      id: { notIn: [...exclude] },
      ...(avgRating !== null
        ? { glickoRating: { gte: avgRating - RATING_BAND, lte: avgRating + RATING_BAND } }
        : {}),
      OR: [
        ...(city ? [{ homeCity: city }] : []),
        { availability: { some: {} } },
      ],
    },
    select: {
      id: true, glickoRating: true, homeCity: true,
      availability: { select: { weekday: true, slot: true } },
    },
    take: 300,
  })

  const chosen = rankCandidates(
    { date: session.date, city, avgRating, spotsLeft },
    candidates.map((c) => ({
      id: c.id,
      rating: c.glickoRating,
      homeCity: c.homeCity,
      availability: c.availability.map((a) => ({ weekday: a.weekday, slot: a.slot as Slot })),
    })),
    limit,
  )
  if (chosen.length === 0) return 0

  // Record each one first and notify only the rows *we* inserted: if two
  // triggers race (a new match and the morning sweep), the unique index lets
  // exactly one of them through per player.
  const inserted: string[] = []
  for (const playerId of chosen) {
    try {
      await db.sessionNudge.create({ data: { sessionId: session.id, playerId } })
      inserted.push(playerId)
    } catch {
      // Already nudged about this match — skip.
    }
  }

  const message = nudgeMessage(reason, { date: session.date, location: session.location, city, spotsLeft }, now)
  await Promise.allSettled(
    inserted.map((playerId) => notifyPlayer(playerId, { ...message, url: `/sessions/${session.id}` })),
  )
  return inserted.length
}

/**
 * Morning sweep: today's and tomorrow's matches that still miss players.
 * Bounded so a busy day can't turn into a notification storm.
 */
export async function nudgeSweep(now = new Date()): Promise<number> {
  const sessions = await db.session.findMany({
    where: { status: "OPEN", date: { gt: now, lte: new Date(now.getTime() + 36 * HOUR) } },
    orderBy: { date: "asc" },
    select: { id: true },
    take: 20,
  })
  let sent = 0
  for (const s of sessions) sent += await nudgeForSession(s.id, "missing", now)
  return sent
}
