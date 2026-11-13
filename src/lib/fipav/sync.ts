import { db } from "@/lib/db"
import { notifyPlayers } from "@/lib/push"
import type { Prisma } from "@/generated/prisma/client"
import {
  calendarPages, isYouthCategory, parseAthlete, parseCalendarPage, parseEntryList, parseInfo,
  parseRanking, parseStandings, seasonsToSync, seniorRankingPaths, type FipavEventInput,
} from "./parse"

/* ────────────────────────────────────────────────────────────────────────── */
/*  Reads FIPAV's public beach volley files and keeps a copy in our DB.        */
/*  Server only: the files allow browser reads from federvolley.it alone.      */
/*  Once a day (content cron) plus a self-healing run when the copy is old.    */
/* ────────────────────────────────────────────────────────────────────────── */

const BASE = "https://media.myvolley.net/public/json"
const DAY = 86_400_000

async function getJson(path: string, timeoutMs = 15_000): Promise<unknown> {
  const res = await fetch(`${BASE}/${path.replace(/^\/+/, "")}`, {
    headers: { accept: "application/json", "user-agent": "SANDER beach volley app" },
    signal: AbortSignal.timeout(timeoutMs),
    cache: "no-store",
  })
  if (!res.ok) throw new Error(`FIPAV ${path}: HTTP ${res.status} ${res.headers.get("server") ?? ""}`.trim())
  return res.json()
}

/** Small worker pool, so we never open dozens of requests at once. */
async function pool<T, R>(items: T[], size: number, fn: (t: T) => Promise<R>): Promise<R[]> {
  const out: R[] = []
  let i = 0
  await Promise.all(
    Array.from({ length: Math.min(size, items.length) }, async () => {
      while (i < items.length) {
        const idx = i++
        out[idx] = await fn(items[idx])
      }
    }),
  )
  return out
}

const today = () => {
  const n = new Date()
  return new Date(Date.UTC(n.getUTCFullYear(), n.getUTCMonth(), n.getUTCDate()))
}

// ─── Calendar ────────────────────────────────────────────────────────────────

export async function syncFipavCalendar(): Promise<{ events: number; created: FipavEventInput[] }> {
  const index = await getJson("index.json")
  const seasons = seasonsToSync(index, new Date())
  const events: FipavEventInput[] = []
  for (const season of seasons) {
    const root = await getJson(`${season}/discipline.json`)
    const pages = calendarPages(root)
    const files = pages.length ? await pool(pages, 4, (p) => getJson(p).catch(() => null)) : [root]
    for (const f of files) if (f) events.push(...parseCalendarPage(f, season))
  }
  // Recent and upcoming only: older events have nothing left to plan.
  const from = new Date(today().getTime() - 60 * DAY)
  const keep = [...new Map(events.filter((e) => e.endDate >= from).map((e) => [e.code, e])).values()]

  const hadAny = (await db.fipavEvent.count()) > 0
  const existing = new Set(
    (await db.fipavEvent.findMany({ where: { code: { in: keep.map((e) => e.code) } }, select: { code: true } })).map((e) => e.code),
  )
  const created = keep.filter((e) => !existing.has(e.code))
  if (created.length) await db.fipavEvent.createMany({ data: created, skipDuplicates: true })
  const changed = keep.filter((e) => existing.has(e.code))
  for (let i = 0; i < changed.length; i += 50) {
    await db.$transaction(
      changed.slice(i, i + 50).map(({ code, ...data }) => db.fipavEvent.update({ where: { code }, data })),
    )
  }
  // A year old: gone from the app.
  await db.fipavEvent.deleteMany({ where: { endDate: { lt: new Date(today().getTime() - 400 * DAY) } } })

  // The very first sync is a bulk import, not news.
  return { events: keep.length, created: hadAny ? created : [] }
}

/** "3 nuovi tornei FIPAV in Lombardia" to whoever asked for that region. */
export async function notifyNewFipavEvents(created: FipavEventInput[]): Promise<number> {
  const now = today()
  const byRegion = new Map<string, FipavEventInput[]>()
  for (const e of created) {
    if (e.startDate < now) continue
    byRegion.set(e.region, [...(byRegion.get(e.region) ?? []), e])
  }
  if (!byRegion.size) return 0
  const alerts = await db.fipavAlert.findMany({ where: { region: { in: [...byRegion.keys()] } }, select: { playerId: true, region: true } })
  let sent = 0
  for (const [region, list] of byRegion) {
    const players = alerts.filter((a) => a.region === region).map((a) => a.playerId)
    if (!players.length) continue
    const one = list.length === 1 ? list[0] : null
    await notifyPlayers(players, {
      title: one ? `Nuovo torneo FIPAV in ${region}` : `${list.length} nuovi tornei FIPAV in ${region}`,
      body: one ? `${one.category} · ${one.city}` : list.slice(0, 3).map((e) => e.city).join(", "),
      url: one ? `/tournaments/fipav/${one.code}` : `/tournaments/fipav?regione=${encodeURIComponent(region)}`,
    })
    sent += players.length
  }
  return sent
}

// ─── One event (on demand) ───────────────────────────────────────────────────

type EventRow = Prisma.FipavEventGetPayload<object>

/** How long an event's details stay fresh: tighter as the day gets close. */
export function detailMaxAge(e: Pick<EventRow, "startDate" | "endDate" | "standings">, now = new Date()): number {
  const ended = e.endDate.getTime() + DAY < now.getTime()
  if (ended) return e.standings ? Infinity : 6 * 3600_000
  const days = (e.startDate.getTime() - now.getTime()) / DAY
  return days <= 7 ? 2 * 3600_000 : 12 * 3600_000
}

export function detailIsStale(e: EventRow, now = new Date()): boolean {
  if (!e.detailAt) return true
  return now.getTime() - e.detailAt.getTime() > detailMaxAge(e, now)
}

/** Fetches info, entry list and (once over) standings. Keeps the old copy on failure. */
export async function refreshFipavEvent(e: EventRow, timeoutMs = 8_000): Promise<EventRow> {
  const ended = e.endDate.getTime() <= Date.now()
  const [info, entries, standings] = await Promise.all([
    getJson(`${e.path}/info-tappa.json`, timeoutMs).catch(() => null),
    // Youth events list minors: their entry lists are not kept.
    isYouthCategory(e.category) ? Promise.resolve(null) : getJson(`${e.path}/entry-list.json`, timeoutMs).catch(() => null),
    ended && !isYouthCategory(e.category) ? getJson(`${e.path}/classifica.json`, timeoutMs).catch(() => null) : Promise.resolve(null),
  ])
  if (!info && !entries && !standings) return e
  const data: Prisma.FipavEventUpdateInput = { detailAt: new Date() }
  if (info) data.detail = parseInfo(info) as unknown as Prisma.InputJsonValue
  if (entries) data.entryList = parseEntryList(entries) as unknown as Prisma.InputJsonValue
  if (standings) {
    const s = parseStandings(standings)
    if (s.length) data.standings = s as unknown as Prisma.InputJsonValue
  }
  return db.fipavEvent.update({ where: { code: e.code }, data })
}

// ─── Rankings ────────────────────────────────────────────────────────────────

/** The newest season that has rankings (this year, else last year). */
async function rankingIndex(): Promise<{ year: number; index: unknown }> {
  const y = new Date().getUTCFullYear()
  for (const year of [y, y - 1]) {
    const index = await getJson(`${year}/BVL/classifiche/index.json`).catch(() => null)
    if (index) return { year, index }
  }
  throw new Error("FIPAV rankings index not found")
}

export async function syncFipavRankings(): Promise<number> {
  const { year, index } = await rankingIndex()
  let total = 0
  for (const { gender, path } of seniorRankingPaths(index)) {
    const file = await getJson(`${year}/BVL/classifiche/${path}`, 60_000)
    const { rows } = parseRanking(file)
    if (rows.length < 50) continue // a broken file must not wipe the table
    const data = rows.map((r) => ({ id: `${gender}-${r.personId}`, gender, year, ...r }))
    await db.$transaction(async (tx) => {
      await tx.fipavRanking.deleteMany({ where: { gender } })
      for (let i = 0; i < data.length; i += 2000) {
        await tx.fipavRanking.createMany({ data: data.slice(i, i + 2000), skipDuplicates: true })
      }
    }, { timeout: 60_000 })
    total += rows.length
  }
  return total
}

/** A linked player's results, refreshed at most twice a day. */
export async function refreshFipavAthlete(playerId: string, personId: number, force = false): Promise<void> {
  const p = await db.player.findUnique({ where: { id: playerId }, select: { fipavResultsAt: true } })
  if (!force && p?.fipavResultsAt && Date.now() - p.fipavResultsAt.getTime() < 12 * 3600_000) return
  const row = await db.fipavRanking.findFirst({ where: { personId }, select: { year: true } })
  const year = row?.year ?? new Date().getUTCFullYear()
  const file = await getJson(`${year}/BVL/classifiche/atleti/assoluto/${personId}.json`, 8_000).catch(() => null)
  if (!file) return
  await db.player.update({
    where: { id: playerId },
    data: { fipavResults: parseAthlete(file).slice(0, 30) as unknown as Prisma.InputJsonValue, fipavResultsAt: new Date() },
  })
}

// ─── Everything ──────────────────────────────────────────────────────────────

let running: Promise<FipavSyncReport> | null = null

export interface FipavSyncReport { events: number; created: number; notified: number; rankings: number; prefetched: number; errors: string[] }

/** The daily run: calendar, alerts, rankings, then details of the next week's events. */
export function syncFipav(): Promise<FipavSyncReport> {
  running ??= (async () => {
    const report: FipavSyncReport = { events: 0, created: 0, notified: 0, rankings: 0, prefetched: 0, errors: [] }
    try {
      const cal = await syncFipavCalendar()
      report.events = cal.events
      report.created = cal.created.length
      report.notified = await notifyNewFipavEvents(cal.created)
    } catch (e) { report.errors.push(`calendar: ${(e as Error).message}`) }
    try { report.rankings = await syncFipavRankings() } catch (e) { report.errors.push(`rankings: ${(e as Error).message}`) }
    try {
      const soon = await db.fipavEvent.findMany({
        where: { startDate: { gte: today(), lte: new Date(today().getTime() + 7 * DAY) } },
        orderBy: { startDate: "asc" },
        take: 80,
      })
      const stale = soon.filter((e) => detailIsStale(e))
      await pool(stale, 4, (e) => refreshFipavEvent(e).catch(() => e))
      report.prefetched = stale.length
    } catch (e) { report.errors.push(`details: ${(e as Error).message}`) }
    // Visible in the runtime logs: errors here otherwise vanish into the report.
    console.log(`[fipav] sync ${JSON.stringify(report)}`)
    return report
  })().finally(() => { running = null })
  return running
}

/** True when the copy is missing or more than 30 hours old (cron missed). */
export async function fipavIsStale(): Promise<boolean> {
  const last = await db.fipavEvent.findFirst({ orderBy: { updatedAt: "desc" }, select: { updatedAt: true } })
  return !last || Date.now() - last.updatedAt.getTime() > 30 * 3600_000
}
