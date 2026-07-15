"use server"

import { db } from "@/lib/db"
import { getCurrentSession } from "@/lib/getCurrentPlayer"
import { isAdminEmail } from "@/lib/isAdmin"
import { getDivision, type Division } from "@/lib/divisions"
import { revalidatePath } from "next/cache"

export interface SeasonInfo {
  id: string
  name: string
  startsAt: string
  endsAt: string
}

export interface SeasonStanding {
  id: string
  name: string
  avatarUrl: string | null
  rating: number
  seasonPoints: number // rating gained since season start
  division: Division
}

async function requireAdmin() {
  const session = await getCurrentSession()
  if (!isAdminEmail(session?.user?.email)) throw new Error("Non autorizzato")
}

export async function getActiveSeason(): Promise<SeasonInfo | null> {
  const s = await db.season.findFirst({
    where: { isActive: true },
    orderBy: { startsAt: "desc" },
  })
  if (!s) return null
  return {
    id: s.id,
    name: s.name,
    startsAt: s.startsAt.toISOString(),
    endsAt: s.endsAt.toISOString(),
  }
}

/** Standings for the active season: players ranked by rating gained since it began. */
export async function getSeasonStandings(): Promise<{
  season: SeasonInfo | null
  standings: SeasonStanding[]
}> {
  const season = await getActiveSeason()
  if (!season) return { season: null, standings: [] }

  const start = new Date(season.startsAt)

  const active = await db.ratingHistory.findMany({
    where: { createdAt: { gte: start } },
    orderBy: { createdAt: "asc" },
    include: {
      player: { select: { id: true, name: true, avatarUrl: true, glickoRating: true } },
    },
  })

  const byPlayer = new Map<string, typeof active>()
  for (const h of active) {
    const arr = byPlayer.get(h.playerId)
    if (arr) arr.push(h)
    else byPlayer.set(h.playerId, [h])
  }

  const standings = await Promise.all(
    [...byPlayer.entries()].map(async ([pid, entries]) => {
      const pre = await db.ratingHistory.findFirst({
        where: { playerId: pid, createdAt: { lt: start } },
        orderBy: { createdAt: "desc" },
        select: { rating: true },
      })
      const startRating = pre?.rating ?? entries[0].rating
      const endRating = entries[entries.length - 1].rating
      const p = entries[0].player
      return {
        id: pid,
        name: p.name,
        avatarUrl: p.avatarUrl,
        rating: Math.round(p.glickoRating),
        seasonPoints: Math.round(endRating - startRating),
        division: getDivision(p.glickoRating),
      } satisfies SeasonStanding
    }),
  )

  standings.sort((a, b) => b.seasonPoints - a.seasonPoints || b.rating - a.rating)
  return { season, standings }
}

export interface PlayerSeasonInfo {
  season: SeasonInfo | null
  division: Division
  rating: number
  seasonPoints: number
  rank: number | null
  totalPlayers: number
}

export async function getPlayerSeasonInfo(playerId: string): Promise<PlayerSeasonInfo> {
  const player = await db.player.findUniqueOrThrow({
    where: { id: playerId },
    select: { glickoRating: true },
  })
  const { season, standings } = await getSeasonStandings()
  const idx = standings.findIndex((s) => s.id === playerId)
  const mine = idx >= 0 ? standings[idx] : null

  return {
    season,
    division: getDivision(player.glickoRating),
    rating: Math.round(player.glickoRating),
    seasonPoints: mine?.seasonPoints ?? 0,
    rank: idx >= 0 ? idx + 1 : null,
    totalPlayers: standings.length,
  }
}

// ── Admin ─────────────────────────────────────────────────────────────────

export async function createSeason(input: {
  name: string
  startsAt: string
  endsAt: string
}): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await requireAdmin()
    const name = input.name.trim()
    if (!name) return { ok: false, error: "Nome mancante" }
    const startsAt = new Date(input.startsAt)
    const endsAt = new Date(input.endsAt)
    if (isNaN(startsAt.getTime()) || isNaN(endsAt.getTime()) || endsAt <= startsAt) {
      return { ok: false, error: "Date non valide" }
    }

    // Only one active season at a time
    await db.season.updateMany({ where: { isActive: true }, data: { isActive: false } })
    await db.season.create({ data: { name, startsAt, endsAt, isActive: true } })

    revalidatePath("/stagione")
    revalidatePath("/profile")
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Errore" }
  }
}

export async function endSeason(seasonId: string): Promise<void> {
  await requireAdmin()
  await db.season.update({ where: { id: seasonId }, data: { isActive: false } })
  revalidatePath("/stagione")
  revalidatePath("/profile")
}
