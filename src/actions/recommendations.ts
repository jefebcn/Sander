"use server"

import { db } from "@/lib/db"

const HISTORY_DAYS = 90
const since = (days = HISTORY_DAYS) =>
  new Date(Date.now() - days * 24 * 60 * 60 * 1000)

export interface PersonalizedRecommendations {
  /** Open sessions the player hasn't joined, ranked by familiarity */
  suggestedSessions: SuggestedSession[]
  /** DRAFT/LIVE tournaments the player isn't registered in */
  suggestedTournaments: SuggestedTournament[]
  /** Insight about recent performance */
  performanceInsight: PerformanceInsight | null
}

export interface SuggestedSession {
  id: string
  title: string
  location: string
  date: Date
  spotsLeft: number
  maxPlayers: number
  format: string
  familiarity: "known" | "new"  // "known" = player has been to this location
}

export interface SuggestedTournament {
  id: string
  name: string
  date: Date
  type: string
  playerCount: number
}

export interface PerformanceInsight {
  kind: "streak" | "improving" | "inactive"
  label: string
}

export async function getPersonalizedRecommendations(
  playerId: string,
): Promise<PersonalizedRecommendations> {
  // ── 1. Gather player's historical signals ─────────────────────────────────

  const [sessionHistory, recentMatches] = await Promise.all([
    // Sessions the player has attended (for location familiarity)
    db.sessionParticipant.findMany({
      where: {
        playerId,
        session: { date: { gte: since() } },
      },
      include: { session: { select: { location: true, format: true } } },
    }),
    // Recent tournament match results for win-streak detection
    db.matchPlayer.findMany({
      where: {
        playerId,
        match: { isCompleted: true, updatedAt: { gte: since(28) } },
      },
      include: {
        match: {
          select: {
            teamAScore: true,
            teamBScore: true,
            updatedAt: true,
            players: { select: { playerId: true, team: true } },
          },
        },
      },
      orderBy: { match: { updatedAt: "desc" } },
      take: 10,
    }),
  ])

  // Known locations (visited at least once)
  const knownLocations = new Set(sessionHistory.map((p) => p.session.location.toLowerCase()))

  // Preferred format (most common)
  const formatCounts: Record<string, number> = {}
  for (const p of sessionHistory) {
    formatCounts[p.session.format] = (formatCounts[p.session.format] ?? 0) + 1
  }
  const preferredFormat = Object.entries(formatCounts).sort((a, b) => b[1] - a[1])[0]?.[0]

  // Already-joined session IDs
  const joinedSessionIds = new Set(sessionHistory.map((p) => p.sessionId))

  // ── 2. Suggested sessions ─────────────────────────────────────────────────

  const openSessions = await db.session.findMany({
    where: {
      status: { in: ["OPEN", "FULL"] },
      date: { gte: new Date() },
      id: { notIn: [...joinedSessionIds] },
    },
    include: {
      _count: { select: { participants: true } },
    },
    orderBy: { date: "asc" },
    take: 20,
  })

  const suggestedSessions: SuggestedSession[] = openSessions
    .map((s) => {
      const spotsLeft = s.maxPlayers - s._count.participants
      const familiarity: "known" | "new" = knownLocations.has(s.location.toLowerCase())
        ? "known"
        : "new"
      return { id: s.id, title: s.title, location: s.location, date: s.date,
               spotsLeft, maxPlayers: s.maxPlayers, format: s.format, familiarity }
    })
    // Rank: known > preferred format > open spots > date
    .sort((a, b) => {
      if (a.familiarity !== b.familiarity) return a.familiarity === "known" ? -1 : 1
      if (preferredFormat) {
        const aMatch = a.format === preferredFormat ? 1 : 0
        const bMatch = b.format === preferredFormat ? 1 : 0
        if (aMatch !== bMatch) return bMatch - aMatch
      }
      if (a.spotsLeft > 0 !== b.spotsLeft > 0) return a.spotsLeft > 0 ? -1 : 1
      return a.date.getTime() - b.date.getTime()
    })
    .slice(0, 3)

  // ── 3. Suggested tournaments ──────────────────────────────────────────────

  const registeredTournamentIds = await db.tournamentRegistration
    .findMany({ where: { playerId }, select: { tournamentId: true } })
    .then((rows) => rows.map((r) => r.tournamentId))

  const openTournaments = await db.tournament.findMany({
    where: {
      status: "DRAFT",
      id: { notIn: registeredTournamentIds },
      date: { gte: new Date() },
    },
    include: { _count: { select: { registrations: true } } },
    orderBy: { date: "asc" },
    take: 5,
  })

  const suggestedTournaments: SuggestedTournament[] = openTournaments.map((t) => ({
    id: t.id,
    name: t.name,
    date: t.date,
    type: t.type,
    playerCount: t._count.registrations,
  }))

  // ── 4. Performance insight ────────────────────────────────────────────────

  let performanceInsight: PerformanceInsight | null = null

  if (recentMatches.length === 0) {
    // No recent matches in 28 days
    const lastMatch = await db.matchPlayer.findFirst({
      where: { playerId, match: { isCompleted: true } },
      orderBy: { match: { updatedAt: "desc" } },
    })
    if (!lastMatch) {
      performanceInsight = { kind: "inactive", label: "Non hai ancora giocato — salta in campo! 🏐" }
    } else {
      performanceInsight = { kind: "inactive", label: "Nessuna partita nelle ultime 4 settimane — è ora di tornare! 🌟" }
    }
  } else {
    // Check win streak in the 5 most recent matches
    const recentResults = recentMatches.slice(0, 5).map((mp) => {
      const myTeam = mp.match.players.find((p) => p.playerId === playerId)?.team
      if (myTeam === undefined) return null
      const aScore = mp.match.teamAScore ?? 0
      const bScore = mp.match.teamBScore ?? 0
      return (myTeam === 0 ? aScore > bScore : bScore > aScore) ? "win" : "loss"
    }).filter(Boolean) as ("win" | "loss")[]

    const wins = recentResults.filter((r) => r === "win").length

    if (recentResults[0] === "win" && recentResults[1] === "win" && recentResults[2] === "win") {
      performanceInsight = {
        kind: "streak",
        label: `Sei in serie positiva: ${recentResults.filter((r) => r === "win").length} vittorie di fila! 🔥`,
      }
    } else if (wins >= 3) {
      performanceInsight = {
        kind: "improving",
        label: `In forma: ${wins}/${recentResults.length} vittorie recenti 💪`,
      }
    } else if (wins <= 1 && recentResults.length >= 3) {
      performanceInsight = {
        kind: "improving",
        label: `Momento difficile — continua ad allenarti, ci vuole perseveranza! 🎯`,
      }
    }
  }

  return { suggestedSessions, suggestedTournaments, performanceInsight }
}
