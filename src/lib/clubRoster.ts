/* ────────────────────────────────────────────────────────────────────────── */
/*  Club roster and yearly stats (pure). Everyone who passed through a club    */
/*  — signed up to one of its tournaments, or follows it — with what the club */
/*  needs to know: how often they come, when they last played, what they owe. */
/* ────────────────────────────────────────────────────────────────────────── */

import { circuitStandings, type CircuitRow } from "@/lib/circuit"
import { csvCell } from "@/lib/registrationsCsv"
import { holdsSeat } from "@/lib/tournament/capacity"

export interface RosterReg {
  playerId: string
  tournamentId: string
  tournamentDate: Date
  priceCents: number | null
  paymentStatus: string
  isSpectator: boolean
  checkedInAt: Date | null
  createdAt: Date
}

export interface RosterRow {
  playerId: string
  tournaments: number
  checkins: number
  /** Date of the last tournament played (or signed up to), null for followers only. */
  lastDate: Date | null
  /** Seats still marked "da pagare" in paid tournaments, and their worth. */
  unpaidCount: number
  unpaidCents: number
  /** First sign-up or follow. */
  firstSeen: Date
  follower: boolean
  /** First seen in the last 30 days. */
  isNew: boolean
}

export const NEW_PLAYER_DAYS = 30
const DAY = 86_400_000

export function clubRoster(regs: RosterReg[], follows: { playerId: string; createdAt: Date }[], now: Date): RosterRow[] {
  const rows = new Map<string, RosterRow & { seen: Set<string> }>()
  const row = (playerId: string, since: Date) => {
    let r = rows.get(playerId)
    if (!r) {
      r = { playerId, tournaments: 0, checkins: 0, lastDate: null, unpaidCount: 0, unpaidCents: 0, firstSeen: since, follower: false, isNew: false, seen: new Set() }
      rows.set(playerId, r)
    }
    if (since < r.firstSeen) r.firstSeen = since
    return r
  }
  for (const g of regs) {
    if (!holdsSeat(g)) continue
    const r = row(g.playerId, g.createdAt)
    if (!r.seen.has(g.tournamentId)) {
      r.seen.add(g.tournamentId)
      r.tournaments++
    }
    if (g.checkedInAt) r.checkins++
    if (!r.lastDate || g.tournamentDate > r.lastDate) r.lastDate = g.tournamentDate
    if ((g.priceCents ?? 0) > 0 && g.paymentStatus === "PENDING") {
      r.unpaidCount++
      r.unpaidCents += g.priceCents ?? 0
    }
  }
  for (const f of follows) row(f.playerId, f.createdAt).follower = true

  return [...rows.values()]
    .map((r) => {
      const { seen, ...row } = r
      void seen
      return { ...row, isNew: now.getTime() - row.firstSeen.getTime() <= NEW_PLAYER_DAYS * DAY }
    })
    .sort((a, b) => (b.lastDate?.getTime() ?? 0) - (a.lastDate?.getTime() ?? 0) || b.tournaments - a.tournaments)
}

export type RosterFilter = "tutti" | "da-pagare" | "follower" | "nuovi"

export function filterRoster<T extends { name: string; unpaidCount: number; follower: boolean; isNew: boolean }>(rows: T[], filter: RosterFilter, query: string): T[] {
  const q = query.trim().toLowerCase()
  return rows.filter(
    (r) =>
      (filter === "tutti" || (filter === "da-pagare" && r.unpaidCount > 0) || (filter === "follower" && r.follower) || (filter === "nuovi" && r.isNew)) &&
      (!q || r.name.toLowerCase().includes(q)),
  )
}

export interface RosterCsvRow extends RosterRow {
  name: string
  /** Only for players who signed up to a club tournament: following a club shares no contact. */
  email: string | null
  city: string | null
}

const day = (d: Date | null) => (d ? d.toLocaleDateString("it-IT", { timeZone: "Europe/Rome" }) : "")

/** The roster as a CSV for Italian Excel (semicolons, BOM), like the tournament sign-up export. */
export function clubRosterCsv(rows: RosterCsvRow[]): string {
  const head = ["Giocatore", "Email", "Comune", "Tornei", "Presenze", "Ultimo torneo", "Da pagare (€)", "Follower", "Primo contatto"]
  const lines = rows.map((r) =>
    [
      r.name,
      r.email,
      r.city,
      r.tournaments,
      r.checkins,
      day(r.lastDate),
      r.unpaidCents > 0 ? (r.unpaidCents / 100).toFixed(2).replace(".", ",") : "",
      r.follower ? "Sì" : "",
      day(r.firstSeen),
    ]
      .map(csvCell)
      .join(";"),
  )
  return "﻿" + [head.join(";"), ...lines].join("\r\n")
}

/* ── Yearly stats ─────────────────────────────────────────────────────────── */

export interface StatsTournament {
  id: string
  date: Date
  status: string
  priceCents: number | null
  registrations: { playerId: string; paymentStatus: string; isSpectator: boolean; checkedInAt: Date | null }[]
  standings: { playerId: string; rank: number }[]
}

export interface ClubYearStats {
  year: number
  tournaments: number
  signups: number
  /** Change against the year before, in %, or null when that year had none. */
  signupsDelta: number | null
  /** Quotas marked paid in paid tournaments. */
  collectedCents: number
  /** Sign-ups by month of the tournament, January first. */
  monthly: number[]
  /** Most present players: check-ins, then tournaments. */
  topAttendees: { playerId: string; checkins: number; tournaments: number }[]
  /** Points from the club's completed tournaments of the year (circuit points). */
  table: CircuitRow[]
}

export function clubYearStats(tournaments: StatsTournament[], year: number): ClubYearStats {
  const inYear = (y: number) => tournaments.filter((t) => t.date.getFullYear() === y)
  const seats = (ts: StatsTournament[]) => ts.flatMap((t) => t.registrations.filter(holdsSeat).map((r) => ({ ...r, t })))
  const now = seats(inYear(year))
  const before = seats(inYear(year - 1)).length

  const monthly = new Array<number>(12).fill(0)
  const people = new Map<string, { playerId: string; checkins: number; tournaments: number }>()
  let collectedCents = 0
  for (const r of now) {
    monthly[r.t.date.getMonth()]++
    if ((r.t.priceCents ?? 0) > 0 && r.paymentStatus === "PAID") collectedCents += r.t.priceCents ?? 0
    const p = people.get(r.playerId) ?? { playerId: r.playerId, checkins: 0, tournaments: 0 }
    p.tournaments++
    if (r.checkedInAt) p.checkins++
    people.set(r.playerId, p)
  }

  return {
    year,
    tournaments: inYear(year).length,
    signups: now.length,
    signupsDelta: before > 0 ? Math.round(((now.length - before) / before) * 100) : null,
    collectedCents,
    monthly,
    topAttendees: [...people.values()].sort((a, b) => b.checkins - a.checkins || b.tournaments - a.tournaments).slice(0, 5),
    table: circuitStandings(inYear(year).filter((t) => t.status === "COMPLETED")),
  }
}
