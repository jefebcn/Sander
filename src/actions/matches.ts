"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { SubmitScoreSchema } from "@/lib/validators/match.schema"
import type { SubmitScoreInput } from "@/lib/validators/match.schema"

export async function submitScore(input: SubmitScoreInput) {
  const { matchId, teamAScore, teamBScore } = SubmitScoreSchema.parse(input)

  const match = await db.match.findUniqueOrThrow({
    where: { id: matchId },
    include: {
      players: true,
      tournament: true,
    },
  })

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

    // For BRACKETS: advance winner to next match
    if (match.tournament.type === "BRACKETS" && match.nextMatchId) {
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
  })

  revalidatePath(`/tournaments/${match.tournamentId}`)
  revalidatePath(`/tournaments/${match.tournamentId}/standings`)
  if (match.tournament.type === "BRACKETS") {
    revalidatePath(`/tournaments/${match.tournamentId}/bracket`)
  }
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
