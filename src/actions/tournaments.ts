"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { getCurrentSession } from "@/lib/getCurrentPlayer"
import { CreateTournamentSchema } from "@/lib/validators/tournament.schema"
import type { CreateTournamentInput } from "@/lib/validators/tournament.schema"
import { generateKOTBSchedule } from "@/lib/tournament/kotb"
import { generateBracket } from "@/lib/tournament/bracket"
import { generateRoundRobinSchedule } from "@/lib/tournament/roundRobin"
import { generateDoubleElimination } from "@/lib/tournament/doubleElim"
import { assignCourtLabel } from "@/lib/tournament/courtSchedule"
import { applyTournamentGlicko } from "@/actions/matches"

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? ""

async function requireAdmin() {
  const session = await getCurrentSession()
  if (!session?.user?.id) throw new Error("Non autenticato")
  if (!ADMIN_EMAIL || session.user.email !== ADMIN_EMAIL) throw new Error("Accesso non autorizzato")
}

export async function createTournament(input: CreateTournamentInput): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  try {
    const data = CreateTournamentSchema.parse(input)

    const tournament = await db.tournament.create({
      data: {
        name: data.name,
        date: data.date,
        type: data.type,
        status: "DRAFT",
        numCourts: data.numCourts ?? 2,
        chiceceMatchCount: data.chiceceMatchCount ?? 4,
        registrations: {
          create: data.playerIds.map((playerId, i) => ({
            playerId,
            seedPosition: i + 1,
          })),
        },
      },
      select: { id: true },
    })

    revalidatePath("/tournaments")
    return { ok: true, id: tournament.id }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) }
  }
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
  await requireAdmin()
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
  } else if (tournament.type === "CHICECE") {
    await startChiceceTournament(tournament, playerIds)
  } else {
    await startBracketTournament(tournament, playerIds)
  }

  // push notifications removed (UI disabled)

  revalidatePath("/tournaments")
  revalidatePath(`/tournaments/${tournamentId}`)
}

async function startKOTBTournament(
  tournament: { id: string; kotbTotalRounds?: number | null; numCourts: number },
  playerIds: string[],
) {
  const schedule = generateKOTBSchedule(playerIds, tournament.kotbTotalRounds ?? undefined)

  await db.$transaction(async (tx) => {
    // Batch create all matches in one round-trip
    const matchRows = schedule.rounds.flatMap((round) =>
      round.matches.map((match) => ({
        tournamentId: tournament.id,
        round: round.roundNumber,
        matchNumber: match.matchNumber,
        courtLabel: assignCourtLabel(
          round.roundNumber,
          match.matchNumber,
          schedule.totalRounds,
          tournament.numCourts,
        ),
      })),
    )

    const createdMatches = await tx.match.createManyAndReturn({
      data: matchRows,
      select: { id: true, round: true, matchNumber: true },
    })

    // Build round+matchNumber → id map
    const matchIdMap = new Map<string, string>()
    for (const m of createdMatches) {
      matchIdMap.set(`${m.round}-${m.matchNumber}`, m.id)
    }

    // Batch create all MatchPlayer rows in one round-trip
    await tx.matchPlayer.createMany({
      data: schedule.rounds.flatMap((round) =>
        round.matches.flatMap((match) => {
          const matchId = matchIdMap.get(`${round.roundNumber}-${match.matchNumber}`)!
          return [
            { matchId, playerId: match.teamA[0], team: 0 },
            { matchId, playerId: match.teamA[1], team: 0 },
            { matchId, playerId: match.teamB[0], team: 1 },
            { matchId, playerId: match.teamB[1], team: 1 },
          ]
        }),
      ),
    })

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
    const matchRows = schedule.rounds.flatMap((round) =>
      round.matches.map((match) => ({
        tournamentId: tournament.id,
        round: round.roundNumber,
        matchNumber: match.matchNumber,
        courtLabel: assignCourtLabel(
          round.roundNumber,
          match.matchNumber,
          schedule.totalRounds,
          tournament.numCourts,
        ),
      })),
    )

    const createdMatches = await tx.match.createManyAndReturn({
      data: matchRows,
      select: { id: true, round: true, matchNumber: true },
    })

    const matchIdMap = new Map<string, string>()
    for (const m of createdMatches) {
      matchIdMap.set(`${m.round}-${m.matchNumber}`, m.id)
    }

    await tx.matchPlayer.createMany({
      data: schedule.rounds.flatMap((round) =>
        round.matches.flatMap((match) => {
          const matchId = matchIdMap.get(`${round.roundNumber}-${match.matchNumber}`)!
          return [
            { matchId, playerId: match.teamA[0], team: 0 },
            { matchId, playerId: match.teamA[1], team: 0 },
            { matchId, playerId: match.teamB[0], team: 1 },
            { matchId, playerId: match.teamB[1], team: 1 },
          ]
        }),
      ),
    })

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

  await db.$transaction(async (tx) => {
    const wbMatches = [...deMatches.filter((m) => m.bracketSection === "WB")].sort(
      (a, b) => b.round - a.round,
    )
    const lbMatches = [...deMatches.filter((m) => m.bracketSection === "LB")].sort(
      (a, b) => a.round - b.round,
    )
    const gfMatches = deMatches.filter((m) => m.bracketSection === "GF")
    const ordered = [...wbMatches, ...lbMatches, ...gfMatches]

    // Batch create all matches (nextMatchId / loserNextMatchId fixed up below)
    const createdMatches = await tx.match.createManyAndReturn({
      data: ordered.map((dm) => {
        const seqRound =
          dm.bracketSection === "WB"
            ? wbTotalRounds - dm.round + 1
            : dm.bracketSection === "LB"
              ? dm.round
              : wbTotalRounds + 99
        return {
          tournamentId: tournament.id,
          round: dm.round,
          matchNumber: dm.matchNumber,
          bracketSection: dm.bracketSection,
          courtLabel: dm.isBye
            ? null
            : assignCourtLabel(seqRound, dm.matchNumber, wbTotalRounds + 2, tournament.numCourts),
          isBye: dm.isBye,
          isCompleted: dm.isBye,
          loserNextMatchSlot: dm.loserNextMatchSlot,
          nextMatchSlot: dm.nextMatchSlot,
        }
      }),
      select: { id: true, round: true, matchNumber: true, bracketSection: true },
    })

    // Build tempId → dbId map via section+round+matchNumber
    const sectionRoundMatchKey = (section: string | null, round: number, mn: number) =>
      `${section}-${round}-${mn}`
    const keyToId = new Map<string, string>()
    for (const m of createdMatches) {
      keyToId.set(sectionRoundMatchKey(m.bracketSection, m.round, m.matchNumber), m.id)
    }
    const tempIdToDbId = new Map<string, string>()
    for (const dm of deMatches) {
      tempIdToDbId.set(
        dm.tempId,
        keyToId.get(sectionRoundMatchKey(dm.bracketSection, dm.round, dm.matchNumber))!,
      )
    }

    // Batch create all MatchPlayer rows
    await tx.matchPlayer.createMany({
      data: ordered
        .filter((dm) => !dm.isBye && (dm.teamA || dm.teamB))
        .flatMap((dm) => [
          ...(dm.teamA?.playerIds ?? []).map((pid) => ({
            matchId: tempIdToDbId.get(dm.tempId)!,
            playerId: pid,
            team: 0,
          })),
          ...(dm.teamB?.playerIds ?? []).map((pid) => ({
            matchId: tempIdToDbId.get(dm.tempId)!,
            playerId: pid,
            team: 1,
          })),
        ]),
    })

    // Fix cross-references in parallel
    await Promise.all(
      ordered
        .filter((dm) => dm.nextMatchTempId || dm.loserNextMatchTempId)
        .map((dm) => {
          const updates: { nextMatchId?: string; loserNextMatchId?: string } = {}
          if (dm.nextMatchTempId) updates.nextMatchId = tempIdToDbId.get(dm.nextMatchTempId)!
          if (dm.loserNextMatchTempId)
            updates.loserNextMatchId = tempIdToDbId.get(dm.loserNextMatchTempId)!
          return tx.match.update({ where: { id: tempIdToDbId.get(dm.tempId)! }, data: updates })
        }),
    )

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
  const teams = []
  for (let i = 0; i < playerIds.length; i += 2) {
    if (playerIds[i + 1]) {
      teams.push({ playerIds: [playerIds[i], playerIds[i + 1]] })
    }
  }

  const bracketMatches = generateBracket(teams)
  const maxRound = bracketMatches.reduce((m, bm) => Math.max(m, bm.round), 0)
  const totalBracketRounds = maxRound
  const sorted = [...bracketMatches].sort((a, b) => b.round - a.round)

  await db.$transaction(async (tx) => {
    // Batch create all matches (without nextMatchId — fixed up below)
    const createdMatches = await tx.match.createManyAndReturn({
      data: sorted.map((bm) => {
        const seqRound = maxRound - bm.round + 1
        return {
          tournamentId: tournament.id,
          round: bm.round,
          matchNumber: bm.matchNumber,
          courtLabel: bm.isBye
            ? null
            : assignCourtLabel(seqRound, bm.matchNumber, totalBracketRounds, tournament.numCourts),
          isBye: bm.isBye,
          isCompleted: bm.isBye,
          nextMatchSlot: bm.nextMatchSlot,
        }
      }),
      select: { id: true, round: true, matchNumber: true },
    })

    // Build tempId → dbId map via round+matchNumber
    const roundMatchKey = (round: number, matchNumber: number) => `${round}-${matchNumber}`
    const roundMatchToId = new Map<string, string>()
    for (const m of createdMatches) {
      roundMatchToId.set(roundMatchKey(m.round, m.matchNumber), m.id)
    }
    const tempIdToDbId = new Map<string, string>()
    for (const bm of bracketMatches) {
      tempIdToDbId.set(bm.tempId, roundMatchToId.get(roundMatchKey(bm.round, bm.matchNumber))!)
    }

    // Batch create all MatchPlayer rows
    await tx.matchPlayer.createMany({
      data: bracketMatches
        .filter((bm) => !bm.isBye)
        .flatMap((bm) => [
          ...(bm.teamA?.playerIds ?? []).map((pid) => ({
            matchId: tempIdToDbId.get(bm.tempId)!,
            playerId: pid,
            team: 0,
          })),
          ...(bm.teamB?.playerIds ?? []).map((pid) => ({
            matchId: tempIdToDbId.get(bm.tempId)!,
            playerId: pid,
            team: 1,
          })),
        ]),
    })

    // Fix nextMatchId references in parallel
    await Promise.all(
      bracketMatches
        .filter((bm) => bm.nextMatchTempId)
        .map((bm) =>
          tx.match.update({
            where: { id: tempIdToDbId.get(bm.tempId)! },
            data: { nextMatchId: tempIdToDbId.get(bm.nextMatchTempId!)! },
          }),
        ),
    )

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

// ── Chicece helpers ────────────────────────────────────────────────────────

function generateChiceceGroupSchedule(
  playerIds: string[],
  numRounds: number,
): Array<{ roundNumber: number; matches: Array<{ teamA: [string, string]; teamB: [string, string]; matchNumber: number }> }> {
  const n = playerIds.length
  if (n % 4 !== 0) throw new Error("Chicece richiede un numero di giocatori multiplo di 4")

  const ring = [...playerIds]
  const quarter = n / 4
  const rounds = []

  for (let round = 0; round < numRounds; round++) {
    const matches: Array<{ teamA: [string, string]; teamB: [string, string]; matchNumber: number }> = []
    for (let i = 0; i < quarter; i++) {
      matches.push({
        teamA: [ring[i], ring[quarter + i]],
        teamB: [ring[2 * quarter + i], ring[3 * quarter + i]],
        matchNumber: round * quarter + i + 1,
      })
    }
    rounds.push({ roundNumber: round + 1, matches })
    // Circle-method rotation: keep ring[0] fixed, move last element to position 1
    const last = ring.splice(n - 1, 1)[0]
    ring.splice(1, 0, last)
  }
  return rounds
}

async function startChiceceTournament(
  tournament: { id: string; numCourts: number; chiceceMatchCount: number },
  playerIds: string[],
) {
  if (playerIds.length % 4 !== 0 || playerIds.length < 4) {
    throw new Error("Chicece richiede almeno 4 giocatori, multiplo di 4")
  }

  const schedule = generateChiceceGroupSchedule(playerIds, tournament.chiceceMatchCount)

  await db.$transaction(async (tx) => {
    const createdMatches = await tx.match.createManyAndReturn({
      data: schedule.flatMap((round) =>
        round.matches.map((match) => ({
          tournamentId: tournament.id,
          round: round.roundNumber,
          matchNumber: match.matchNumber,
          bracketSection: "GROUP",
        })),
      ),
      select: { id: true, round: true, matchNumber: true },
    })

    const matchIdMap = new Map<string, string>()
    for (const m of createdMatches) {
      matchIdMap.set(`${m.round}-${m.matchNumber}`, m.id)
    }

    await tx.matchPlayer.createMany({
      data: schedule.flatMap((round) =>
        round.matches.flatMap((match) => {
          const matchId = matchIdMap.get(`${round.roundNumber}-${match.matchNumber}`)!
          return [
            { matchId, playerId: match.teamA[0], team: 0 },
            { matchId, playerId: match.teamA[1], team: 0 },
            { matchId, playerId: match.teamB[0], team: 1 },
            { matchId, playerId: match.teamB[1], team: 1 },
          ]
        }),
      ),
    })

    await tx.tournament.update({
      where: { id: tournament.id },
      data: { status: "LIVE", chicecePhase: "GROUP" },
    })
  })
}

export async function submitChiceceGroupMatchScore(
  matchId: string,
  teamAScore: number,
  teamBScore: number,
) {
  await requireAdmin()
  if (teamAScore === teamBScore) throw new Error("Il risultato non può essere in parità")

  const match = await db.match.findUniqueOrThrow({
    where: { id: matchId },
    include: { players: true },
  })

  if (match.isCompleted) throw new Error("Partita già completata")
  if (match.bracketSection !== "GROUP") throw new Error("Non è una partita del girone")

  const delta = Math.abs(teamAScore - teamBScore)
  const teamAWon = teamAScore > teamBScore
  const teamAPlayerIds = match.players.filter((p) => p.team === 0).map((p) => p.playerId)
  const teamBPlayerIds = match.players.filter((p) => p.team === 1).map((p) => p.playerId)

  await db.$transaction(async (tx) => {
    await tx.match.update({
      where: { id: matchId },
      data: { teamAScore, teamBScore, isCompleted: true },
    })

    for (const playerId of teamAPlayerIds) {
      await tx.tournamentRegistration.update({
        where: { tournamentId_playerId: { tournamentId: match.tournamentId, playerId } },
        data: {
          chicecePlusMinus: { increment: teamAWon ? delta : -delta },
          chiceceMatchesPlayed: { increment: 1 },
        },
      })
    }
    for (const playerId of teamBPlayerIds) {
      await tx.tournamentRegistration.update({
        where: { tournamentId_playerId: { tournamentId: match.tournamentId, playerId } },
        data: {
          chicecePlusMinus: { increment: teamAWon ? -delta : delta },
          chiceceMatchesPlayed: { increment: 1 },
        },
      })
    }
  })

  revalidatePath(`/tournaments/${match.tournamentId}`)
}

export async function advanceChiceceToFinals(tournamentId: string) {
  await requireAdmin()
  const tournament = await db.tournament.findUniqueOrThrow({
    where: { id: tournamentId },
    include: {
      registrations: {
        include: { player: true },
        orderBy: { chicecePlusMinus: "desc" },
      },
    },
  })

  if (tournament.chicecePhase !== "GROUP") throw new Error("Non in fase gironi")

  const top4 = tournament.registrations.slice(0, 4)
  if (top4.length < 4) throw new Error("Servono almeno 4 giocatori per la finale")

  // Snake draft: Pair A = (1st + 4th), Pair B = (2nd + 3rd)
  const pairA = [top4[0].playerId, top4[3].playerId]
  const pairB = [top4[1].playerId, top4[2].playerId]

  await db.$transaction(async (tx) => {
    await tx.match.create({
      data: {
        tournamentId,
        round: 1,
        matchNumber: 1,
        bracketSection: "FINAL",
        players: {
          create: [
            { playerId: pairA[0], team: 0 },
            { playerId: pairA[1], team: 0 },
            { playerId: pairB[0], team: 1 },
            { playerId: pairB[1], team: 1 },
          ],
        },
      },
    })

    await tx.tournament.update({
      where: { id: tournamentId },
      data: { chicecePhase: "FINAL" },
    })
  })

  revalidatePath(`/tournaments/${tournamentId}`)
}

export async function submitChiceceFinalScore(
  matchId: string,
  teamAScore: number,
  teamBScore: number,
) {
  await requireAdmin()
  if (teamAScore === teamBScore) throw new Error("Il risultato non può essere in parità")

  const match = await db.match.findUniqueOrThrow({
    where: { id: matchId },
    include: { players: true },
  })

  if (match.isCompleted) throw new Error("Finale già completata")
  if (match.bracketSection !== "FINAL") throw new Error("Non è la partita finale")

  await db.match.update({
    where: { id: matchId },
    data: { teamAScore, teamBScore, isCompleted: true },
  })

  await db.tournament.update({
    where: { id: match.tournamentId },
    data: { status: "COMPLETED" },
  })

  // Apply per-tournament Glicko-2 update (final match completes the tournament)
  await applyTournamentGlicko(match.tournamentId).catch(() => {})

  revalidatePath(`/tournaments/${match.tournamentId}`)
  revalidatePath("/tournaments")
  revalidatePath("/players")
}

export async function completeTournament(tournamentId: string) {
  await requireAdmin()
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

  // Apply per-tournament Glicko-2 update (one rating period = one tournament)
  await applyTournamentGlicko(tournamentId).catch(() => {})

  revalidatePath("/tournaments")
  revalidatePath(`/tournaments/${tournamentId}`)
  revalidatePath("/players")
}

export async function deleteTournament(tournamentId: string) {
  await requireAdmin()

  // Fetch before deletion so we can revert player stats
  const tournament = await db.tournament.findUniqueOrThrow({
    where: { id: tournamentId },
    select: { status: true, type: true },
  })

  const standings = tournament.status === "COMPLETED"
    ? await db.tournamentStanding.findMany({
        where: { tournamentId },
        orderBy: { rank: "asc" },
      })
    : []

  // Cascade delete
  await db.$transaction([
    db.matchPlayer.deleteMany({ where: { match: { tournamentId } } }),
    db.match.deleteMany({ where: { tournamentId } }),
    db.tournamentStanding.deleteMany({ where: { tournamentId } }),
    db.tournamentRegistration.deleteMany({ where: { tournamentId } }),
    db.tournament.delete({ where: { id: tournamentId } }),
  ])

  // ── Revert career stats ──────────────────────────────────────────────────
  // CHICECE auto-completes via submitChiceceFinalScore which never calls
  // completeTournament, so career stats (matchesWon/Lost/tournamentsWon)
  // were never applied for CHICECE — only Glicko was.
  // For all other COMPLETED types, completeTournament applied the standings.
  if (standings.length > 0 && tournament.type !== "CHICECE") {
    await db.$transaction(
      standings.map((s) =>
        db.player.update({
          where: { id: s.playerId },
          data: {
            matchesWon:    { decrement: s.matchesWon },
            matchesLost:   { decrement: s.matchesLost },
            tournamentsWon: s.rank === 1 ? { decrement: 1 } : undefined,
          },
        })
      )
    )

    // Recalculate winRatePct
    for (const s of standings) {
      const player = await db.player.findUniqueOrThrow({ where: { id: s.playerId } })
      const total = Math.max(0, player.matchesWon) + Math.max(0, player.matchesLost)
      const pct = total === 0 ? 0 : Math.round((Math.max(0, player.matchesWon) / total) * 100)
      await db.player.update({ where: { id: s.playerId }, data: { winRatePct: pct } })
    }
  }

  // ── Full Glicko-2 recalculation ──────────────────────────────────────────
  // Glicko ratings are cumulative — the only way to correctly remove a
  // tournament's contribution is to reset all players and replay every
  // remaining completed tournament in chronological order.
  if (tournament.status === "COMPLETED") {
    await fullGlickoRecalculation()
  }

  revalidatePath("/tournaments")
  revalidatePath("/players")
  revalidatePath("/profile")
}

/**
 * Reset every player's Glicko-2 to defaults, then replay all completed
 * tournaments in date order. Used after deleting a completed tournament.
 */
async function fullGlickoRecalculation() {
  await db.player.updateMany({
    data: { glickoRating: 1500, glickoRD: 350, glickoVolatility: 0.06 },
  })

  const completed = await db.tournament.findMany({
    where: { status: "COMPLETED" },
    orderBy: { date: "asc" },
    select: { id: true },
  })

  for (const t of completed) {
    await applyTournamentGlicko(t.id)
  }
}

/**
 * Admin-only: reset ALL player stats (Glicko + career) to zero/default,
 * then replay every completed tournament to restore correct values.
 * Use this to fix stats corrupted by deletions that happened before the
 * revert logic was in place.
 */
export async function adminRecalculateAllStats() {
  await requireAdmin()

  // Reset all career stats
  await db.player.updateMany({
    data: {
      glickoRating: 1500,
      glickoRD: 350,
      glickoVolatility: 0.06,
      matchesWon: 0,
      matchesLost: 0,
      winRatePct: 0,
      tournamentsWon: 0,
    },
  })

  // Replay every completed tournament in chronological order
  const completed = await db.tournament.findMany({
    where: { status: "COMPLETED" },
    orderBy: { date: "asc" },
    select: { id: true, type: true },
  })

  for (const t of completed) {
    // Re-apply career stats from standings (non-CHICECE only)
    if (t.type !== "CHICECE") {
      const standings = await db.tournamentStanding.findMany({
        where: { tournamentId: t.id },
        orderBy: { rank: "asc" },
      })
      if (standings.length > 0) {
        await db.$transaction(
          standings.map((s) =>
            db.player.update({
              where: { id: s.playerId },
              data: {
                matchesWon:    { increment: s.matchesWon },
                matchesLost:   { increment: s.matchesLost },
                tournamentsWon: s.rank === 1 ? { increment: 1 } : undefined,
              },
            })
          )
        )
        for (const s of standings) {
          const player = await db.player.findUniqueOrThrow({ where: { id: s.playerId } })
          const total = player.matchesWon + player.matchesLost
          await db.player.update({
            where: { id: s.playerId },
            data: { winRatePct: total === 0 ? 0 : Math.round((player.matchesWon / total) * 100) },
          })
        }
      }
    }

    // Re-apply Glicko-2
    await applyTournamentGlicko(t.id)
  }

  revalidatePath("/players")
  revalidatePath("/profile")
}

