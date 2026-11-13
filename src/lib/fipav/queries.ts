import { cache } from "react"
import { db } from "@/lib/db"
import type { Prisma } from "@/generated/prisma/client"
import { categoryGroup, isYouthCategory, type CategoryGroup } from "./parse"

/* Read side of the FIPAV copy: what the pages show. */

const DAY = 86_400_000

export interface FipavListFilters {
  region?: string | null
  gender?: "M" | "F" | null
  group?: CategoryGroup | null
}

const todayUtc = () => {
  const n = new Date()
  return new Date(Date.UTC(n.getUTCFullYear(), n.getUTCMonth(), n.getUTCDate()))
}

/** Events from today on, nearest first. Category groups are filtered in memory (derived field). */
export async function listFipavEvents(f: FipavListFilters, days = 45) {
  const from = todayUtc()
  const where: Prisma.FipavEventWhereInput = {
    endDate: { gte: from },
    startDate: { lte: new Date(from.getTime() + days * DAY) },
    ...(f.region ? { region: f.region } : {}),
    ...(f.gender ? { gender: f.gender } : {}),
  }
  const rows = await db.fipavEvent.findMany({
    where,
    orderBy: [{ startDate: "asc" }, { category: "asc" }, { city: "asc" }],
    select: { code: true, category: true, city: true, region: true, gender: true, clubName: true, startDate: true, endDate: true, prizeEuro: true },
    take: 400,
  })
  return f.group ? rows.filter((r) => categoryGroup(r.category) === f.group) : rows
}

/** Regions with upcoming events, busiest first. */
export async function fipavRegions(): Promise<{ region: string; count: number }[]> {
  const rows = await db.fipavEvent.groupBy({
    by: ["region"],
    where: { endDate: { gte: todayUtc() }, region: { not: "" } },
    _count: { _all: true },
  })
  return rows.map((r) => ({ region: r.region, count: r._count._all })).sort((a, b) => b.count - a.count)
}

export async function fipavLastUpdate(): Promise<Date | null> {
  const r = await db.fipavEvent.findFirst({ orderBy: { updatedAt: "desc" }, select: { updatedAt: true } })
  return r?.updatedAt ?? null
}

export const showsEntryList = (category: string) => !isYouthCategory(category)

/** Where the event lives on FIPAV's site (sign-ups happen there). */
export function fipavEventUrl(e: { code: string; season: number }): string {
  return `https://www.federvolley.it/campionati/beach-volley/${e.season}/${e.code}`
}

export const RANKING_PAGE = 50

export async function fipavRanking(gender: "M" | "F", page: number, q?: string) {
  const where: Prisma.FipavRankingWhereInput = {
    gender,
    ...(q ? { name: { contains: q, mode: "insensitive" } } : {}),
  }
  const [rows, total] = await Promise.all([
    db.fipavRanking.findMany({ where, orderBy: { position: "asc" }, skip: (page - 1) * RANKING_PAGE, take: RANKING_PAGE }),
    db.fipavRanking.count({ where }),
  ])
  return { rows, total }
}

/** Name search across both senior rankings, for "Collega il tuo profilo". */
export async function searchFipavAthletes(q: string) {
  const words = q.trim().split(/\s+/).filter((w) => w.length >= 2).slice(0, 3)
  if (!words.length) return []
  return db.fipavRanking.findMany({
    where: { AND: words.map((w) => ({ name: { contains: w, mode: "insensitive" as const } })) },
    orderBy: { position: "asc" },
    take: 20,
  })
}

/** The player's senior ranking rows (normally one), by FIPAV id. */
export async function fipavRowsFor(personId: number) {
  return db.fipavRanking.findMany({ where: { personId }, orderBy: { position: "asc" } })
}

/** Where an event is now, in the terms of TournamentProgress. */
export function fipavEventStatus(e: { startDate: Date; endDate: Date }, now = Date.now()): "DRAFT" | "LIVE" | "COMPLETED" {
  if (e.endDate.getTime() + DAY <= now) return "COMPLETED"
  return e.startDate.getTime() <= now ? "LIVE" : "DRAFT"
}

/** FIPAV entry points (tab, switch, profile row) show only once there is data. */
export const fipavAvailable = cache(async (): Promise<boolean> => {
  const row = await db.fipavEvent.findFirst({ select: { code: true } }).catch(() => null)
  return row != null
})
