/* ────────────────────────────────────────────────────────────────────────── */
/*  Investor numbers — pure calculations behind /admin/investitori.            */
/*                                                                             */
/*  Same rule as compute.ts: no DB imports, so what counts as "active" or       */
/*  "growth" is unit-tested, not trusted.                                       */
/* ────────────────────────────────────────────────────────────────────────── */

import { BUSINESS_TZ, type Activity } from "@/lib/metrics/compute"

const DAY = 86_400_000

const dayFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: BUSINESS_TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
})

/** Midnight UTC of the Riviera calendar day an instant falls on. */
function romeDay(date: Date): Date {
  const parts = dayFormatter.formatToParts(date)
  const get = (type: string) => parts.find((p) => p.type === type)?.value
  return new Date(`${get("year")}-${get("month")}-${get("day")}T00:00:00Z`)
}

/** "2026-10-19": the Monday (Riviera time) of the week an instant falls in. */
export function weekKey(date: Date): string {
  const day = romeDay(date)
  day.setUTCDate(day.getUTCDate() - ((day.getUTCDay() + 6) % 7))
  return day.toISOString().slice(0, 10)
}

/** The last `count` weeks up to and including the current one, oldest first. */
export function lastWeeks(now: Date, count: number): string[] {
  const current = new Date(`${weekKey(now)}T00:00:00Z`).getTime()
  return Array.from({ length: count }, (_, i) =>
    new Date(current - (count - 1 - i) * 7 * DAY).toISOString().slice(0, 10),
  )
}

/** How many there were in total at the end of each week — including
 *  everything before the window, so the line starts at the real base. */
export function cumulativeByWeek(dates: Date[], weeks: string[]): number[] {
  const keys = dates.map(weekKey).sort()
  let i = 0
  return weeks.map((week) => {
    while (i < keys.length && keys[i] <= week) i++
    return i
  })
}

/** Distinct players with any activity in [from, to). */
export function distinctActive(activity: Activity[], from: Date, to: Date): number {
  const ids = new Set<string>()
  for (const { playerId, date } of activity) {
    if (date >= from && date < to) ids.add(playerId)
  }
  return ids.size
}

/** Distinct active players per week. */
export function activeByWeek(activity: Activity[], weeks: string[]): number[] {
  const sets = new Map<string, Set<string>>(weeks.map((w) => [w, new Set()]))
  for (const { playerId, date } of activity) sets.get(weekKey(date))?.add(playerId)
  return weeks.map((w) => sets.get(w)!.size)
}

/** Relative change, or null when there is no base to compare with
 *  (going from 0 to 12 is not "+∞%"). */
export function growth(current: number, previous: number): number | null {
  return previous > 0 ? (current - previous) / previous : null
}

/** The most frequent values, biggest first, ties by name; blanks skipped. */
export function topCounts(values: (string | null | undefined)[], take: number): { name: string; count: number }[] {
  const counts = new Map<string, number>()
  for (const v of values) if (v) counts.set(v, (counts.get(v) ?? 0) + 1)
  return [...counts]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "it"))
    .slice(0, take)
}
