"use server"

import { revalidatePath } from "next/cache"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { SubmitRatingSchema } from "@/lib/validators/rating.schema"
import { updateRating } from "@/lib/tournament/glicko2"

/**
 * Submit a Top/Flop rating + optional skill badges for a player
 * after a session. Idempotent: re-submitting updates the previous vote.
 */
export async function submitPlayerRating(input: unknown) {
  const session = await auth()
  if (!session?.user?.id) return { error: "Non autenticato" }

  const parsed = SubmitRatingSchema.safeParse(input)
  if (!parsed.success) return { error: "Dati non validi" }
  const { sessionId, ratedPlayerId, type, badges } = parsed.data

  // Resolve the rater's player profile
  const rater = await db.player.findUnique({ where: { userId: session.user.id } })
  if (!rater) return { error: "Profilo non trovato" }
  if (rater.id === ratedPlayerId) return { error: "Non puoi votare te stesso" }

  // Upsert the Top/Flop rating
  await db.playerRating.upsert({
    where: {
      sessionId_raterId_ratedId: {
        sessionId,
        raterId: rater.id,
        ratedId: ratedPlayerId,
      },
    },
    create: { sessionId, raterId: rater.id, ratedId: ratedPlayerId, type },
    update: { type },
  })

  // Upsert badge awards (each badge is unique per session+giver+receiver)
  if (badges?.length) {
    for (const badge of badges) {
      await db.badgeAward.upsert({
        where: {
          sessionId_giverId_receiverId_badge: {
            sessionId,
            giverId: rater.id,
            receiverId: ratedPlayerId,
            badge,
          },
        },
        create: { sessionId, giverId: rater.id, receiverId: ratedPlayerId, badge },
        update: {},
      })
    }
  }

  // Recalculate aggregate vote counts for the rated player
  const allRatings = await db.playerRating.findMany({ where: { ratedId: ratedPlayerId } })
  const superVotes = allRatings.filter((r) => r.type === "SUPER").length
  const topVotes   = allRatings.filter((r) => r.type === "TOP").length
  const flopVotes  = allRatings.filter((r) => r.type === "FLOP").length
  const total      = allRatings.length
  // avgRating stored 0–50: (super*50 + top*30) / total
  const avgRating  = total > 0 ? Math.round((superVotes * 50 + topVotes * 30) / total) : 0

  await db.player.update({
    where: { id: ratedPlayerId },
    data:  { superVotes, topVotes, flopVotes, avgRating },
  })

  revalidatePath("/players")
  revalidatePath("/")
  return { success: true }
}

/**
 * Update a player's Glicko-2 rating after a session ends.
 * Computes results against all opponents in session matches and applies one update period.
 */
export async function updateGlickoAfterSession(sessionId: string) {
  const session = await auth()
  if (!session?.user?.id) return { error: "Non autenticato" }

  // Fetch all matches in the session that are completed
  const dbSession = await db.session.findUnique({
    where: { id: sessionId },
    include: {
      participants: {
        include: { player: true },
      },
    },
  })
  if (!dbSession) return { error: "Sessione non trovata" }

  // For each participating player, collect match results and run Glicko update
  // (simplified: uses overall win/loss across session, not individual match data)
  const players = dbSession.participants.map((p) => p.player)

  for (const player of players) {
    const glickoPlayer = {
      rating:     player.glickoRating,
      rd:         player.glickoRD,
      volatility: player.glickoVolatility,
    }

    // Build results from other participants (treated as opponents)
    const opponents = players.filter((p) => p.id !== player.id)
    const results = opponents.map((opp) => ({
      opponent: {
        rating:     opp.glickoRating,
        rd:         opp.glickoRD,
        volatility: opp.glickoVolatility,
      },
      // Use aggregated win rate as approximation until per-match data is available
      score: player.winRatePct / 100 as number,
    }))

    const updated = updateRating(glickoPlayer, results)

    await db.player.update({
      where: { id: player.id },
      data: {
        glickoRating:     updated.rating,
        glickoRD:         updated.rd,
        glickoVolatility: updated.volatility,
      },
    })
  }

  revalidatePath("/players")
  return { success: true }
}
