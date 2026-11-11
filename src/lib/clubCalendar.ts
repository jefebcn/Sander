/* ────────────────────────────────────────────────────────────────────────── */
/*  Club calendar (pure). Who has which court, when: bookings, open games,     */
/*  training, events, a court closed. Times are Rome wall-clock; the grid is   */
/*  half-hour slots, one column per court.                                     */
/* ────────────────────────────────────────────────────────────────────────── */

import { dayKey, formatTime } from "@/lib/datetime"
import { romeWallTime } from "@/lib/romeMonth"

export const CLUB_EVENT_KINDS = ["PARTITA", "ALLENAMENTO", "EVENTO", "CHIUSO"] as const
export type ClubEventKind = (typeof CLUB_EVENT_KINDS)[number]

export const KIND_META: Record<ClubEventKind, { label: string; hint: string; tone: string }> = {
  PARTITA: { label: "Partita", hint: "Campo prenotato o partita aperta", tone: "var(--accent)" },
  ALLENAMENTO: { label: "Allenamento", hint: "Lezione o allenamento", tone: "var(--social)" },
  EVENTO: { label: "Evento", hint: "Festa, open day, clinic", tone: "var(--completed)" },
  CHIUSO: { label: "Campo chiuso", hint: "Manutenzione o non disponibile", tone: "var(--danger)" },
}

/** Courts the calendar shows: the club's number, 1 when not set yet, at most 12. */
export const MAX_COURTS = 12
export function courtCount(courts: number | null | undefined): number {
  return Math.min(MAX_COURTS, Math.max(1, courts ?? 1))
}

/** Longest single entry: a whole day of beach volley, not a week by mistake. */
export const MAX_EVENT_HOURS = 16

export interface CalEvent {
  id: string
  kind: string
  title: string
  startsAt: Date
  endsAt: Date
  /** null: every court. */
  court: number | null
}

/** Do two entries share a court at the same time? (touching ends don't clash) */
export function clashes(a: Pick<CalEvent, "startsAt" | "endsAt" | "court">, b: Pick<CalEvent, "startsAt" | "endsAt" | "court">): boolean {
  const sameCourt = a.court === null || b.court === null || a.court === b.court
  return sameCourt && a.startsAt < b.endsAt && b.startsAt < a.endsAt
}

/** The first existing entry a new one would clash with, if any. */
export function findClash<T extends CalEvent>(entry: Pick<CalEvent, "startsAt" | "endsAt" | "court">, existing: T[]): T | null {
  return existing.find((e) => clashes(entry, e)) ?? null
}

/** "Il campo 2 è già occupato: Allenamento dalle 15:00 alle 16:30." */
export function clashMessage(other: CalEvent): string {
  const where = other.court === null ? "I campi sono già occupati" : `Il campo ${other.court} è già occupato`
  return `${where}: ${other.title} dalle ${formatTime(other.startsAt)} alle ${formatTime(other.endsAt)}.`
}

/** Start and end instants from the form's day and "HH:MM" times; an end at 00:00 means midnight after. */
export function eventRange(day: string, start: string, end: string): { startsAt: Date; endsAt: Date } {
  const startsAt = romeWallTime(day, start)
  let endsAt = romeWallTime(day, end)
  if (end === "00:00") endsAt = new Date(romeWallTime(day, "23:59").getTime() + 60_000)
  return { startsAt, endsAt }
}

/** Monday-first days (YYYY-MM-DD) of the week that contains `day`. */
export function weekOf(day: string): string[] {
  const [y, m, d] = day.split("-").map(Number)
  const base = new Date(Date.UTC(y, m - 1, d))
  const back = (base.getUTCDay() + 6) % 7
  return Array.from({ length: 7 }, (_, i) => new Date(Date.UTC(y, m - 1, d - back + i)).toISOString().slice(0, 10))
}

export function shiftDay(day: string, days: number): string {
  const [y, m, d] = day.split("-").map(Number)
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10)
}

export const DAY_RE = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/

/** Minutes after Rome midnight of `day` (may be < 0 or ≥ 1440 for entries crossing midnight). */
export function minutesInto(day: string, t: Date): number {
  return Math.round((t.getTime() - romeWallTime(day, "00:00").getTime()) / 60_000)
}

export interface DayLayout {
  /** First and last hour shown (grid covers [startHour, endHour)). */
  startHour: number
  endHour: number
  /** Entries of the day with their place: half-hour rows from startHour, 1-based columns of courts. */
  placed: { event: CalEvent; rowStart: number; rowEnd: number; colStart: number; colEnd: number }[]
}

/**
 * Where each entry of `day` sits in the grid. The grid shows 8:00–22:00 and
 * grows to fit earlier or later entries; an entry for every court spans all columns.
 */
export function layoutDay(day: string, events: CalEvent[], courts: number): DayLayout {
  const inDay = events
    .map((e) => ({ e, from: Math.max(0, minutesInto(day, e.startsAt)), to: Math.min(1440, minutesInto(day, e.endsAt)) }))
    .filter(({ from, to }) => to > from && to > 0 && from < 1440)
  const startHour = Math.min(8, ...inDay.map(({ from }) => Math.floor(from / 60)))
  const endHour = Math.max(22, ...inDay.map(({ to }) => Math.ceil(to / 60)))
  const placed = inDay
    .sort((a, b) => a.from - b.from)
    .map(({ e, from, to }) => {
      const court = e.court !== null && e.court <= courts ? e.court : null
      return {
        event: e,
        rowStart: Math.floor((from - startHour * 60) / 30) + 1,
        rowEnd: Math.max(Math.floor((from - startHour * 60) / 30) + 2, Math.ceil((to - startHour * 60) / 30) + 1),
        colStart: court ?? 1,
        colEnd: (court ?? courts) + 1,
      }
    })
  return { startHour, endHour, placed }
}

/** Day keys (Rome) that have at least one entry, for the dots on the week strip. */
export function busyDays(events: Pick<CalEvent, "startsAt">[]): Set<string> {
  return new Set(events.map((e) => dayKey(e.startsAt)))
}
