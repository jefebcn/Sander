/* ────────────────────────────────────────────────────────────────────────── */
/*  "Manca un giocatore" — who to tell when a match is short of players.       */
/*                                                                             */
/*  Pure logic, tested. The rules keep it useful instead of spammy: only       */
/*  people who said they're free at that time or who play in that comune, at   */
/*  a similar level, never twice for the same match, at most once a day.       */
/* ────────────────────────────────────────────────────────────────────────── */

import { TZ, formatWhen } from "@/lib/datetime"

export type Slot = "MORNING" | "AFTERNOON" | "EVENING"

const hourFmt = new Intl.DateTimeFormat("en-GB", { timeZone: TZ, hour: "2-digit", hourCycle: "h23" })
const weekdayFmt = new Intl.DateTimeFormat("en-US", { timeZone: TZ, weekday: "short" })
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

/** Availability slot of a match, by Riviera clock: before 13, 13–18, from 18. */
export function slotOf(date: Date): Slot {
  const h = Number(hourFmt.format(date))
  if (h < 13) return "MORNING"
  if (h < 18) return "AFTERNOON"
  return "EVENING"
}

/** 0 = Sunday … 6 = Saturday in Riviera time (same convention as Date.getDay). */
export function weekdayOf(date: Date): number {
  return WEEKDAYS.indexOf(weekdayFmt.format(date))
}

/** Ratings further apart than this make a lopsided match: don't invite. */
export const RATING_BAND = 200
/** Nobody gets more than one of these per this many hours. */
export const NUDGE_COOLDOWN_HOURS = 20

export interface NudgeSession {
  date: Date
  city: string | null
  /** Average rating of who's already in; null when nobody is. */
  avgRating: number | null
  spotsLeft: number
}

export interface NudgeCandidate {
  id: string
  rating: number
  homeCity: string | null
  availability: { weekday: number; slot: Slot }[]
}

/**
 * Rank who to invite. A candidate qualifies only if they're free at that time
 * or play in that comune (so we never ping strangers at random), and are within
 * the rating band. Free-at-that-time beats same-town; closer level breaks ties.
 * Callers have already removed participants, the waitlist, opted-out players
 * and anyone notified recently.
 */
export function rankCandidates(session: NudgeSession, candidates: NudgeCandidate[], limit: number): string[] {
  const weekday = weekdayOf(session.date)
  const slot = slotOf(session.date)
  return candidates
    .map((c) => {
      const free = c.availability.some((a) => a.weekday === weekday && a.slot === slot)
      const local = !!session.city && c.homeCity === session.city
      const gap = session.avgRating === null ? 0 : Math.abs(c.rating - session.avgRating)
      return { id: c.id, free, local, gap }
    })
    .filter((c) => (c.free || c.local) && c.gap <= RATING_BAND)
    .sort((a, b) => Number(b.free) - Number(a.free) || Number(b.local) - Number(a.local) || a.gap - b.gap)
    .slice(0, Math.max(0, limit))
    .map((c) => c.id)
}

/** How many people to ping for a match: a few per free seat, never a crowd. */
export function nudgeLimit(spotsLeft: number): number {
  return Math.min(8, Math.max(0, spotsLeft) * 3)
}

export type NudgeReason = "new" | "missing" | "freed"

/** The push text. Short, concrete, one question. */
export function nudgeMessage(
  reason: NudgeReason,
  s: { date: Date; location: string; city: string | null; spotsLeft: number },
  now: Date = new Date(),
): { title: string; body: string } {
  const when = formatWhen(s.date, now)
  const n = s.spotsLeft
  const players = n === 1 ? "1 giocatore" : `${n} giocatori`
  if (reason === "new") {
    return { title: `Nuova partita a ${s.city ?? s.location} 🏐`, body: `${when} · cercano ${players}. Ci sei?` }
  }
  if (reason === "freed") {
    return { title: "Si è liberato un posto 🏐", body: `${when} · ${s.location}. Entri tu?` }
  }
  return { title: `${n === 1 ? "Manca" : "Mancano"} ${players} 🏐`, body: `${when} · ${s.location}. Ti va di entrare?` }
}
