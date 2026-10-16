"use server"

import { db } from "@/lib/db"
import { PUBLIC_PLAYER_SELECT } from "@/lib/publicPlayer"
import { z } from "zod"

// Both functions are public RPC endpoints (the live dashboard polls one from the
// browser): players come back with their public fields only.
const TournamentIdSchema = z.string().trim().min(1).max(64)

export async function getStandings(id: string) {
  const tournamentId = TournamentIdSchema.parse(id)
  return db.tournamentStanding.findMany({
    where: { tournamentId },
    include: { player: { select: PUBLIC_PLAYER_SELECT } },
    orderBy: { rank: "asc" },
  })
}

export async function getTournamentDashboard(id: string) {
  const tournamentId = TournamentIdSchema.parse(id)
  const [tournament, standings, allMatches] = await Promise.all([
    db.tournament.findUniqueOrThrow({
      where: { id: tournamentId },
      include: {
        registrations: { include: { player: { select: PUBLIC_PLAYER_SELECT } } },
      },
    }),
    db.tournamentStanding.findMany({
      where: { tournamentId },
      include: { player: { select: PUBLIC_PLAYER_SELECT } },
      orderBy: { rank: "asc" },
      take: 10,
    }),
    db.match.findMany({
      where: { tournamentId },
      include: {
        players: { include: { player: { select: PUBLIC_PLAYER_SELECT } } },
      },
      orderBy: [{ round: "asc" }, { matchNumber: "asc" }],
    }),
  ])

  const isCountdownType =
    tournament.type === "BRACKETS" || tournament.type === "DOUBLE_ELIMINATION"

  const currentRound = allMatches
    .filter((m) => !m.isCompleted && !m.isBye)
    .map((m) => m.round)
    .sort((a, b) => (isCountdownType ? b - a : a - b))[0]

  const currentRoundMatches = allMatches.filter(
    (m) => m.round === currentRound && !m.isBye,
  )
  const nextRound = currentRound ? currentRound + 1 : null
  const nextRoundMatches = nextRound
    ? allMatches.filter((m) => m.round === nextRound && !m.isBye)
    : []

  const completedCount = allMatches.filter((m) => m.isCompleted).length
  const totalCount = allMatches.filter((m) => !m.isBye).length

  // Build rounds array for bracket-style view
  const roundSet = new Set<number>()
  for (const m of allMatches) {
    if (!m.isBye) roundSet.add(m.round as number)
  }
  const roundNumbers = Array.from(roundSet).sort(
    (a, b) => (isCountdownType ? b - a : a - b),
  )

  const rounds = roundNumbers.map((r) => {
    const matches = allMatches.filter((m) => m.round === r && !m.isBye)
    return {
      round: r,
      matches,
      completedCount: matches.filter((m) => m.isCompleted).length,
      totalCount: matches.length,
    }
  })

  return {
    tournament,
    standings,
    currentRoundMatches,
    nextRoundMatches,
    completedCount,
    totalCount,
    currentRound,
    rounds,
  }
}
