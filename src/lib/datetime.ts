/* ────────────────────────────────────────────────────────────────────────── */
/*  Dates and times as people on the Riviera read them.                        */
/*                                                                             */
/*  Server components render on Vercel in UTC: a plain toLocaleTimeString()    */
/*  there shows an 18:30 match as 16:30. Every formatter pins Europe/Rome so   */
/*  server and browser agree, whatever the machine's clock says.               */
/* ────────────────────────────────────────────────────────────────────────── */

export const TZ = "Europe/Rome"

const time = new Intl.DateTimeFormat("it-IT", { timeZone: TZ, hour: "2-digit", minute: "2-digit" })
const dayShort = new Intl.DateTimeFormat("it-IT", { timeZone: TZ, weekday: "short", day: "numeric", month: "short" })
const dayKeyFmt = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" })

/** "18:30" */
export function formatTime(d: Date | string): string {
  return time.format(new Date(d))
}

/**
 * Whether an instant carries a real time of day. A date picked with
 * <input type="date"> is stored as midnight UTC, which reads "02:00" (or
 * "01:00") in Rimini: that is no start time, so it isn't shown.
 */
export function hasTimeOfDay(d: Date | string): boolean {
  const date = new Date(d)
  return date.getUTCHours() !== 0 || date.getUTCMinutes() !== 0 || date.getUTCSeconds() !== 0
}

/** "sab 18 ott" */
export function formatDayShort(d: Date | string): string {
  return dayShort.format(new Date(d)).replace(/\./g, "")
}

/** Calendar day in Riviera time, "2026-10-18" — for comparing days, not instants. */
export function dayKey(d: Date | string): string {
  return dayKeyFmt.format(new Date(d))
}

/** Whole calendar days from `now` to `d` (0 = today, 1 = tomorrow, -1 = yesterday). */
export function daysFromNow(d: Date | string, now: Date = new Date()): number {
  const a = Date.parse(`${dayKey(now)}T00:00:00Z`)
  const b = Date.parse(`${dayKey(d)}T00:00:00Z`)
  return Math.round((b - a) / 86_400_000)
}

/** "Oggi · 18:30", "Domani · 18:30", "sab 18 ott · 18:30" */
export function formatWhen(d: Date | string, now: Date = new Date()): string {
  const n = daysFromNow(d, now)
  const day = n === 0 ? "Oggi" : n === 1 ? "Domani" : formatDayShort(d)
  return `${day} · ${formatTime(d)}`
}

/** "oggi", "domani", "tra 3 giorni", "tra 2 settimane" */
export function relativeDay(d: Date | string, now: Date = new Date()): string {
  const n = daysFromNow(d, now)
  if (n <= 0) return "oggi"
  if (n === 1) return "domani"
  if (n < 14) return `tra ${n} giorni`
  return `tra ${Math.round(n / 7)} settimane`
}
