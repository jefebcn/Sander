/* ────────────────────────────────────────────────────────────────────────── */
/*  FIPAV beach volley data — pure parsing (no fetch, no DB).                  */
/*                                                                             */
/*  FIPAV's own site (federvolley.it) draws its beach pages from public JSON   */
/*  files on media.myvolley.net (FIPAVONLINE). These helpers turn those files  */
/*  into the small shapes SANDER stores. The files are undocumented: every     */
/*  reader tolerates missing fields and skips what it cannot read.             */
/*                                                                             */
/*  Privacy: we keep names and points only. Membership numbers, which some     */
/*  files put in "nome_societa" as "(1234567) NAME", are never kept.           */
/* ────────────────────────────────────────────────────────────────────────── */

type Json = unknown
const obj = (v: Json): Record<string, Json> => (v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, Json>) : {})
const arr = (v: Json): Json[] => (Array.isArray(v) ? v : [])
const str = (v: Json): string => (typeof v === "string" ? v.trim() : typeof v === "number" ? String(v) : "")
const num = (v: Json): number => {
  const n = typeof v === "number" ? v : Number(str(v).replace(",", "."))
  return Number.isFinite(n) ? n : 0
}

// ─── Text helpers ────────────────────────────────────────────────────────────

/** "ACERBI RAOUL" → "Acerbi Raoul", "PODESTA' SIMONE" → "Podesta' Simone". */
export function titleCase(s: string): string {
  return s
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim()
    .replace(/(^|[\s'’\-(/.])(\p{L})/gu, (_, sep: string, ch: string) => sep + ch.toUpperCase())
}

/** Drops "(1234567)" membership codes and tidies a club name. */
export function cleanClub(s: string): string {
  return titleCase(s.replace(/\(\s*\d+\s*\)/g, " ").replace(/\s+/g, " ").trim())
}

/** "Campionato Italiano per società Gold" → "Società Gold". */
export function shortCategory(tipologia: string): string {
  return tipologia
    .replace(/^Campionato Italiano per societ[aà]\s*/i, "Società ")
    .replace(/^Campionato Italiano Assoluto\s*-?\s*/i, "Campionato Italiano ")
    .replace(/\s+/g, " ")
    .trim()
}

/** Youth events: their entry lists name minors, so SANDER does not show them. */
export function isYouthCategory(tipologia: string): boolean {
  return /\bunder\b|\bu\s?1[2-9]\b|\bu\s?20\b|giovanil/i.test(tipologia)
}

/** Category groups for the filter chips. */
export type CategoryGroup = "societa" | "serie" | "assoluto" | "giovanili" | "altro"
export function categoryGroup(tipologia: string): CategoryGroup {
  if (isYouthCategory(tipologia)) return "giovanili"
  if (/societ/i.test(tipologia)) return "societa"
  if (/serie beach/i.test(tipologia)) return "serie"
  if (/assolut|italiano/i.test(tipologia)) return "assoluto"
  return "altro"
}

// ─── Dates ───────────────────────────────────────────────────────────────────

const MONTHS: Record<string, number> = {
  gennaio: 1, febbraio: 2, marzo: 3, aprile: 4, maggio: 5, giugno: 6,
  luglio: 7, agosto: 8, settembre: 9, ottobre: 10, novembre: 11, dicembre: 12,
}

/** Wall-clock time in Rome → the real instant (handles summer time). */
export function romeToUtc(y: number, m: number, d: number, h = 0, min = 0): Date {
  const guess = Date.UTC(y, m - 1, d, h, min)
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Rome", year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).formatToParts(new Date(guess))
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value)
  const asRome = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"))
  return new Date(guess - (asRome - guess))
}

/** "21/08/2026" or "2026-08-21" → that day at 00:00 UTC (the app's "date without time"). */
export function parseDay(s: string): Date | null {
  let m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/)
  if (m) return new Date(Date.UTC(+m[3], +m[2] - 1, +m[1]))
  m = s.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (m) return new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]))
  return null
}

/** "12 Novembre 2026 alle 11:00" → instant in Rome time; "15 Novembre 2026" → day. */
export function parseItalianDate(s: string): Date | null {
  const m = s.toLowerCase().match(/(\d{1,2})\s+([a-zà]+)\s+(\d{4})(?:\D+(\d{1,2})[:.](\d{2}))?/)
  if (!m) return null
  const month = MONTHS[m[2]]
  if (!month) return null
  if (m[4] == null) return new Date(Date.UTC(+m[3], month - 1, +m[1]))
  return romeToUtc(+m[3], month, +m[1], +m[4], +m[5])
}

// ─── Season index & calendar ─────────────────────────────────────────────────

export interface SeasonRef { season: number; from: string; to: string }

/** Seasons of the root index whose dates touch [today − 60 days, today + 1 year]. */
export function seasonsToSync(index: Json, today: Date): number[] {
  const lo = new Date(today.getTime() - 60 * 86_400_000).toISOString().slice(0, 10)
  const hi = new Date(today.getTime() + 365 * 86_400_000).toISOString().slice(0, 10)
  return arr(obj(index).seasons)
    .map((s) => ({ season: Number(str(obj(s).season)), from: str(obj(s).da), to: str(obj(s).a) }))
    .filter((s) => s.season >= 2000 && s.to >= lo && s.from <= hi)
    .map((s) => s.season)
    .sort((a, b) => a - b)
}

/** The page files a season's discipline.json points to ("2026/12/discipline.json"). */
export function calendarPages(seasonFile: Json): string[] {
  return arr(obj(seasonFile).pages).map((p) => str(obj(p).path_discipline)).filter(Boolean)
}

export interface FipavEventInput {
  code: string
  season: number
  gender: string // M | F | X
  girone: string
  category: string
  menu: string | null
  city: string
  province: string | null
  region: string
  clubName: string | null
  startDate: Date
  endDate: Date
  prizeEuro: number
  /** Folder of the event's files, "2026/BVL/M/12476". */
  path: string
}

/** Beach events of one calendar page (pages also carry indoor and sitting volley). */
export function parseCalendarPage(page: Json, season: number): FipavEventInput[] {
  const out: FipavEventInput[] = []
  const serie = obj(obj(obj(page).beach_volley).serie)
  for (const byGender of Object.values(serie)) {
    for (const group of Object.values(obj(byGender))) {
      for (const raw of arr(obj(group).codici)) {
        const e = obj(raw)
        const code = str(e.codice)
        const start = parseDay(str(e.data_inizio_iso)) ?? parseDay(str(e.dal))
        if (!/^BVL[A-Z]\d+$/.test(code) || !start) continue
        const end = parseDay(str(e.data_fine_iso)) ?? parseDay(str(e.al)) ?? start
        const path = str(e.path).replace(/\/[^/]*\.json$/, "")
        const [cityFromLuogo, regionFromLuogo] = str(e.luogo).split(" - ")
        out.push({
          code,
          season,
          gender: str(e.CASESS) || code.charAt(3),
          girone: str(e.girone_index) || code.slice(4),
          category: str(e.tipologia) || "Beach volley",
          menu: str(e.menu_eventi) || null,
          city: str(e.comune) || titleCase(cityFromLuogo ?? ""),
          province: str(e.provincia) ? titleCase(str(e.provincia)) : null,
          region: titleCase(str(e.regione) || regionFromLuogo || ""),
          clubName: str(e.club) ? cleanClub(str(e.club)) : null,
          startDate: start,
          endDate: end < start ? start : end,
          prizeEuro: Math.round(num(e.montepremi_valore)),
          path: path || `${season}/BVL/${code.charAt(3)}/${code.slice(4)}`,
        })
      }
    }
  }
  return out
}

// ─── One event ───────────────────────────────────────────────────────────────

export interface FipavDeadline { key: string; label: string; at: string }
export interface FipavDetail {
  venue: string | null
  address: string | null
  formula: string[]
  deadlines: FipavDeadline[]
}

const DEADLINES: [string, string, string][] = [
  ["termine_iscrizioni", "iscrizioni", "Chiusura iscrizioni"],
  ["pubblicazione_lista", "lista", "Uscita lista d'ingresso"],
  ["data_termine_cambio_coppia", "cambio", "Cambio compagno"],
]

export function parseInfo(file: Json): FipavDetail {
  const d = obj(obj(file).data)
  const loc = obj(d.location)
  const formula = arr(d.tipo_tabellone)
    .map(str)
    .filter((l) => l && !/:\s*$/.test(l) && !/^0\s/.test(l))
    .map((l) => l.replace(/^Tipologia\s+/i, ""))
  const deadlines: FipavDeadline[] = []
  for (const [field, key, label] of DEADLINES) {
    const at = parseItalianDate(str(d[field]))
    if (at) deadlines.push({ key, label, at: at.toISOString() })
  }
  const venue = str(loc.struttura).replace(/^Struttura:\s*/i, "")
  return {
    venue: venue ? titleCase(venue) : null,
    address: str(loc.indirizzo) ? titleCase(str(loc.indirizzo)) : null,
    formula,
    deadlines,
  }
}

export interface FipavEntry { pos: number; team: string; club: string | null; points: number; note: string | null }

/** Entry list in admission order. Youth events are filtered out before this is shown. */
export function parseEntryList(file: Json): FipavEntry[] {
  return arr(obj(obj(file).data).teams)
    .map((raw) => {
      const t = obj(raw)
      const team = obj(t.team)
      const club = str(team.nome_societa)
      return {
        pos: num(t.position),
        team: titleCase(str(team.title)),
        // Pairs signed up without a club carry their membership codes here: drop it.
        club: club && !/\(\s*\d+\s*\)/.test(club) ? cleanClub(club) : null,
        points: num(t.ranking_team),
        note: str(t.notes) || null,
      }
    })
    .filter((e) => e.team)
}

export interface FipavStanding { pos: number; team: string; points: number; money: number }

export function parseStandings(file: Json): FipavStanding[] {
  return arr(obj(obj(file).data).teams)
    .map((raw) => {
      const t = obj(raw)
      const team = obj(t.team)
      return { pos: num(t.position), team: titleCase(str(team.title) || str(t.team)), points: num(t.points), money: num(t.money) }
    })
    .filter((s) => s.team && s.pos > 0)
    .sort((a, b) => a.pos - b.pos)
}

// ─── Rankings ────────────────────────────────────────────────────────────────

export interface FipavRankingRow {
  personId: number
  position: number
  name: string
  totalPoints: number
  entryPoints: number
}

export function parseRanking(file: Json): { year: number; rows: FipavRankingRow[] } {
  const d = obj(obj(file).data)
  const rows = arr(d.athletes)
    .map((raw) => {
      const a = obj(raw)
      return {
        personId: num(a.person_id),
        position: num(a.position),
        name: titleCase(str(a.title)),
        totalPoints: num(a.total_points),
        entryPoints: num(a.entry_list_points),
      }
    })
    .filter((r) => r.personId > 0 && r.position > 0 && r.name)
  return { year: num(d.year), rows }
}

/** Senior ranking files from the rankings index — the youth ones are left out. */
export function seniorRankingPaths(index: Json): { gender: string; path: string }[] {
  return arr(obj(obj(index).data).atleti)
    .map((r) => ({ type: str(obj(r).ranking_type), gender: str(obj(r).sesso).toUpperCase(), path: str(obj(r).path) }))
    .filter((r) => /^assoluto$/i.test(r.type) && (r.gender === "M" || r.gender === "F") && r.path)
    .map(({ gender, path }) => ({ gender, path }))
}

export interface FipavResult { position: number; points: number; date: string | null; event: string }

/** An athlete's results, newest first. */
export function parseAthlete(file: Json): FipavResult[] {
  return arr(obj(file).risultati)
    .map((raw) => {
      const r = obj(raw)
      const day = parseDay(str(r.league_start))
      return {
        position: num(r.final_position),
        points: num(r.points),
        date: day ? day.toISOString().slice(0, 10) : null,
        event: str(r.league_name).replace(/\s*-\s*data inizio:.*$/i, "").trim(),
      }
    })
    .filter((r) => r.event)
    .sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""))
}
