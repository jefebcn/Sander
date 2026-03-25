"use server"

import { db } from "@/lib/db"

export async function getStandings(tournamentId: string) {
  return db.tournamentStanding.findMany({
    where: { tournamentId },
    include: { player: true },
    orderBy: { rank: "asc" },
  })
}

export async function getTournamentDashboard(tournamentId: string) {
  const [tournament, standings, allMatches] = await Promise.all([
    db.tournament.findUniqueOrThrow({
      where: { id: tournamentId },
      include: {
        registrations: { include: { player: true } },
      },
    }),
    db.tournamentStanding.findMany({
      where: { tournamentId },
      include: { player: true },
      orderBy: { rank: "asc" },
      take: 10,
    }),
    db.match.findMany({
      where: { tournamentId },
      include: {
        players: { include: { player: true } },
      },
      orderBy: [{ round: "asc" }, { matchNumber: "asc" }],
    }),
  ])

  const currentRound = allMatches
    .filter((m) => !m.isCompleted && !m.isBye)
    .map((m) => m.round)
    .sort((a, b) => a - b)[0]

  const currentRoundMatches = allMatches.filter(
    (m) => m.round === currentRound && !m.isBye,
  )
  const nextRound = currentRound ? currentRound + 1 : null
  const nextRoundMatches = nextRound
    ? allMatches.filter((m) => m.round === nextRound && !m.isBye)
    : []

  const completedCount = allMatches.filter((m) => m.isCompleted).length
  const totalCount = allMatches.filter((m) => !m.isBye).length

  return {
    tournament,
    standings,
    currentRoundMatches,
    nextRoundMatches,
    completedCount,
    totalCount,
    currentRound,
  }
}
