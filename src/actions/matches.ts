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

  // ── Update Player career stats + Glicko-2 ─────────────────────────────────
  // Fetch current glicko data for all players in this match
  const allPlayerIds = [...teamAPlayerIds, ...teamBPlayerIds]
  const playerRecords = await db.player.findMany({
    where: { id: { in: allPlayerIds } },
    select: {
      id: true,
      matchesWon: true,
      matchesLost: true,
      glickoRating: true,
      glickoRD: true,
      glickoVolatility: true,
    },
  })
  const playerMap = Object.fromEntries(playerRecords.map((p) => [p.id, p]))

  // For Glicko-2: winning team players beat each opponent on the losing team (score=1),
  // losing team players lost to each opponent on the winning team (score=0).
  const winnerIds = teamAWon ? teamAPlayerIds : teamBPlayerIds
  const loserIds  = teamAWon ? teamBPlayerIds : teamAPlayerIds

  const glickoUpdates: { id: string; rating: number; rd: number; volatility: number; matchesWon: number; matchesLost: number; winRatePct: number }[] = []

  for (const playerId of allPlayerIds) {
    const p = playerMap[playerId]
    if (!p) continue

    const isWinner = winnerIds.includes(playerId)
    const opponentIds = isWinner ? loserIds : winnerIds

    const results = opponentIds
      .map((oppId) => playerMap[oppId])
      .filter(Boolean)
      .map((opp) => ({
        opponent: { rating: opp.glickoRating, rd: opp.glickoRD, volatility: opp.glickoVolatility },
        score: isWinner ? 1 : 0,
      }))

    const updated = updateRating(
      { rating: p.glickoRating, rd: p.glickoRD, volatility: p.glickoVolatility },
      results,
    )

    const newWon  = p.matchesWon  + (isWinner ? 1 : 0)
    const newLost = p.matchesLost + (isWinner ? 0 : 1)
    const total   = newWon + newLost

    glickoUpdates.push({
      id: playerId,
      rating: updated.rating,
      rd: updated.rd,
      volatility: updated.volatility,
      matchesWon: newWon,
      matchesLost: newLost,
      winRatePct: total > 0 ? Math.round((newWon / total) * 100) : 0,
    })
  }

  await Promise.all(
    glickoUpdates.map(({ id, rating, rd, volatility, matchesWon: mw, matchesLost: ml, winRatePct }) =>
      db.player.update({
        where: { id },
        data: {
          glickoRating: rating,
          glickoRD: rd,
          glickoVolatility: volatility,
          matchesWon: mw,
          matchesLost: ml,
          winRatePct,
        },
      })
    )
  )

  revalidatePath("/players")

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
