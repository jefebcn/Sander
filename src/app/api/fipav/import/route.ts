import { gunzipSync } from "node:zlib"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { cronAuthorized } from "@/lib/cronAuth"
import { isYouthCategory } from "@/lib/fipav/parse"
import {
  fipavAthletePath, fipavEventsToPrefetch, refreshFipavAthlete, refreshFipavEvent, syncFipav, type FipavGetter,
} from "@/lib/fipav/sync"

export const runtime = "nodejs"
export const maxDuration = 300

/**
 * FIPAV refuses Vercel's servers, so the daily copy is fetched elsewhere
 * (scripts/fipav-import.mjs, run by a scheduled session) and uploaded here:
 * the same public files, parsed by the same code as the normal sync.
 *
 * POST, gzip-compressed JSON, Authorization: Bearer CRON_SECRET.
 *   { step: "all", files }     calendar + rankings → returns the detail files still needed
 *   { step: "details", files } event details and linked players' results
 */
const Body = z.object({
  step: z.enum(["all", "details"]),
  files: z.record(z.string().regex(/^[\w./-]+\.json$/).max(200), z.unknown()),
})

export async function POST(req: NextRequest) {
  if (!cronAuthorized(req.headers.get("authorization"))) {
    return new NextResponse("Unauthorized", { status: 401 })
  }
  let body: z.infer<typeof Body>
  try {
    const raw = Buffer.from(await req.arrayBuffer())
    const text = (raw[0] === 0x1f && raw[1] === 0x8b ? gunzipSync(raw, { maxOutputLength: 96 * 1024 * 1024 }) : raw).toString("utf8")
    body = Body.parse(JSON.parse(text))
  } catch (e) {
    return NextResponse.json({ error: `bad body: ${(e as Error).message.slice(0, 200)}` }, { status: 400 })
  }
  const files = body.files
  const get: FipavGetter = async (path) => {
    if (!(path in files)) throw new Error(`not uploaded: ${path}`)
    return files[path]
  }

  if (body.step === "all") {
    const report = await syncFipav(get)
    return NextResponse.json({ report, need: await neededDetails() })
  }

  const events = await fipavEventsToPrefetch()
  let refreshed = 0
  for (const e of events) {
    const after = await refreshFipavEvent(e, 8_000, get).catch(() => e)
    if (after.detailAt !== e.detailAt) refreshed++
  }
  const players = await linkedPlayers()
  for (const p of players) await refreshFipavAthlete(p.id, p.personId, false, get).catch(() => {})
  console.log(`[fipav] import details ${JSON.stringify({ events: events.length, refreshed, players: players.length })}`)
  return NextResponse.json({ events: events.length, refreshed, players: players.length })
}

/** Linked players whose FIPAV results are more than 12 hours old. */
async function linkedPlayers() {
  const rows = await db.player.findMany({
    where: {
      fipavPersonId: { not: null },
      OR: [{ fipavResultsAt: null }, { fipavResultsAt: { lt: new Date(Date.now() - 12 * 3600_000) } }],
    },
    select: { id: true, fipavPersonId: true },
    take: 500,
  })
  return rows.map((r) => ({ id: r.id, personId: r.fipavPersonId as number }))
}

/** The files the "details" step needs (same rules as refreshFipavEvent / refreshFipavAthlete). */
async function neededDetails(): Promise<string[]> {
  const need = new Set<string>()
  for (const e of await fipavEventsToPrefetch()) {
    need.add(`${e.path}/info-tappa.json`)
    if (isYouthCategory(e.category)) continue
    need.add(`${e.path}/entry-list.json`)
    if (e.endDate.getTime() <= Date.now()) need.add(`${e.path}/classifica.json`)
  }
  const players = await linkedPlayers()
  if (players.length) {
    const years = new Map(
      (await db.fipavRanking.findMany({ where: { personId: { in: players.map((p) => p.personId) } }, select: { personId: true, year: true } }))
        .map((r) => [r.personId, r.year]),
    )
    for (const p of players) need.add(fipavAthletePath(years.get(p.personId) ?? new Date().getUTCFullYear(), p.personId))
  }
  return [...need]
}
