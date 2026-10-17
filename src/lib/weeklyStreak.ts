/* ────────────────────────────────────────────────────────────────────────── */
/*  Weeks in a row on the sand — the habit the home asks you to keep.          */
/*                                                                             */
/*  Pure, so "is my streak still alive on Sunday night?" is tested instead of  */
/*  guessed. Weeks run Monday to Sunday on the Riviera clock.                  */
/* ────────────────────────────────────────────────────────────────────────── */

import { dayKey } from "@/lib/datetime"

/** Monday of the Riviera week that contains `d`, as "2026-10-12". */
export function weekKey(d: Date): string {
  const monday = new Date(`${dayKey(d)}T00:00:00Z`)
  monday.setUTCDate(monday.getUTCDate() - ((monday.getUTCDay() + 6) % 7))
  return monday.toISOString().slice(0, 10)
}

export interface WeeklyStreak {
  /** Consecutive weeks with at least one match, ending this week or the last. */
  weeks: number
  /** False while the run lives only thanks to last week: play this week to keep it. */
  playedThisWeek: boolean
}

/**
 * Length of the current run of weeks with a match. A week without one breaks
 * it, except the current week, which isn't over yet.
 */
export function weeklyStreak(played: Date[], now: Date = new Date()): WeeklyStreak {
  const weeks = new Set(played.map(weekKey))
  const thisWeek = weekKey(now)
  const playedThisWeek = weeks.has(thisWeek)
  const cursor = new Date(`${thisWeek}T00:00:00Z`)
  if (!playedThisWeek) cursor.setUTCDate(cursor.getUTCDate() - 7)
  let n = 0
  while (weeks.has(cursor.toISOString().slice(0, 10))) {
    n++
    cursor.setUTCDate(cursor.getUTCDate() - 7)
  }
  return { weeks: n, playedThisWeek }
}
