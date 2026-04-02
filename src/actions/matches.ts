"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { SubmitScoreSchema } from "@/lib/validators/match.schema"
import type { SubmitScoreInput } from "@/lib/validators/match.schema"
import { getCurrentSession } from "@/lib/getCurrentPlayer"
import { updateRating } from "@/lib/tournament/glicko2"

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? ""

export async function submitScore(input: SubmitScoreInput) {
  // Must be authenticated
  const session = await getCurrentSession()
  if (!session?.user?.id) throw new Error("Non autenticato")

  const { matchId, teamAScore, teamBScore } = SubmitScoreSchema.parse(input)

  const match = await db.match.findUniqueOrThrow({
    where: { id: matchId },
    include: {
      players: true,
      tournament: { select: { type: true } },
    },
  })

  // Only admin can submit scores
  const isAdmin = ADMIN_EMAIL && session.user.email === ADMIN_EMAIL
  if (!isAdmin) throw new Error("Solo l'amministratore può inserire i risultati")

  if (match.isCompleted) {
    throw new Error("Match is already completed")
  }

  const teamAWon = teamAScore > teamBScore
  const teamAPlayerIds = match.players.filter((p) => p.team === 0).map((p) => p.playerId)
  const teamBPlayerIds = match.players.filter((p) => p.team === 1).map((p) => p.playerId)

  await db.$transaction(async (tx) => {
    // Mark match as completed with scores
    await tx.match.update({
      where: { id: matchId },
      data: {
        teamAScore,
        teamBScore,
        isCompleted: true,
      },
    })

    // Update standings for each player in this match
    const updateStanding = async (playerIds: string[], won: boolean, myScore: number, oppScore: number) => {
      for (const playerId of playerIds) {
        await tx.tournamentStanding.upsert({
          where: {
            tournamentId_playerId: {
              tournamentId: match.tournamentId,
              playerId,
            },
          },
          update: {
            points: { increment: won ? 3 : 1 },
            matchesWon: { increment: won ? 1 : 0 },
            matchesLost: { increment: won ? 0 : 1 },
            pointsFor: { increment: myScore },
            pointsAgainst: { increment: oppScore },
          },
          create: {
            tournamentId: match.tournamentId,
            playerId,
            points: won ? 3 : 1,
            matchesWon: won ? 1 : 0,
            matchesLost: won ? 0 : 1,
            pointsFor: myScore,
            pointsAgainst: oppScore,
            rank: 0,
          },
        })
      }
    }

    await updateStanding(teamAPlayerIds, teamAWon, teamAScore, teamBScore)
    await updateStanding(teamBPlayerIds, !teamAWon, teamBScore, teamAScore)

    // Recompute ranks for this tournament
    const allStandings = await tx.tournamentStanding.findMany({
      where: { tournamentId: match.tournamentId },
      orderBy: [
        { points: "desc" },
        { pointsFor: "desc" },
      ],
    })

    // Sort by (points DESC, diff DESC, ptsFor DESC) and assign ranks
    const sorted = allStandings
      .map((s) => ({ ...s, diff: s.pointsFor - s.pointsAgainst }))
      .sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points
        if (b.diff !== a.diff) return b.diff - a.diff
        return b.pointsFor - a.pointsFor
      })

    for (let i = 0; i < sorted.length; i++) {
      await tx.tournamentStanding.update({
        where: { id: sorted[i].id },
        data: { rank: i + 1 },
      })
    }

    // For BRACKETS and DOUBLE_ELIMINATION: advance winner to next match
    const isBracketType =
      match.tournament.type === "BRACKETS" || match.tournament.type === "DOUBLE_ELIMINATION"

    if (isBracketType && match.nextMatchId) {
      const winnerTeam = teamAWon ? 0 : 1
      const winnerPlayerIds = winnerTeam === 0 ? teamAPlayerIds : teamBPlayerIds

      for (const playerId of winnerPlayerIds) {
        await tx.matchPlayer.create({
          data: {
            matchId: match.nextMatchId,
            playerId,
            team: match.nextMatchSlot ?? 0,
          },
        })
      }
    }

    // For DOUBLE_ELIMINATION: advance loser to Losers Bracket
    if (match.tournament.type === "DOUBLE_ELIMINATION" && match.loserNextMatchId) {
      const loserTeam = teamAWon ? 1 : 0
      const loserPlayerIds = loserTeam === 0 ? teamAPlayerIds : teamBPlayerIds

      for (const playerId of loserPlayerIds) {
        await tx.matchPlayer.create({
          data: {
            matchId: match.loserNextMatchId,
            playerId,
            team: match.loserNextMatchSlot ?? 0,
          },
        })
      }
    }
  })

  // Notify players when their next match is fully populated
  if (match.nextMatchId) {
    notifyIfMatchReady(match.nextMatchId, match.tournamentId).catch(() => {})
  }
  if (match.loserNextMatchId) {
    notifyIfMatchReady(match.loserNextMatchId, match.tournamentId).catch(() => {})
  }

  revalidatePath(`/tournaments/${match.tournamentId}`)
  revalidatePath(`/tournaments/${match.tournamentId}/standings`)
  if (match.tournament.type === "BRACKETS" || match.tournament.type === "DOUBLE_ELIMINATION") {
    revalidatePath(`/tournaments/${match.tournamentId}/bracket`)
  }
}

async function notifyIfMatchReady(matchId: string, tournamentId: string) {
  const nextMatch = await db.match.findUnique({
    where: { id: matchId },
    include: {
      players: { select: { playerId: true } },
      tournament: { select: { name: true } },
    },
  })
  if (!nextMatch || nextMatch.isBye || nextMatch.players.length < 4) return

  const playerIds = nextMatch.players.map((p) => p.playerId)
  const court = nextMatch.courtLabel ? ` al ${nextMatch.courtLabel}` : ""
  import("@/lib/push").then((m) => m.notifyPlayers(playerIds, {
    title: `${nextMatch.tournament.name} — È il tuo turno!`,
    body: `Il tuo prossimo match è pronto${court}. Vai al tabellone!`,
    url: `/tournaments/${tournamentId}`,
  })).catch(() => {})
}

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
}

export async function replaceMatchPlayer(
  matchId: string,
  oldPlayerId: string | null,
  newPlayerId: string,
  team: number,
) {
  const session = await getCurrentSession()
  if (!session?.user?.id) throw new Error("Non autenticato")

  const match = await db.match.findUniqueOrThrow({
    where: { id: matchId },
    select: { tournamentId: true, isCompleted: true },
  })

  if (match.isCompleted) throw new Error("Partita già completata")

  await db.$transaction(async (tx) => {
    if (oldPlayerId) {
      await tx.matchPlayer.deleteMany({ where: { matchId, playerId: oldPlayerId } })
    }
    // Safety: remove new player if already in match on wrong team
    await tx.matchPlayer.deleteMany({ where: { matchId, playerId: newPlayerId } })
    await tx.matchPlayer.create({ data: { matchId, playerId: newPlayerId, team } })
  })

  revalidatePath(`/tournaments/${match.tournamentId}`)
}

export async function getMatchesForRound(tournamentId: string, round: number) {
  return db.match.findMany({
    where: { tournamentId, round },
    include: {
      players: {
        include: { player: true },
      },
    },
    orderBy: { matchNumber: "asc" },
  })
}
