/* ────────────────────────────────────────────────────────────────────────── */
/*  Business metrics — pure calculations behind /admin/metriche.               */
/*                                                                             */
/*  Kept free of DB imports so the rules that decide the numbers (which month   */
/*  a payment belongs to, who counts as "retained") are unit-tested rather      */
/*  than trusted.                                                              */
/* ────────────────────────────────────────────────────────────────────────── */

/** The business runs on Riviera time: a payment at 00:30 on 1 August in Rimini
 *  is August revenue, even though it is still 31 July in UTC. */
export const BUSINESS_TZ = "Europe/Rome"

const monthFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: BUSINESS_TZ,
  year: "numeric",
  month: "2-digit",
})

/** "2026-08" for any instant, in Riviera time. */
export function monthKey(date: Date): string {
  const parts = monthFormatter.formatToParts(date)
  const year = parts.find((p) => p.type === "year")?.value
  const month = parts.find((p) => p.type === "month")?.value
  return `${year}-${month}`
}

/** "2026-01" → "2025-12". */
export function prevMonthKey(key: string): string {
  const [y, m] = key.split("-").map(Number)
  return m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, "0")}`
}

/** The last `count` months up to and including the current one, oldest first. */
export function lastMonths(now: Date, count: number): string[] {
  const months = [monthKey(now)]
  while (months.length < count) months.unshift(prevMonthKey(months[0]))
  return months
}

/** Totals per month for the given window; months with nothing are 0, rows
 *  outside the window or without a date are ignored. */
export function sumByMonth<T>(
  rows: T[],
  dateOf: (row: T) => Date | null,
  valueOf: (row: T) => number,
  months: string[],
): Record<string, number> {
  const totals: Record<string, number> = Object.fromEntries(months.map((m) => [m, 0]))
  for (const row of rows) {
    const date = dateOf(row)
    if (!date) continue
    const key = monthKey(date)
    if (key in totals) totals[key] += valueOf(row)
  }
  return totals
}

/** Mean, or null when there is nothing to average — "no data" must not read as 0 €. */
export function average(values: number[]): number | null {
  if (values.length === 0) return null
  return values.reduce((a, b) => a + b, 0) / values.length
}

/** One instance of a player actually playing (a completed match or a tournament). */
export interface Activity {
  playerId: string
  date: Date
}

export interface MonthRetention {
  month: string
  /** Distinct players who played in the month. */
  active: number
  /** Of those, players playing for the very first time. */
  newcomers: number
  /** Players active last month who played again this month. */
  retained: number
  /** retained ÷ last month's active, or null when last month had nobody. */
  retainedPct: number | null
}

/**
 * Month-on-month retention.
 *
 * "Newcomer" is judged against the player's whole history, not just the
 * window — otherwise every veteran would look new in the first month shown.
 */
export function monthlyRetention(activity: Activity[], months: string[]): MonthRetention[] {
  const activeByMonth = new Map<string, Set<string>>()
  const firstMonth = new Map<string, string>()

  for (const { playerId, date } of activity) {
    const key = monthKey(date)
    let set = activeByMonth.get(key)
    if (!set) activeByMonth.set(key, (set = new Set()))
    set.add(playerId)
    const first = firstMonth.get(playerId)
    if (!first || key < first) firstMonth.set(playerId, key)
  }

  return months.map((month) => {
    const active = activeByMonth.get(month) ?? new Set<string>()
    const previous = activeByMonth.get(prevMonthKey(month)) ?? new Set<string>()
    let retained = 0
    let newcomers = 0
    for (const id of active) {
      if (previous.has(id)) retained++
      if (firstMonth.get(id) === month) newcomers++
    }
    return {
      month,
      active: active.size,
      newcomers,
      retained,
      retainedPct: previous.size > 0 ? retained / previous.size : null,
    }
  })
}

/** Beach season on the Riviera: May to September. */
const SEASON_MONTHS = new Set([5, 6, 7, 8, 9])

/** The season (its year) a date falls in, or null in the off-season. */
export function seasonOf(date: Date): number | null {
  const [year, month] = monthKey(date).split("-").map(Number)
  return SEASON_MONTHS.has(month) ? year : null
}

export interface SeasonRetention {
  season: number
  players: number
  /** Players of this season who also played the next one; null until the next
   *  season has any activity at all, so an unplayed season isn't read as 0%. */
  returned: number | null
  returnedPct: number | null
}

/**
 * Season-to-season retention — the churn figure that means something here.
 * Month-on-month churn reads ~90% every November; that is the calendar, not
 * people leaving. Whether August's players come back next May is the real test.
 */
export function seasonRetention(activity: Activity[]): SeasonRetention[] {
  const bySeason = new Map<number, Set<string>>()
  for (const { playerId, date } of activity) {
    const season = seasonOf(date)
    if (season === null) continue
    let set = bySeason.get(season)
    if (!set) bySeason.set(season, (set = new Set()))
    set.add(playerId)
  }

  return [...bySeason.keys()]
    .sort((a, b) => a - b)
    .map((season) => {
      const players = bySeason.get(season)!
      const next = bySeason.get(season + 1)
      if (!next) return { season, players: players.size, returned: null, returnedPct: null }
      let returned = 0
      for (const id of players) if (next.has(id)) returned++
      return { season, players: players.size, returned, returnedPct: returned / players.size }
    })
}
