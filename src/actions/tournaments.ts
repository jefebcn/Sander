"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { CreateTournamentSchema } from "@/lib/validators/tournament.schema"
import type { CreateTournamentInput } from "@/lib/validators/tournament.schema"
import { generateKOTBSchedule } from "@/lib/tournament/kotb"
import { generateBracket } from "@/lib/tournament/bracket"
import { generateRoundRobinSchedule } from "@/lib/tournament/roundRobin"
import { generateDoubleElimination } from "@/lib/tournament/doubleElim"
import { assignCourtLabel } from "@/lib/tournament/courtSchedule"

export async function createTournament(input: CreateTournamentInput) {
  const data = CreateTournamentSchema.parse(input)

  const tournament = await db.tournament.create({
    data: {
      name: data.name,
      date: data.date,
      type: data.type,
      status: "DRAFT",
      numCourts: data.numCourts ?? 2,
      registrations: {
        create: data.playerIds.map((playerId, i) => ({
          playerId,
          seedPosition: i + 1,
        })),
      },
    },
    include: { registrations: true },
  })

  revalidatePath("/tournaments")
  return tournament
}

export async function getTournament(id: string) {
  return db.tournament.findUniqueOrThrow({
    where: { id },
    include: {
      registrations: {
        include: { player: true },
        orderBy: { seedPosition: "asc" },
      },
      matches: {
        include: {
          players: {
            include: { player: true },
          },
        },
        orderBy: [{ round: "asc" }, { matchNumber: "asc" }],
      },
      standings: {
        include: { player: true },
        orderBy: { rank: "asc" },
      },
    },
  })
}

export async function listTournaments() {
  return db.tournament.findMany({
    include: {
      registrations: { include: { player: { select: { id: true, name: true } } } },
      _count: { select: { matches: true } },
    },
    orderBy: { date: "desc" },
  })
}

export async function startTournament(tournamentId: string) {
  const tournament = await db.tournament.findUniqueOrThrow({
    where: { id: tournamentId },
    include: {
      registrations: { include: { player: true } },
    },
  })

  if (tournament.status !== "DRAFT") {
    throw new Error("Tournament is not in DRAFT status")
  }

  const playerIds = tournament.registrations.map((r) => r.playerId)

  if (tournament.type === "KING_OF_THE_BEACH") {
    await startKOTBTournament(tournament, playerIds)
  } else if (tournament.type === "ROUND_ROBIN") {
    await startRoundRobinTournament(tournament, playerIds)
  } else if (tournament.type === "DOUBLE_ELIMINATION") {
    await startDoubleEliminationTournament(tournament, playerIds)
  } else {
    await startBracketTournament(tournament, playerIds)
  }

  revalidatePath("/tournaments")
  revalidatePath(`/tournaments/${tournamentId}`)
}

async function startKOTBTournament(
  tournament: { id: string; kotbTotalRounds?: number | null; numCourts: number },
  playerIds: string[],
) {
  const schedule = generateKOTBSchedule(playerIds, tournament.kotbTotalRounds ?? undefined)

  await db.$transaction(async (tx) => {
    // Create all matches and standings atomically
    for (const round of schedule.rounds) {
      for (const match of round.matches) {
        await tx.match.create({
          data: {
            tournamentId: tournament.id,
            round: round.roundNumber,
            matchNumber: match.matchNumber,
            courtLabel: assignCourtLabel(
              round.roundNumber,
              match.matchNumber,
              schedule.totalRounds,
              tournament.numCourts,
            ),
            players: {
              create: [
                { playerId: match.teamA[0], team: 0 },
                { playerId: match.teamA[1], team: 0 },
                { playerId: match.teamB[0], team: 1 },
                { playerId: match.teamB[1], team: 1 },
              ],
            },
          },
        })
      }
    }

    // Create standing rows (one per player, zeroed)
    await tx.tournamentStanding.createMany({
      data: playerIds.map((playerId) => ({
        tournamentId: tournament.id,
        playerId,
        points: 0,
        matchesWon: 0,
        matchesLost: 0,
        pointsFor: 0,
        pointsAgainst: 0,
        rank: 0,
      })),
      skipDuplicates: true,
    })

    await tx.tournament.update({
      where: { id: tournament.id },
      data: {
        status: "LIVE",
        kotbTotalRounds: schedule.totalRounds,
      },
    })
  })
}

async function startRoundRobinTournament(
  tournament: { id: string; numCourts: number },
  playerIds: string[],
) {
  const schedule = generateRoundRobinSchedule(playerIds)

  await db.$transaction(async (tx) => {
    for (const round of schedule.rounds) {
      for (const match of round.matches) {
        await tx.match.create({
          data: {
            tournamentId: tournament.id,
            round: round.roundNumber,
            matchNumber: match.matchNumber,
            courtLabel: assignCourtLabel(
              round.roundNumber,
              match.matchNumber,
              schedule.totalRounds,
              tournament.numCourts,
            ),
            players: {
              create: [
                { playerId: match.teamA[0], team: 0 },
                { playerId: match.teamA[1], team: 0 },
                { playerId: match.teamB[0], team: 1 },
                { playerId: match.teamB[1], team: 1 },
              ],
            },
          },
        })
      }
    }

    await tx.tournamentStanding.createMany({
      data: playerIds.map((playerId) => ({
        tournamentId: tournament.id,
        playerId,
        points: 0,
        matchesWon: 0,
        matchesLost: 0,
        pointsFor: 0,
        pointsAgainst: 0,
        rank: 0,
      })),
      skipDuplicates: true,
    })

    await tx.tournament.update({
      where: { id: tournament.id },
      data: { status: "LIVE" },
    })
  })
}

async function startDoubleEliminationTournament(
  tournament: { id: string; numCourts: number },
  playerIds: string[],
) {
  // Pair players into teams by seed order
  const teams = []
  for (let i = 0; i < playerIds.length; i += 2) {
    if (playerIds[i + 1]) teams.push({ playerIds: [playerIds[i], playerIds[i + 1]] })
  }

  const deMatches = generateDoubleElimination(teams)

  // Compute total rounds per section for court labels
  const wbTotalRounds = Math.max(
    ...deMatches.filter((m) => m.bracketSection === "WB").map((m) => m.round),
    0,
  )

  const tempIdToDbId = new Map<string, string>()

  await db.$transaction(async (tx) => {
    // Create matches ordered: WB (highest round first), LB (round asc), GF last
    const wbMatches = [...deMatches.filter((m) => m.bracketSection === "WB")].sort(
      (a, b) => b.round - a.round,
    )
    const lbMatches = [...deMatches.filter((m) => m.bracketSection === "LB")].sort(
      (a, b) => a.round - b.round,
    )
    const gfMatches = deMatches.filter((m) => m.bracketSection === "GF")
    const ordered = [...wbMatches, ...lbMatches, ...gfMatches]

    for (const dm of ordered) {
      // Sequential round for court label (WB uses countdown → convert)
      const seqRound =
        dm.bracketSection === "WB"
          ? wbTotalRounds - dm.round + 1
          : dm.bracketSection === "LB"
            ? dm.round
            : wbTotalRounds + 99 // GF comes last, wave = PM always

      const created = await tx.match.create({
        data: {
          tournamentId: tournament.id,
          round: dm.round,
          matchNumber: dm.matchNumber,
          bracketSection: dm.bracketSection,
          courtLabel: dm.isBye
            ? null
            : assignCourtLabel(seqRound, dm.matchNumber, wbTotalRounds + 2, tournament.numCourts),
          isBye: dm.isBye,
          isCompleted: dm.isBye,
          loserNextMatchId: null,   // fixed up below
          loserNextMatchSlot: dm.loserNextMatchSlot,
          nextMatchId: null,        // fixed up below
          nextMatchSlot: dm.nextMatchSlot,
          players:
            dm.isBye || (!dm.teamA && !dm.teamB)
              ? undefined
              : {
                  create: [
                    ...(dm.teamA?.playerIds ?? []).map((pid) => ({ playerId: pid, team: 0 })),
                    ...(dm.teamB?.playerIds ?? []).map((pid) => ({ playerId: pid, team: 1 })),
                  ],
                },
        },
      })
      tempIdToDbId.set(dm.tempId, created.id)
    }

    // Fix up nextMatchId and loserNextMatchId cross-references
    for (const dm of ordered) {
      const dbId = tempIdToDbId.get(dm.tempId)!
      const updates: { nextMatchId?: string | null; loserNextMatchId?: string | null } = {}
      if (dm.nextMatchTempId) {
        updates.nextMatchId = tempIdToDbId.get(dm.nextMatchTempId) ?? null
      }
      if (dm.loserNextMatchTempId) {
        updates.loserNextMatchId = tempIdToDbId.get(dm.loserNextMatchTempId) ?? null
      }
      if (Object.keys(updates).length > 0) {
        await tx.match.update({ where: { id: dbId }, data: updates })
      }
    }

    await tx.tournamentStanding.createMany({
      data: playerIds.map((playerId) => ({
        tournamentId: tournament.id,
        playerId,
        points: 0,
        matchesWon: 0,
        matchesLost: 0,
        pointsFor: 0,
        pointsAgainst: 0,
        rank: 0,
      })),
      skipDuplicates: true,
    })

    await tx.tournament.update({
      where: { id: tournament.id },
      data: { status: "LIVE" },
    })
  })
}

async function startBracketTournament(
  tournament: { id: string; numCourts: number },
  playerIds: string[],
) {
  // For brackets, players are paired into teams by seed order (pair 1+2, 3+4, etc.)
  const teams = []
  for (let i = 0; i < playerIds.length; i += 2) {
    if (playerIds[i + 1]) {
      teams.push({ playerIds: [playerIds[i], playerIds[i + 1]] })
    }
  }

  const bracketMatches = generateBracket(teams)

  // Map tempId → created match ID
  const tempIdToDbId = new Map<string, string>()

  // Brackets use countdown rounds (highest = first). Compute sequential round for court labels.
  const maxRound = bracketMatches.reduce((m, bm) => Math.max(m, bm.round), 0)
  const totalBracketRounds = maxRound

  await db.$transaction(async (tx) => {
    // Create matches in round order (highest round first = first round)
    const sorted = [...bracketMatches].sort((a, b) => b.round - a.round)

    for (const bm of sorted) {
      // Convert countdown round to sequential (1 = first played, totalBracketRounds = final)
      const seqRound = maxRound - bm.round + 1
      const created = await tx.match.create({
        data: {
          tournamentId: tournament.id,
          round: bm.round,
          matchNumber: bm.matchNumber,
          courtLabel: bm.isBye
            ? null
            : assignCourtLabel(seqRound, bm.matchNumber, totalBracketRounds, tournament.numCourts),
          isBye: bm.isBye,
          isCompleted: bm.isBye,
          nextMatchId: bm.nextMatchTempId
            ? tempIdToDbId.get(bm.nextMatchTempId) ?? null
            : null,
          nextMatchSlot: bm.nextMatchSlot,
          players: bm.isBye
            ? undefined
            : {
                create: [
                  ...(bm.teamA?.playerIds ?? []).map((pid) => ({ playerId: pid, team: 0 })),
                  ...(bm.teamB?.playerIds ?? []).map((pid) => ({ playerId: pid, team: 1 })),
                ],
              },
        },
      })
      tempIdToDbId.set(bm.tempId, created.id)
    }

    // Fix nextMatchId references (they were null during creation since we build bottom-up)
    for (const bm of sorted) {
      if (bm.nextMatchTempId) {
        await tx.match.update({
          where: { id: tempIdToDbId.get(bm.tempId)! },
          data: { nextMatchId: tempIdToDbId.get(bm.nextMatchTempId) ?? null },
        })
      }
    }

    // Standing rows per unique player
    await tx.tournamentStanding.createMany({
      data: playerIds.map((playerId) => ({
        tournamentId: tournament.id,
        playerId,
        rank: 0,
      })),
      skipDuplicates: true,
    })

    await tx.tournament.update({
      where: { id: tournament.id },
      data: { status: "LIVE" },
    })
  })
}

export async function completeTournament(tournamentId: string) {
  await db.tournament.update({
    where: { id: tournamentId },
    data: { status: "COMPLETED" },
  })

  // Aggregate lifetime stats for all registered players
  const standings = await db.tournamentStanding.findMany({
    where: { tournamentId },
    orderBy: { rank: "asc" },
  })

  await db.$transaction(
    standings.map((s, i) =>
      db.player.update({
        where: { id: s.playerId },
        data: {
          matchesWon: { increment: s.matchesWon },
          matchesLost: { increment: s.matchesLost },
          tournamentsWon: i === 0 ? { increment: 1 } : undefined,
        },
      }),
    ),
  )

  // Recalculate winRatePct for affected players
  for (const s of standings) {
    const player = await db.player.findUniqueOrThrow({ where: { id: s.playerId } })
    const total = player.matchesWon + player.matchesLost
    const pct = total === 0 ? 0 : Math.round((player.matchesWon / total) * 100)
    await db.player.update({ where: { id: s.playerId }, data: { winRatePct: pct } })
  }

  revalidatePath("/tournaments")
  revalidatePath(`/tournaments/${tournamentId}`)
  revalidatePath("/players")
}
