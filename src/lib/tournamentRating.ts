import { db } from "@/lib/db"
import { updateRating } from "@/lib/tournament/glicko2"

/* ────────────────────────────────────────────────────────────────────────── */
/*  Tournament Glicko update — INTERNAL only (called from tournament actions). */
/*                                                                             */
/*  NOT a "use server" action: every exported async function in a "use server" */
/*  file is a client-callable RPC endpoint. Exposed, this would let anyone     */
/*  pass an arbitrary tournamentId and re-apply rating deltas in a loop,       */
/*  corrupting ratings, RatingHistory, divisions and season standings.         */
/*  Authorisation and idempotency are enforced by the caller.                  */
/* ────────────────────────────────────────────────────────────────────────── */

/**
 * Apply Glicko-2 updates for all players in a tournament at the END of the tournament.
 * Treats the entire tournament as one rating period — collects all match results
 * per player and applies a single updateRating() call each.
 * Uses a snapshot of ratings from BEFORE any updates, so each player's opponents
 * are evaluated at their period-start skill level.
 */
export async function applyTournamentGlicko(tournamentId: string) {
  const matches = await db.match.findMany({
    where: { tournamentId, isCompleted: true, isBye: false },
    include: { players: { select: { playerId: true, team: true } } },
  })
  if (matches.length === 0) return

  const allPlayerIds = [...new Set(matches.flatMap((m) => m.players.map((p) => p.playerId)))]
  if (allPlayerIds.length === 0) return

  // Snapshot ratings at period start — used for ALL opponent lookups
  const snapshot = Object.fromEntries(
    (await db.player.findMany({
      where: { id: { in: allPlayerIds } },
      select: { id: true, glickoRating: true, glickoRD: true, glickoVolatility: true },
    })).map((p) => [p.id, p])
  )

  // Build results for each player across all tournament matches
  const updates: { id: string; rating: number; rd: number; volatility: number }[] = []

  for (const playerId of allPlayerIds) {
    const snap = snapshot[playerId]
    if (!snap) continue

    const results: { opponent: { rating: number; rd: number; volatility: number }; score: number }[] = []

    for (const match of matches) {
      const aScore = match.teamAScore ?? 0
      const bScore = match.teamBScore ?? 0
      if (aScore === bScore) continue

      const teamA = match.players.filter((p) => p.team === 0).map((p) => p.playerId)
      const teamB = match.players.filter((p) => p.team === 1).map((p) => p.playerId)

      const onTeamA = teamA.includes(playerId)
      const onTeamB = teamB.includes(playerId)
      if (!onTeamA && !onTeamB) continue

      const teamAWon = aScore > bScore
      const playerWon = (onTeamA && teamAWon) || (onTeamB && !teamAWon)
      const opponentIds = onTeamA ? teamB : teamA

      for (const oppId of opponentIds) {
        const opp = snapshot[oppId]
        if (!opp) continue
        results.push({
          opponent: { rating: opp.glickoRating, rd: opp.glickoRD, volatility: opp.glickoVolatility },
          score: playerWon ? 1 : 0,
        })
      }
    }

    if (results.length === 0) continue

    const updated = updateRating(
      { rating: snap.glickoRating, rd: snap.glickoRD, volatility: snap.glickoVolatility },
      results,
    )
    updates.push({ id: playerId, rating: updated.rating, rd: updated.rd, volatility: updated.volatility })
  }

  await Promise.all(
    updates.map(({ id, rating, rd, volatility }) =>
      db.player.update({
        where: { id },
        data: { glickoRating: rating, glickoRD: rd, glickoVolatility: volatility },
      })
    )
  )

  // Record rating history snapshot for each player
  await Promise.all(
    updates.map(({ id, rating, rd }) =>
      db.ratingHistory.create({
        data: {
          playerId: id,
          rating,
          rd,
          source: "tournament",
          sourceId: tournamentId,
        },
      })
    )
  )
}
