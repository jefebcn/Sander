/* ────────────────────────────────────────────────────────────────────────── */
/*  Club dashboard ("Plancia"): the numbers a club looks at first, computed    */
/*  from its tournaments' registrations. Pure: the page loads, this counts.    */
/* ────────────────────────────────────────────────────────────────────────── */

import { holdsSeat, seatLimit } from "@/lib/tournament/capacity"

export interface DashRegistration {
  createdAt: Date
  paymentStatus: string
  isSpectator: boolean
  checkedInAt: Date | null
}

export interface DashTournament {
  id: string
  name: string
  date: Date
  status: string
  type: string
  priceCents: number | null
  maxTeams: number | null
  registrations: DashRegistration[]
  waitlist: number
}

const DAY = 86_400_000

/** Still to come: not finished and not before today (the whole day counts). */
export function isUpcoming(t: { date: Date; status: string }, now: Date): boolean {
  const startOfToday = new Date(now)
  startOfToday.setHours(0, 0, 0, 0)
  return t.status !== "COMPLETED" && t.date.getTime() >= startOfToday.getTime()
}

/** How many dates fall in each of the last `weeks` weeks, oldest first (7-day buckets ending now). */
export function weeklyCounts(dates: Date[], now: Date, weeks = 8): number[] {
  const out = new Array<number>(weeks).fill(0)
  const end = now.getTime()
  for (const d of dates) {
    const ago = end - d.getTime()
    if (ago < 0) continue
    const bucket = Math.floor(ago / (7 * DAY))
    if (bucket < weeks) out[weeks - 1 - bucket]++
  }
  return out
}

export interface ClubDashboard {
  /** Seats taken in the tournaments still to come. */
  upcomingPlayers: number
  /** Unpaid seats in paid tournaments still to come, and what they are worth. */
  unpaidCount: number
  unpaidCents: number
  /** Check-ins at the club's tournaments this calendar month. */
  checkinsThisMonth: number
  /** The nearest tournament still to come, with its seats. */
  next: { id: string; name: string; date: Date; players: number; maxPlayers: number | null; waitlist: number } | null
  /** Sign-ups per week, last 8 weeks, oldest first. */
  weekly: number[]
}

export function clubDashboard(tournaments: DashTournament[], now: Date): ClubDashboard {
  const upcoming = tournaments.filter((t) => isUpcoming(t, now)).sort((a, b) => a.date.getTime() - b.date.getTime())
  let upcomingPlayers = 0
  let unpaidCount = 0
  let unpaidCents = 0
  for (const t of upcoming) {
    const seats = t.registrations.filter(holdsSeat)
    upcomingPlayers += seats.length
    if ((t.priceCents ?? 0) > 0) {
      const unpaid = seats.filter((r) => r.paymentStatus === "PENDING").length
      unpaidCount += unpaid
      unpaidCents += unpaid * (t.priceCents ?? 0)
    }
  }

  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  let checkinsThisMonth = 0
  const signups: Date[] = []
  for (const t of tournaments) {
    for (const r of t.registrations) {
      if (r.checkedInAt && r.checkedInAt >= monthStart && r.checkedInAt <= now) checkinsThisMonth++
      if (!r.isSpectator) signups.push(r.createdAt)
    }
  }

  const first = upcoming[0]
  const next = first
    ? {
        id: first.id,
        name: first.name,
        date: first.date,
        players: first.registrations.filter(holdsSeat).length,
        maxPlayers: seatLimit(first.type, first.maxTeams),
        waitlist: first.waitlist,
      }
    : null

  return { upcomingPlayers, unpaidCount, unpaidCents, checkinsThisMonth, next, weekly: weeklyCounts(signups, now) }
}
