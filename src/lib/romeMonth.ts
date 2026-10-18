import { TZ, dayKey } from "@/lib/datetime"

/* ────────────────────────────────────────────────────────────────────────── */
/*  Calendar months as the Riviera reads them.                                 */
/*                                                                             */
/*  The server runs in UTC, so `new Date(y, m, 1)` there is 01:00 or 02:00 in  */
/*  Rome: a win at 00:30 on the 1st was filed under the previous month, and    */
/*  for the first hours of a month the "podio del mese" still showed the old   */
/*  one. These helpers give the exact instants of Rome midnights.              */
/* ────────────────────────────────────────────────────────────────────────── */

const offsetFmt = new Intl.DateTimeFormat("en-US", {
  timeZone: TZ,
  hourCycle: "h23",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
})

/** Milliseconds Rome is ahead of UTC at instant `t` (+1h winter, +2h summer). */
function romeOffsetMs(t: number): number {
  const parts: Record<string, number> = {}
  for (const p of offsetFmt.formatToParts(new Date(t))) {
    if (p.type !== "literal") parts[p.type] = Number(p.value)
  }
  const asUtc = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second)
  return asUtc - Math.floor(t / 1000) * 1000
}

/** The instant of 00:00 Rome time on the 1st of `month` (1–12, may overflow) of `year`. */
export function romeMonthStart(year: number, month: number): Date {
  const guess = Date.UTC(year, month - 1, 1)
  // Midnight on the 1st is never inside a DST switch (those happen at 02:00/03:00),
  // so one correction with the offset at the guess, re-checked once, is exact.
  let t = guess - romeOffsetMs(guess)
  t = guess - romeOffsetMs(t)
  return new Date(t)
}

/** Year and month (1–12) of `d` on the Rome calendar. */
export function romeYearMonth(d: Date = new Date()): { year: number; month: number } {
  const [y, m] = dayKey(d).split("-").map(Number)
  return { year: y, month: m }
}

/**
 * Rome-calendar month containing `now`, shifted by `offset` months
 * (0 = this month, -1 = last month), as a half-open [start, end) range.
 */
export function romeMonthRange(
  now: Date = new Date(),
  offset = 0,
): { start: Date; end: Date; year: number; month: number } {
  const { year, month } = romeYearMonth(now)
  const index = year * 12 + (month - 1) + offset
  const y = Math.floor(index / 12)
  const m = (index % 12) + 1
  return { start: romeMonthStart(y, m), end: romeMonthStart(y, m + 1), year: y, month: m }
}

/** The instant of 00:00 Rome time on `year-month-day` (day may overflow). */
function romeMidnight(year: number, month: number, day: number): Date {
  const guess = Date.UTC(year, month - 1, day)
  let t = guess - romeOffsetMs(guess)
  t = guess - romeOffsetMs(t)
  return new Date(t)
}

/** Monday 00:00 Rome time of the week containing `now` (Italian weeks start on Monday). */
export function romeWeekStart(now: Date = new Date()): Date {
  const [y, m, d] = dayKey(now).split("-").map(Number)
  const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay() // 0 = Sunday
  const back = (dow + 6) % 7
  return romeMidnight(y, m, d - back)
}

/** 00:00 Rome time of the day containing `now`. */
export function romeDayStart(now: Date = new Date()): Date {
  const [y, m, d] = dayKey(now).split("-").map(Number)
  return romeMidnight(y, m, d)
}
