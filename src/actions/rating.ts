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
    },
  })
  if (!session) return

  // Need sets to determine a winner
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
