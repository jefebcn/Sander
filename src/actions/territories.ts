"use server"

import { db } from "@/lib/db"
import { canonicalLocation, parseBagno } from "@/lib/bagni"

/* ────────────────────────────────────────────────────────────────────────── */
/*  "Re dei Bagni" — hyper-local territory leaderboards.                       */
/*                                                                             */
/*  Beach volley is played at named beach clubs (bagni). Whoever wins most at  */
/*  a given location holds it. This turns the Romagna coast into contestable   */
/*  turf — a differentiator global apps can't replicate (geography = moat).    */
/*                                                                             */
/*  Derived purely from completed sessions + recorded sets (no schema change). */
/* ────────────────────────────────────────────────────────────────────────── */

export interface TerritoryPlayer {
  id: string
  name: string
  avatarUrl: string | null
  wins: number
  matches: number
  winRate: number
}

export interface Territory {
  location: string
  bagno: number | null // parsed bagno number, if this location is a beach club
  king: TerritoryPlayer | null
  standings: TerritoryPlayer[]
  totalMatches: number
}

export async function getLocationLeaderboards(): Promise<Territory[]> {
  const sessions = await db.session.findMany({
    where: { status: "COMPLETED", sets: { some: {} } },
    orderBy: { date: "desc" },
    take: 400,
    select: {
      location: true,
      sets: { select: { teamAScore: true, teamBScore: true } },
      participants: {
        where: { playerId: { not: null } },
        select: {
          team: true,
          player: { select: { id: true, name: true, avatarUrl: true } },
        },
      },
    },
  })

  // location → playerId → tallies
  type Tally = { player: { id: string; name: string; avatarUrl: string | null }; wins: number; matches: number }
  const byLocation = new Map<string, Map<string, Tally>>()

  for (const s of sessions) {
    const aWins = s.sets.filter((x) => x.teamAScore > x.teamBScore).length
    const bWins = s.sets.filter((x) => x.teamBScore > x.teamAScore).length
    if (aWins === bWins) continue // tie / no decisive result
    const winningTeam = aWins > bWins ? 0 : 1

    const loc = canonicalLocation(s.location)
    if (!loc) continue
    let players = byLocation.get(loc)
    if (!players) {
      players = new Map()
      byLocation.set(loc, players)
    }

    for (const p of s.participants) {
      if (!p.player) continue
      const t = players.get(p.player.id) ?? { player: p.player, wins: 0, matches: 0 }
      t.matches += 1
      if (p.team === winningTeam) t.wins += 1
      players.set(p.player.id, t)
    }
  }

  const territories: Territory[] = []
  for (const [location, players] of byLocation.entries()) {
    const standings: TerritoryPlayer[] = [...players.values()]
      .map((t) => ({
        id: t.player.id,
        name: t.player.name,
        avatarUrl: t.player.avatarUrl,
        wins: t.wins,
        matches: t.matches,
        winRate: t.matches > 0 ? Math.round((t.wins / t.matches) * 100) : 0,
      }))
      // King = most wins, then best win-rate, then most matches
      .sort((a, b) => b.wins - a.wins || b.winRate - a.winRate || b.matches - a.matches)

    territories.push({
      location,
      bagno: parseBagno(location),
      king: standings[0] ?? null,
      standings,
      totalMatches: standings.reduce((sum, p) => sum + p.matches, 0),
    })
  }

  // Busiest first
  return territories.sort((a, b) => b.totalMatches - a.totalMatches)
}
