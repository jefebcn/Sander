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
import { isAdminEmail } from "@/lib/isAdmin"

async function requireAdmin() {
  const session = await getCurrentSession()
  if (!session?.user?.id) throw new Error("Non autenticato")
  if (!isAdminEmail(session.user.email)) throw new Error("Accesso non autorizzato")
}

export async function createTournament(input: CreateTournamentInput): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  try {
    const data = CreateTournamentSchema.parse(input)

    const session = await getCurrentSession()
    const creatorPlayer = session?.user?.id
      ? await db.player.findUnique({ where: { userId: session.user.id }, select: { id: true } })
      : null

    const tournament = await db.tournament.create({
      data: {
        name: data.name,
        date: data.date,
        type: data.type,
        status: "DRAFT",
        numCourts: data.numCourts ?? 2,
        chiceceMatchCount: data.chiceceMatchCount ?? 4,

        location:              data.location ?? null,
        description:           data.description ?? null,
        registrationDeadline:  data.registrationDeadline ?? null,
        prizePool:             data.prizePool ?? null,
        priceCents:            data.priceCents ?? null,
        priceCurrency:         data.priceCurrency,
        isOpenForRegistration: data.isOpenForRegistration,
        createdByPlayerId:     creatorPlayer?.id ?? null,

        registrations: {
          create: data.playerIds.map((playerId, i) => ({
            playerId,
            seedPosition: i + 1,
            // Admin-created registrations are considered pre-paid / free
            paymentStatus: (data.priceCents ?? 0) > 0 ? "PAID" : "FREE",
            paymentMethod: (data.priceCents ?? 0) > 0 ? "CASH" : "FREE",
            paidAt: (data.priceCents ?? 0) > 0 ? new Date() : null,
            amountPaidCents: data.priceCents ?? null,
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

export async function randomizePairings(tournamentId: string) {
  await requireAdmin()

  const regs = await db.tournamentRegistration.findMany({
    where: { tournamentId },
    orderBy: { seedPosition: "asc" },
    select: { playerId: true },
  })

  // Fisher-Yates shuffle
  const ids = regs.map((r) => r.playerId)
  for (let i = ids.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[ids[i], ids[j]] = [ids[j], ids[i]]
  }

  await db.$transaction(
    ids.map((playerId, i) =>
      db.tournamentRegistration.update({
        where: { tournamentId_playerId: { tournamentId, playerId } },
        data: { seedPosition: i + 1 },
      }),
    ),
  )

  revalidatePath(`/tournaments/${tournamentId}`)
}

export async function swapPlayers(tournamentId: string, playerAId: string, playerBId: string) {
  await requireAdmin()

  const [regA, regB] = await Promise.all([
    db.tournamentRegistration.findUniqueOrThrow({
      where: { tournamentId_playerId: { tournamentId, playerId: playerAId } },
      select: { seedPosition: true },
    }),
    db.tournamentRegistration.findUniqueOrThrow({
      where: { tournamentId_playerId: { tournamentId, playerId: playerBId } },
      select: { seedPosition: true },
    }),
  ])

  await db.$transaction([
    db.tournamentRegistration.update({
      where: { tournamentId_playerId: { tournamentId, playerId: playerAId } },
      data: { seedPosition: regB.seedPosition },
    }),
    db.tournamentRegistration.update({
      where: { tournamentId_playerId: { tournamentId, playerId: playerBId } },
      data: { seedPosition: regA.seedPosition },
    }),
  ])

  revalidatePath(`/tournaments/${tournamentId}`)
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
  const skillLevels = new Map<string, number | null>(
    tournament.registrations.map((r) => [r.playerId, r.skillLevel]),
  )

  if (tournament.type === "KING_OF_THE_BEACH") {
    await startKOTBTournament(tournament, playerIds, skillLevels)
  } else if (tournament.type === "ROUND_ROBIN") {
    await startRoundRobinTournament(tournament, playerIds)
  } else if (tournament.type === "DOUBLE_ELIMINATION") {
    await startDoubleEliminationTournament(tournament, playerIds)
  } else if (tournament.type === "CHICECE") {
    await startChiceceTournament(tournament, playerIds, skillLevels)
  } else {
    await startBracketTournament(tournament, playerIds)
  }

  // Notify all participants that the tournament has started
  try {
    const { notifyPlayers } = await import("@/lib/push")
    const registeredPlayerIds = tournament.registrations.map((r) => r.playerId)
    await notifyPlayers(registeredPlayerIds, {
      title: `🏐 ${tournament.name} è iniziato!`,
      body: "Il torneo è in corso. Controlla il tabellone e preparati per il tuo match.",
      url: `/tournaments/${tournamentId}`,
    })
  } catch {
    // Non-critical — don't block tournament start if push fails
  }

  revalidatePath("/tournaments")
  revalidatePath(`/tournaments/${tournamentId}`)
}

async function startKOTBTournament(
  tournament: { id: string; kotbTotalRounds?: number | null; numCourts: number },
  playerIds: string[],
  skillLevels?: Map<string, number | null>,
) {
  const schedule = generateKOTBSchedule(
    playerIds,
    tournament.kotbTotalRounds ?? undefined,
    skillLevels,
  )

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
  skillLevels?: Map<string, number | null>,
): Array<{ roundNumber: number; matches: Array<{ teamA: [string, string]; teamB: [string, string]; matchNumber: number }> }> {
  const n = playerIds.length
  if (n % 4 !== 0) throw new Error("Chicece richiede un numero di giocatori multiplo di 4")

  const numMatchesPerRound = n / 4
  // 1-factorization: n-1 rounds with fully unique partnerships.
  // Fix playerIds[n-1]. In round k, pair it with playerIds[k % (n-1)].
  // Remaining n/2-1 pairs: (k-i mod (n-1), k+i mod (n-1)) for i=1..(n/2-1).
  const others = n - 1 // indices 0..n-2 rotate; index n-1 is fixed
  const maxUniqueRounds = others

  const rounds = []

  for (let round = 0; round < numRounds; round++) {
    const k = round % maxUniqueRounds

    // Build n/2 unique partner pairs via 1-factorization
    const pairs: [string, string][] = []
    pairs.push([playerIds[n - 1], playerIds[k]])
    for (let i = 1; i <= Math.floor((others - 1) / 2); i++) {
      const a = (k - i + others) % others
      const b = (k + i) % others
      pairs.push([playerIds[a], playerIds[b]])
    }
    // pairs.length === n/2

    // If skillLevels provided: sort pairs by team skill sum so that
    // adjacent pairs (→ same match) have similar strength levels.
    // Partnership uniqueness is still guaranteed by the 1-factorization above.
    if (skillLevels) {
      pairs.sort((a, b) => {
        const sumA = (skillLevels.get(a[0]) ?? 2) + (skillLevels.get(a[1]) ?? 2)
        const sumB = (skillLevels.get(b[0]) ?? 2) + (skillLevels.get(b[1]) ?? 2)
        return sumA - sumB
      })
    }

    // Group pairs into matches: pair[0] vs pair[1], pair[2] vs pair[3], etc.
    const matches = []
    for (let i = 0; i < numMatchesPerRound; i++) {
      matches.push({
        teamA: pairs[2 * i] as [string, string],
        teamB: pairs[2 * i + 1] as [string, string],
        matchNumber: round * numMatchesPerRound + i + 1,
      })
    }

    rounds.push({ roundNumber: round + 1, matches })
  }
  return rounds
}

async function startChiceceTournament(
  tournament: { id: string; numCourts: number; chiceceMatchCount: number },
  playerIds: string[],
  skillLevels?: Map<string, number | null>,
) {
  if (playerIds.length % 4 !== 0 || playerIds.length < 4) {
    throw new Error("Chicece richiede almeno 4 giocatori, multiplo di 4")
  }

  const schedule = generateChiceceGroupSchedule(
    playerIds,
    tournament.chiceceMatchCount,
    skillLevels,
  )

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

  // ── Create TournamentStanding records + update career stats ──
  const regs = await db.tournamentRegistration.findMany({
    where: { tournamentId: match.tournamentId },
    orderBy: { chicecePlusMinus: "desc" },
  })

  // Count per-player won/lost from all completed matches in this tournament
  const allMatches = await db.match.findMany({
    where: { tournamentId: match.tournamentId, isCompleted: true, isBye: false },
    include: { players: { select: { playerId: true, team: true } } },
  })

  const playerWL: Record<string, { won: number; lost: number; pf: number; pa: number }> = {}
  for (const r of regs) {
    playerWL[r.playerId] = { won: 0, lost: 0, pf: 0, pa: 0 }
  }
  for (const m of allMatches) {
    const aScore = m.teamAScore ?? 0
    const bScore = m.teamBScore ?? 0
    if (aScore === bScore) continue
    const teamAWon = aScore > bScore
    for (const mp of m.players) {
      const wl = playerWL[mp.playerId]
      if (!wl) continue
      const onA = mp.team === 0
      const won = (onA && teamAWon) || (!onA && !teamAWon)
      if (won) wl.won++; else wl.lost++
      wl.pf += onA ? aScore : bScore
      wl.pa += onA ? bScore : aScore
    }
  }

  // Create standings sorted by chicecePlusMinus
  await db.$transaction(
    regs.map((r, i) => {
      const wl = playerWL[r.playerId] ?? { won: 0, lost: 0, pf: 0, pa: 0 }
      return db.tournamentStanding.create({
        data: {
          tournamentId: match.tournamentId,
          playerId: r.playerId,
          rank: i + 1,
          points: r.chicecePlusMinus,
          matchesWon: wl.won,
          matchesLost: wl.lost,
          pointsFor: wl.pf,
          pointsAgainst: wl.pa,
        },
      })
    })
  )

  // Update career stats (same logic as completeTournament)
  for (let i = 0; i < regs.length; i++) {
    const wl = playerWL[regs[i].playerId] ?? { won: 0, lost: 0 }
    await db.player.update({
      where: { id: regs[i].playerId },
      data: {
        matchesWon: { increment: wl.won },
        matchesLost: { increment: wl.lost },
        tournamentsWon: i === 0 ? { increment: 1 } : undefined,
      },
    })
    // Recalculate winRatePct
    const player = await db.player.findUniqueOrThrow({ where: { id: regs[i].playerId } })
    const total = player.matchesWon + player.matchesLost
    const pct = total === 0 ? 0 : Math.round((player.matchesWon / total) * 100)
    await db.player.update({ where: { id: regs[i].playerId }, data: { winRatePct: pct } })
  }

  // Push notification
  try {
    const { notifyPlayers } = await import("@/lib/push")
    const tournament = await db.tournament.findUnique({
      where: { id: match.tournamentId },
      select: { name: true },
    })
    const winnerName = regs[0]
      ? (await db.player.findUnique({ where: { id: regs[0].playerId }, select: { name: true } }))?.name
      : null
    await notifyPlayers(
      regs.map((r) => r.playerId),
      {
        title: "🏆 Torneo completato!",
        body: winnerName
          ? `${tournament?.name ?? "Torneo"} — Vincitore: ${winnerName}`
          : `${tournament?.name ?? "Torneo"} è terminato. Guarda i risultati finali.`,
        url: `/tournaments/${match.tournamentId}`,
      },
    )
  } catch {
    // Non-critical
  }

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

  // Notify all participants that the tournament is over
  try {
    const { notifyPlayers } = await import("@/lib/push")
    const winner = standings[0]
    const winnerName = winner
      ? (await db.player.findUnique({ where: { id: winner.playerId }, select: { name: true } }))?.name
      : null
    const tournamentName = (await db.tournament.findUnique({ where: { id: tournamentId }, select: { name: true } }))?.name ?? "Il torneo"
    await notifyPlayers(
      standings.map((s) => s.playerId),
      {
        title: "🏆 Torneo completato!",
        body: winnerName
          ? `${tournamentName} — Vincitore: ${winnerName}`
          : `${tournamentName} è terminato. Guarda i risultati finali.`,
        url: `/tournaments/${tournamentId}`,
      },
    )
  } catch {
    // Non-critical
  }

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


// ─── Team Info (name + logo per coppia) ──────────────────────────────────────

export async function updateTeamInfo(
  tournamentId: string,
  leaderPlayerId: string,
  teamName: string | null,
  teamLogoUrl: string | null,
) {
  const session = await getCurrentSession()
  if (!isAdminEmail(session?.user?.email)) throw new Error("Non autorizzato")

  const tournament = await db.tournament.findUniqueOrThrow({
    where: { id: tournamentId },
    select: { status: true },
  })
  if (tournament.status !== "DRAFT") throw new Error("Il torneo è già iniziato")

  await db.tournamentRegistration.updateMany({
    where: { tournamentId, playerId: leaderPlayerId },
    data: {
      teamName: teamName?.trim() || null,
      teamLogoUrl: teamLogoUrl?.trim() || null,
    },
  })

  revalidatePath(`/tournaments/${tournamentId}`)
}
