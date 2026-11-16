/**
 * Fills the FIPAV part of the kit's feed when the app has no FIPAV data yet
 * (FIPAV blocks Vercel's servers until it authorises SANDER).
 *
 *   node fipav/feed.mjs work/data.json YYYY-MM-DD(monday)
 *
 * Reads the public FIPAV calendar with fipav.mjs (cache, one request at a
 * time) and writes it into data.json in the same shape as /api/social/feed.
 * Owner's choices: all of Italy, calendar only (no athletes, no podiums),
 * categories Serie Beach, Campionato Italiano, Società; no youth events.
 * Never fatal: if FIPAV does not answer, the feed is left as it is.
 */
import { readFileSync, writeFileSync } from "fs"
import { dirname, join } from "path"
import { fileURLToPath } from "url"
import { configure, listTappe } from "./fipav.mjs"

const DAY = 86_400_000
const [file, monday] = process.argv.slice(2)
if (!file || !/^\d{4}-\d{2}-\d{2}$/.test(monday ?? "")) {
  console.error("usage: node fipav/feed.mjs data.json YYYY-MM-DD(monday)")
  process.exit(2)
}
const data = JSON.parse(readFileSync(file, "utf8"))
if (data.fipav?.length) {
  console.log(`fipav: ${data.fipav.length} eventi già nel feed dell'app`)
  process.exit(0)
}

configure({ cacheDir: join(dirname(fileURLToPath(import.meta.url)), "..", "work", ".cache-fipav") })

// Same rules as src/lib/fipav/parse.ts (youth, short name, group).
const isYouth = (t) => /\bunder\b|\bu\s?1[2-9]\b|\bu\s?20\b|giovanil/i.test(t)
const short = (t) => t.replace(/^Campionato Italiano per societ[aà]\s*/i, "Società ").replace(/^Campionato Italiano Assoluto\s*-?\s*/i, "Campionato Italiano ").replace(/\s+/g, " ").trim()
const group = (t) => (/societ/i.test(t) ? "societa" : /serie beach/i.test(t) ? "serie" : /assolut|italiano/i.test(t) ? "assoluto" : "altro")
const title = (s = "") => s.toLowerCase().replace(/(^|[\s'(-])(\p{L})/gu, (_, a, b) => a + b.toUpperCase())

const from = new Date(Date.parse(`${monday}T12:00:00Z`) - DAY).toISOString().slice(0, 10)
const to = new Date(Date.parse(`${monday}T12:00:00Z`) + 28 * DAY).toISOString().slice(0, 10)
const seasons = [...new Set([from.slice(0, 4), to.slice(0, 4)])]

try {
  const tappe = (await Promise.all(seasons.map((s) => listTappe(s, { dal: from, al: to }).catch((e) => (e.message.includes("404") ? [] : Promise.reject(e)))))).flat()
  const fipav = tappe
    .filter((t) => t.tipologia && !isYouth(t.tipologia) && group(t.tipologia) !== "altro" && t.dal)
    .map((t) => ({
      code: String(t.codice ?? t.id),
      category: short(t.tipologia),
      group: group(t.tipologia),
      city: title(t.comune),
      region: title(t.regione),
      gender: t.sesso === "M" || t.sesso === "F" ? t.sesso : "X",
      startDate: `${t.dal}T00:00:00.000Z`,
      endDate: `${t.al || t.dal}T00:00:00.000Z`,
      prizeEuro: Number(t.montepremi) || 0,
      club: null,
    }))
    .sort((a, b) => a.startDate.localeCompare(b.startDate) || b.prizeEuro - a.prizeEuro)
  data.fipav = fipav
  data.fipavSource = "media.myvolley.net (letto dal giro Instagram)"
  writeFileSync(file, JSON.stringify(data, null, 2))
  console.log(`fipav: ${fipav.length} eventi dal ${from} al ${to} (${tappe.length} tappe lette)`)
} catch (e) {
  console.log(`fipav: non disponibile (${e.message.slice(0, 120)}), continuo senza`)
}
