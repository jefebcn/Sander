"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { updateRating } from "@/lib/tournament/glicko2"

/**
 * Dampening factor for friendly sessions vs tournaments.
 * Scores are blended toward 0.5: adjustedScore = 0.5 + FRIENDLY_DAMPENING * (rawScore - 0.5)
 * A win becomes 0.7, a loss becomes 0.3 → ~40% of a tournament's rating impact.
 */
const FRIENDLY_DAMPENING = 0.4

/**
 * Update Glicko-2 ratings for all participants after a session ends.
 * Uses actual SessionSet results with dampening so friendly sessions
 * affect ratings less than tournament matches.
 */
export async function updateGlickoAfterSession(sessionId: string) {
  const session = await db.session.findUnique({
    where: { id: sessionId },
    include: {
      participants: {
        include: {
          player: {
            select: {
              id: true,
              glickoRating: true,
              glickoRD: true,
              glickoVolatility: true,
            },
          },
        },
      },
      sets: true,
      sessionMatches: {
        where: { isCompleted: true },
        include: { players: { select: { playerId: true, team: true } } },
      },
    },
  })
  if (!session) return

  // matchMode: aggregate each player's results across all individual matches
  if (session.matchMode) {
    const decided = session.sessionMatches.filter(
      (m) => m.teamAScore != null && m.teamBScore != null && m.teamAScore !== m.teamBScore,
    )
    if (decided.length === 0) return

    const allIds = new Set<string>()
    for (const m of decided) m.players.forEach((p) => allIds.add(p.playerId))
    const freshPlayers = await db.player.findMany({
      where: { id: { in: [...allIds] } },
      select: { id: true, glickoRating: true, glickoRD: true, glickoVolatility: true },
    })
    const snap = new Map(freshPlayers.map((p) => [p.id, p]))
    const playerResults = new Map<string, { opponent: { rating: number; rd: number; volatility: number }; score: number }[]>()
    allIds.forEach((id) => playerResults.set(id, []))

    for (const m of decided) {
      const aWon = (m.teamAScore ?? 0) > (m.teamBScore ?? 0)
      const teamA = m.players.filter((p) => p.team === 0)
      const teamB = m.players.filter((p) => p.team === 1)
      for (const pA of teamA) {
        const sA = snap.get(pA.playerId)
        if (!sA) continue
        const score = 0.5 + FRIENDLY_DAMPENING * (aWon ? 0.5 : -0.5)
        for (const pB of teamB) {
          const sB = snap.get(pB.playerId)
          if (!sB) continue
          playerResults.get(pA.playerId)!.push({ opponent: { rating: sB.glickoRating, rd: sB.glickoRD, volatility: sB.glickoVolatility }, score })
          playerResults.get(pB.playerId)!.push({ opponent: { rating: sA.glickoRating, rd: sA.glickoRD, volatility: sA.glickoVolatility }, score: 1 - score })
        }
      }
    }

    for (const [playerId, results] of playerResults) {
      if (results.length === 0) continue
      const s = snap.get(playerId)
      if (!s) continue
      const updated = updateRating({ rating: s.glickoRating, rd: s.glickoRD, volatility: s.glickoVolatility }, results)
      await db.player.update({ where: { id: playerId }, data: { glickoRating: updated.rating, glickoRD: updated.rd, glickoVolatility: updated.volatility } })
      await db.ratingHistory.create({ data: { playerId, rating: updated.rating, rd: updated.rd, source: "session", sourceId: sessionId } })
    }
    revalidatePath("/players")
    return
  }

  // non-matchMode: need sets to determine a winner
  if (!session.sets || session.sets.length === 0) return

  // Determine winning team from set results (majority of sets won)
  const teamAWins = session.sets.filter((s) => s.teamAScore > s.teamBScore).length
  const teamBWins = session.sets.filter((s) => s.teamBScore > s.teamAScore).length
  if (teamAWins === teamBWins) return // Draw — skip Glicko update

  const winningTeam = teamAWins > teamBWins ? 0 : 1

  // Only participants with assigned teams
  const assigned = session.participants.filter((p) => p.team !== null)
  if (assigned.length < 2) return

  // Snapshot ratings before any updates (prevents order-dependent drift)
  const snapshot = new Map(
    assigned.map((p) => [
      p.playerId,
      {
        rating: p.player.glickoRating,
        rd: p.player.glickoRD,
        volatility: p.player.glickoVolatility,
      },
    ])
  )

  const teamA = assigned.filter((p) => p.team === 0)
  const teamB = assigned.filter((p) => p.team === 1)

  // Compute new ratings for each participant
  const updates: { id: string; rating: number; rd: number; volatility: number }[] = []

  for (const participant of assigned) {
    const playerSnap = snapshot.get(participant.playerId)!
    const playerWon = participant.team === winningTeam
    const rawScore = playerWon ? 1 : 0
    const adjustedScore = 0.5 + FRIENDLY_DAMPENING * (rawScore - 0.5)

    // Opponents are on the other team
    const opponents = participant.team === 0 ? teamB : teamA
    const results = opponents.map((opp) => ({
      opponent: snapshot.get(opp.playerId)!,
      score: adjustedScore,
    }))

    if (results.length === 0) continue

    const updated = updateRating(playerSnap, results)
    updates.push({
      id: participant.playerId,
      rating: updated.rating,
      rd: updated.rd,
      volatility: updated.volatility,
    })
  }

  // Batch write all updates + record history
  for (const u of updates) {
    await db.player.update({
      where: { id: u.id },
      data: {
        glickoRating: u.rating,
        glickoRD: u.rd,
        glickoVolatility: u.volatility,
      },
    })
    await db.ratingHistory.create({
      data: {
        playerId: u.id,
        rating: u.rating,
        rd: u.rd,
        source: "session",
        sourceId: sessionId,
      },
    })
  }

  revalidatePath("/players")
}
