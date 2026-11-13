/**
 * Weekly planner for @sanderbeachvolley.
 *
 *   node plan.mjs data.json A|B YYYY-MM-DD > plan.json
 *
 * A = Monday–Wednesday (run on Sunday evening), B = Thursday–Sunday (run on
 * Wednesday evening). The date is the Monday of the week being planned.
 *
 * Calendar (Europe/Rome):
 *   Mon  POST  FIPAV weekend → else next SANDER tournament → else feature
 *   Tue  STORY tutorial of a feature, 3 frames
 *   Wed  POST  feature of the week (never the same two weeks in a row)
 *   Thu  STORY this weekend: FIPAV → SANDER tournaments → open matches → feature
 *   Fri  POST  "Manca sempre uno?" problem → solution (+ open matches)
 *   Fri  STORY "Chi gioca stasera?" with the create-match screen
 *   Sat  STORY optional: tournament this weekend, else a feature tip
 *   Sun  POST  second feature (even weeks) or community (odd weeks)
 *   Sun  STORY countdown to the next tournament (SANDER, else FIPAV) → else feature
 * Posts on Mon/Wed/Fri/Sun: never more than one day without a post.
 */
import { readFileSync } from "fs"
import { dirname, join } from "path"
import { fileURLToPath } from "url"
import { FEATURE_ORDER } from "./content.mjs"

const PHOTOS = JSON.parse(readFileSync(join(dirname(fileURLToPath(import.meta.url)), "photos.json"), "utf8"))
/** Order of the photo slots in a week (see photos.json). */
const PHOTO_SLOT = { "lun-post": 0, "mar-story": 1, "mer-post": 2, "gio-story": 3, "ven-post": 4, "ven-story": 5, "sab-story": 6, "dom-post": 7, "dom-story": 8 }

/** Background photo for a slot, or null once the stock is used up (the card is used then). */
export function photoFor(monday, day, type) {
  const weeks = Math.round((Date.parse(`${monday}T12:00:00Z`) - Date.parse(`${PHOTOS.start}T12:00:00Z`)) / (7 * DAY))
  const i = weeks * PHOTOS.perWeek + (PHOTO_SLOT[`${day}-${type}`] ?? 99)
  return weeks >= 0 && i < PHOTOS.order.length ? PHOTOS.order[i] : null
}

const DAY = 86_400_000
const romeDay = (d) => new Date(d).toLocaleDateString("en-CA", { timeZone: "Europe/Rome" })
const addDays = (ymd, n) => new Date(Date.parse(`${ymd}T12:00:00Z`) + n * DAY).toISOString().slice(0, 10)

export function isoWeek(ymd) {
  const d = new Date(`${ymd}T12:00:00Z`)
  const day = (d.getUTCDay() + 6) % 7
  d.setUTCDate(d.getUTCDate() - day + 3)
  const firstThu = new Date(Date.UTC(d.getUTCFullYear(), 0, 4))
  return 1 + Math.round(((d - firstThu) / DAY - 3 + ((firstThu.getUTCDay() + 6) % 7)) / 7)
}

const GROUP_RANK = { assoluto: 0, serie: 1, societa: 2, altro: 3 }

/** FIPAV events starting on the given days, best first (category, then prize). */
function fipavOn(data, days) {
  return (data.fipav ?? [])
    .filter((e) => days.includes(romeDay(e.startDate)) || days.includes(e.startDate.slice(0, 10)))
    .sort((a, b) => (GROUP_RANK[a.group] ?? 9) - (GROUP_RANK[b.group] ?? 9) || b.prizeEuro - a.prizeEuro || a.city.localeCompare(b.city))
}

export function plan(data, run, monday) {
  const week = isoWeek(monday)
  const F = (k) => FEATURE_ORDER[((week + k) % FEATURE_ORDER.length + FEATURE_ORDER.length) % FEATURE_ORDER.length]
  const d = (n) => addDays(monday, n)
  const weekend = [d(5), d(6)]
  const fipavWeekend = fipavOn(data, weekend)
  const sanderSoon = (from, to) => (data.tournaments ?? []).filter((t) => romeDay(t.date) >= from && romeDay(t.date) <= to)
  const sanderWeekend = sanderSoon(d(5), d(6))
  const openWeekend = (data.openMatches ?? []).filter((m) => [d(4), d(5), d(6)].includes(romeDay(m.date)))
  const slot = (n, day, time, type, kind, payload = {}, optional = false) =>
    ({ id: `${monday}-${day}-${type}`, day, date: d(n), time, type, kind, week, optional, photo: photoFor(monday, day, type), ...payload })

  const slots = []
  if (run === "A") {
    // Monday: FIPAV of the coming weekend, else the next SANDER tournament, else a feature.
    if (fipavWeekend.length) slots.push(slot(0, "lun", "18:30", "post", "fipav-weekend", { events: fipavWeekend.slice(0, 6), total: fipavWeekend.length, weekend }))
    else {
      const next = sanderSoon(d(0), d(13))[0]
      if (next) slots.push(slot(0, "lun", "18:30", "post", "sander-tournament", { tournament: next }))
      else slots.push(slot(0, "lun", "18:30", "post", "feature", { feature: F(4) }))
    }
    slots.push(slot(1, "mar", "19:00", "story", "tutorial", { feature: F(2) }))
    slots.push(slot(2, "mer", "18:30", "post", "feature", { feature: F(0) }))
  } else if (run === "B") {
    // Thursday: this weekend.
    if (fipavWeekend.length) slots.push(slot(3, "gio", "19:00", "story", "weekend-fipav", { events: fipavWeekend.slice(0, 5), total: fipavWeekend.length, weekend }))
    else if (sanderWeekend.length) slots.push(slot(3, "gio", "19:00", "story", "weekend-sander", { tournaments: sanderWeekend.slice(0, 4) }))
    else if (openWeekend.length >= 2) slots.push(slot(3, "gio", "19:00", "story", "weekend-matches", { matches: openWeekend.slice(0, 5) }))
    else slots.push(slot(3, "gio", "19:00", "story", "feature-story", { feature: F(1) }))

    slots.push(slot(4, "ven", "13:00", "post", "missing-one", { matches: openWeekend.slice(0, 4) }))
    slots.push(slot(4, "ven", "18:30", "story", "tonight"))

    if (sanderWeekend.length) slots.push(slot(5, "sab", "10:30", "story", "weekend-sander", { tournaments: sanderWeekend.slice(0, 4) }, true))
    else slots.push(slot(5, "sab", "10:30", "story", "feature-story", { feature: F(5) }, true))

    slots.push(week % 2 === 0
      ? slot(6, "dom", "11:00", "post", "feature", { feature: F(3) })
      : slot(6, "dom", "11:00", "post", "community"))

    // Sunday story: countdown to the next tournament after this Sunday.
    const nextSander = (data.tournaments ?? []).find((t) => romeDay(t.date) > d(6))
    const nextFipav = (data.fipav ?? []).filter((e) => e.startDate.slice(0, 10) > d(6))
      .sort((a, b) => a.startDate.localeCompare(b.startDate) || (GROUP_RANK[a.group] ?? 9) - (GROUP_RANK[b.group] ?? 9) || b.prizeEuro - a.prizeEuro)[0]
    if (nextSander) slots.push(slot(6, "dom", "18:30", "story", "countdown", { tournament: nextSander, from: d(6) }))
    else if (nextFipav) slots.push(slot(6, "dom", "18:30", "story", "countdown-fipav", { event: nextFipav, from: d(6) }))
    // No tournament ahead: recap the feature of the week (Thursday and Saturday use others).
    else slots.push(slot(6, "dom", "18:30", "story", "feature-story", { feature: F(0) }))
  } else throw new Error("run must be A or B")

  return { run, monday, week, status: "ok", slots }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [file, run, monday] = process.argv.slice(2)
  if (!file || !run || !/^\d{4}-\d{2}-\d{2}$/.test(monday ?? "")) {
    console.error("usage: node plan.mjs data.json A|B YYYY-MM-DD(monday)")
    process.exit(2)
  }
  const data = JSON.parse(readFileSync(file, "utf8"))
  process.stdout.write(JSON.stringify(plan(data, run, monday), null, 2))
}
