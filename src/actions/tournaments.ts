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
import { updateRating } from "@/lib/tournament/glicko2"
import { isAdminEmail, canManageTournament } from "@/lib/isAdmin"

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

    // Notify registered players of their tournament registration
    if (data.playerIds.length > 0) {
      import("@/lib/push").then(({ notifyPlayers }) =>
        notifyPlayers(data.playerIds, {
          title: `🏐 Sei iscritto a ${data.name}!`,
          body: `Hai un posto nel torneo. Ti avviseremo quando inizia.`,
          url: `/tournaments/${tournament.id}`,
        }),
      ).catch(() => {})
    }

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
    const { notifyPlayers, notifyPlayer } = await import("@/lib/push")
    const registeredPlayerIds = tournament.registrations.map((r) => r.playerId)
    await notifyPlayers(registeredPlayerIds, {
      title: `🏐 ${tournament.name} è iniziato!`,
      body: "Il torneo è in corso. Controlla il tabellone e preparati per il tuo match.",
      url: `/tournaments/${tournamentId}`,
    })

    // For Chicece: send each player their first-round court assignment
    if (tournament.type === "CHICECE") {
      const round1Matches = await db.match.findMany({
        where: { tournamentId, round: 1, bracketSection: "GROUP" },
        include: { players: { select: { playerId: true } } },
      })
      for (const m of round1Matches) {
        const court = m.courtLabel ? ` al ${m.courtLabel}` : ""
        for (const mp of m.players) {
          await notifyPlayer(mp.playerId, {
            title: `📍 Primo match${court}!`,
            body: `Round 1 — ${tournament.name}. Vai in campo!`,
            url: `/tournaments/${tournamentId}`,
          })
        }
      }
    }
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

// ── Skill-constrained pair generator ─────────────────────────────────────────
// Rules:
//   - L3 + L3 (same level, preferred)
//   - L3 + L2 allowed as fallback (adjacent level)
//   - L3 + L1 NEVER (diff = 2) except as absolute last resort
//   - Never repeats a partnership if a valid alternative exists

interface _PlayerSkill { id: string; skill: number }

function generateSkillConstrainedPairs(
  players: _PlayerSkill[],
  usedPartnerships: Set<string>,
): [string, string][] {
  const paired = new Set<string>()
  const result: [string, string][] = []

  // Sort L3 first so they get first pick of same-level partners
  const sorted = [...players].sort((a, b) => b.skill - a.skill || a.id.localeCompare(b.id))

  function findPartner(player: _PlayerSkill, maxDiff: number, allowRepeat: boolean): _PlayerSkill | null {
    let best: _PlayerSkill | null = null
    let bestIsRepeat = true
    let bestDiff = 99
    for (const c of sorted) {
      if (c.id === player.id || paired.has(c.id)) continue
      const diff = Math.abs(c.skill - player.skill)
      if (diff > maxDiff) continue
      const isRepeat = usedPartnerships.has([player.id, c.id].sort().join("|"))
      if (!allowRepeat && isRepeat) continue
      if (best === null || (bestIsRepeat && !isRepeat) || (bestIsRepeat === isRepeat && diff < bestDiff)) {
        best = c; bestIsRepeat = isRepeat; bestDiff = diff
      }
    }
    return best
  }

  function pass(maxDiff: number, allowRepeat: boolean) {
    for (const p of sorted) {
      if (paired.has(p.id)) continue
      const partner = findPartner(p, maxDiff, allowRepeat)
      if (partner) {
        result.push([p.id, partner.id])
        paired.add(p.id)
        paired.add(partner.id)
      }
    }
  }

  pass(0, false)   // same level, no repeats
  pass(1, false)   // adjacent (L3↔L2, L2↔L1), no repeats — L3↔L1 impossible (diff=2)
  pass(1, true)    // adjacent, allow repeats
  pass(99, false)  // last resort: any pairing, no repeats (L3↔L1 only here)
  pass(99, true)   // absolute fallback: any pairing with repeats

  return result
}

// ── Chicece group schedule ────────────────────────────────────────────────────

function generateChiceceGroupSchedule(
  playerIds: string[],
  numRounds: number,
  skillLevels?: Map<string, number | null>,
): Array<{ roundNumber: number; matches: Array<{ teamA: [string, string]; teamB: [string, string]; matchNumber: number }> }> {
  const n = playerIds.length
  if (n % 4 !== 0) throw new Error("Chicece richiede un numero di giocatori multiplo di 4")

  const numMatchesPerRound = n / 4
  const players: _PlayerSkill[] = playerIds.map((id) => ({
    id,
    skill: skillLevels?.get(id) ?? 2,
  }))
  const skillOf = (id: string) => players.find((p) => p.id === id)!.skill

  const usedPartnerships = new Set<string>()
  const rounds = []

  for (let roundIdx = 0; roundIdx < numRounds; roundIdx++) {
    const pairs = generateSkillConstrainedPairs(players, usedPartnerships)

    for (const [a, b] of pairs) usedPartnerships.add([a, b].sort().join("|"))

    // Sort pairs by skill sum → adjacent pairs form matches (balanced matchups)
    pairs.sort((a, b) => (skillOf(a[0]) + skillOf(a[1])) - (skillOf(b[0]) + skillOf(b[1])))

    const matches = []
    for (let i = 0; i < numMatchesPerRound; i++) {
      matches.push({
        teamA: pairs[2 * i] as [string, string],
        teamB: pairs[2 * i + 1] as [string, string],
        matchNumber: roundIdx * numMatchesPerRound + i + 1,
      })
    }

    rounds.push({ roundNumber: roundIdx + 1, matches })
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
          courtLabel: assignCourtLabel(round.roundNumber, match.matchNumber, tournament.chiceceMatchCount, tournament.numCourts),
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

  // Notify each player about their next pending match
  const allPlayerIds = [...teamAPlayerIds, ...teamBPlayerIds]
  import("@/lib/push").then(async ({ notifyPlayer }) => {
    for (const playerId of allPlayerIds) {
      const nextMatch = await db.match.findFirst({
        where: {
          tournamentId: match.tournamentId,
          bracketSection: "GROUP",
          isCompleted: false,
          players: { some: { playerId } },
        },
        orderBy: [{ round: "asc" }, { matchNumber: "asc" }],
        include: { tournament: { select: { name: true } } },
      })
      if (nextMatch) {
        const court = nextMatch.courtLabel ? ` al ${nextMatch.courtLabel}` : ""
        await notifyPlayer(playerId, {
          title: `⏭️ Prossimo match pronto${court}!`,
          body: `Round ${nextMatch.round} — ${nextMatch.tournament.name}`,
          url: `/tournaments/${match.tournamentId}`,
        })
      }
    }
  }).catch(() => {})

  revalidatePath(`/tournaments/${match.tournamentId}`)
}

export async function advanceChiceceToFinals(
  tournamentId: string,
  draft: { p1Partner: string; p2Partner: string; p3Partner: string; p4Partner: string },
) {
  const session = await getCurrentSession()
  const ok = await canManageTournament(session?.user?.email, tournamentId)
  if (!ok) throw new Error("Non autorizzato")

  const tournament = await db.tournament.findUniqueOrThrow({
    where: { id: tournamentId },
    include: {
      registrations: {
        orderBy: { chicecePlusMinus: "desc" },
      },
    },
  })

  if (tournament.chicecePhase !== "GROUP") throw new Error("Non in fase gironi")

  const top4 = tournament.registrations.slice(0, 4)
  if (top4.length < 4) throw new Error("Servono almeno 4 giocatori per la finale")

  const [p1, p2, p3, p4] = top4.map((r) => r.playerId)
  const { p1Partner, p2Partner, p3Partner, p4Partner } = draft

  // Validate partners are distinct and not among the top 4
  const top4Ids = new Set([p1, p2, p3, p4])
  const partnerIds = [p1Partner, p2Partner, p3Partner, p4Partner]
  for (const pid of partnerIds) {
    if (top4Ids.has(pid)) throw new Error("Un partner non può essere tra i top 4")
  }
  if (new Set(partnerIds).size !== 4) throw new Error("Ogni finalista deve avere un partner diverso")

  await db.$transaction(async (tx) => {
    // Semifinal 1: 1° + partner vs 4° + partner
    await tx.match.create({
      data: {
        tournamentId,
        round: 1,
        matchNumber: 1,
        bracketSection: "SEMI1",
        players: {
          create: [
            { playerId: p1, team: 0 },
            { playerId: p1Partner, team: 0 },
            { playerId: p4, team: 1 },
            { playerId: p4Partner, team: 1 },
          ],
        },
      },
    })

    // Semifinal 2: 2° + partner vs 3° + partner
    await tx.match.create({
      data: {
        tournamentId,
        round: 1,
        matchNumber: 2,
        bracketSection: "SEMI2",
        players: {
          create: [
            { playerId: p2, team: 0 },
            { playerId: p2Partner, team: 0 },
            { playerId: p3, team: 1 },
            { playerId: p3Partner, team: 1 },
          ],
        },
      },
    })

    // FINAL is not created here — it is auto-created when both semis complete
    await tx.tournament.update({
      where: { id: tournamentId },
      data: { chicecePhase: "FINAL" },
    })
  })

  revalidatePath(`/tournaments/${tournamentId}`)
}

export async function adminResetChiceceToGroupPhase(tournamentId: string) {
  const session = await getCurrentSession()
  const ok = await canManageTournament(session?.user?.email, tournamentId)
  if (!ok) throw new Error("Non autorizzato")

  const tournament = await db.tournament.findUniqueOrThrow({
    where: { id: tournamentId },
    select: { chicecePhase: true, type: true },
  })
  if (tournament.type !== "CHICECE") throw new Error("Non è un torneo Chicece")
  if (tournament.chicecePhase !== "FINAL") throw new Error("Il torneo non è in fase finale")

  // Block reset if any semi has already been played
  const completedSemi = await db.match.findFirst({
    where: { tournamentId, bracketSection: { in: ["SEMI", "SEMI1", "SEMI2"] }, isCompleted: true },
  })
  if (completedSemi) {
    throw new Error("Non puoi reimpostare dopo che una semifinale è già stata giocata")
  }

  // Delete all non-completed FINAL/SEMI matches
  const toDelete = await db.match.findMany({
    where: {
      tournamentId,
      bracketSection: { in: ["FINAL", "SEMI", "SEMI1", "SEMI2"] },
      isCompleted: false,
    },
    select: { id: true },
  })

  await db.$transaction(async (tx) => {
    if (toDelete.length > 0) {
      await tx.match.deleteMany({ where: { id: { in: toDelete.map((m) => m.id) } } })
    }
    await tx.tournament.update({
      where: { id: tournamentId },
      data: { chicecePhase: "GROUP" },
    })
  })

  revalidatePath(`/tournaments/${tournamentId}`)
}

export async function submitChiceceFinalScore(
  matchId: string,
  teamAScore: number,
  teamBScore: number,
) {
  const session = await getCurrentSession()
  if (teamAScore === teamBScore) throw new Error("Il risultato non può essere in parità")

  const match = await db.match.findUniqueOrThrow({
    where: { id: matchId },
    include: { players: true },
  })

  const ok = await canManageTournament(session?.user?.email, match.tournamentId)
  if (!ok) throw new Error("Non autorizzato")

  if (match.isCompleted) throw new Error("Partita già completata")
  const validSections = ["FINAL", "SEMI", "SEMI1", "SEMI2"]
  if (!validSections.includes(match.bracketSection)) {
    throw new Error("Non è una partita finale")
  }

  // ── Semifinal (new SEMI1/SEMI2 format) ──────────────────────────────────
  if (match.bracketSection === "SEMI1" || match.bracketSection === "SEMI2") {
    const otherSection = match.bracketSection === "SEMI1" ? "SEMI2" : "SEMI1"

    await db.$transaction(async (tx) => {
      await tx.match.update({
        where: { id: matchId },
        data: { teamAScore, teamBScore, isCompleted: true },
      })

      // Check if the other semi is already done
      const otherSemi = await tx.match.findFirst({
        where: { tournamentId: match.tournamentId, bracketSection: otherSection, isCompleted: true },
        include: { players: { select: { playerId: true, team: true } } },
      })

      if (otherSemi) {
        // Both semis done — derive winners and create FINAL
        const thisTeamAWon = teamAScore > teamBScore
        const thisWinners = match.players
          .filter((p) => p.team === (thisTeamAWon ? 0 : 1))
          .map((p) => p.playerId)

        const otherTeamAWon = (otherSemi.teamAScore ?? 0) > (otherSemi.teamBScore ?? 0)
        const otherWinners = otherSemi.players
          .filter((p) => p.team === (otherTeamAWon ? 0 : 1))
          .map((p) => p.playerId)

        // SEMI1 winners → team 0 in final, SEMI2 winners → team 1
        const [semi1Winners, semi2Winners] =
          match.bracketSection === "SEMI1"
            ? [thisWinners, otherWinners]
            : [otherWinners, thisWinners]

        await tx.match.create({
          data: {
            tournamentId: match.tournamentId,
            round: 2,
            matchNumber: 3,
            bracketSection: "FINAL",
            players: {
              create: [
                { playerId: semi1Winners[0], team: 0 },
                { playerId: semi1Winners[1], team: 0 },
                { playerId: semi2Winners[0], team: 1 },
                { playerId: semi2Winners[1], team: 1 },
              ],
            },
          },
        })

        // Notify finalists
        const allFinalistIds = [...semi1Winners, ...semi2Winners]
        import("@/lib/push").then(({ notifyPlayers }) =>
          notifyPlayers(allFinalistIds, {
            title: "🏆 La finale è pronta!",
            body: "Entrambe le semifinali sono finite. Si gioca la grande finale!",
            url: `/tournaments/${match.tournamentId}`,
          }),
        ).catch(() => {})
      }
    })

    revalidatePath(`/tournaments/${match.tournamentId}`)
    return
  }

  // ── Old-format SEMI (backward compat) ────────────────────────────────────
  if (match.bracketSection === "SEMI") {
    await db.match.update({
      where: { id: matchId },
      data: { teamAScore, teamBScore, isCompleted: true },
    })
    revalidatePath(`/tournaments/${match.tournamentId}`)
    return
  }

  // ── FINAL ────────────────────────────────────────────────────────────────
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

  // ── Placement bonuses (on top of Glicko) ───────────────────────────────
  // Tournament winner and finalists get a direct glickoRating boost because
  // Glicko alone rewards opponent quality but not the prestige of reaching the finals.
  const WINNER_BONUS = 200
  const RUNNER_UP_BONUS = 100
  const SEMIFINALIST_BONUS = 40

  const finalForBonus = await db.match.findFirst({
    where: { tournamentId: match.tournamentId, bracketSection: "FINAL", isCompleted: true },
    include: { players: { select: { playerId: true, team: true } } },
  })
  if (finalForBonus) {
    const teamAWon = (finalForBonus.teamAScore ?? 0) > (finalForBonus.teamBScore ?? 0)
    const winnerIds = finalForBonus.players.filter((p) => p.team === (teamAWon ? 0 : 1)).map((p) => p.playerId)
    const runnerUpIds = finalForBonus.players.filter((p) => p.team !== (teamAWon ? 0 : 1)).map((p) => p.playerId)
    await db.$transaction([
      db.player.updateMany({ where: { id: { in: winnerIds } }, data: { glickoRating: { increment: WINNER_BONUS } } }),
      db.player.updateMany({ where: { id: { in: runnerUpIds } }, data: { glickoRating: { increment: RUNNER_UP_BONUS } } }),
    ])
  }

  // Semi-finalists who didn't reach the final
  const semis = await db.match.findMany({
    where: { tournamentId: match.tournamentId, bracketSection: { in: ["SEMI1", "SEMI2"] }, isCompleted: true },
    include: { players: { select: { playerId: true, team: true } } },
  })
  const semiLoserIds: string[] = []
  for (const semi of semis) {
    const aWon = (semi.teamAScore ?? 0) > (semi.teamBScore ?? 0)
    semi.players.filter((p) => p.team === (aWon ? 1 : 0)).forEach((p) => semiLoserIds.push(p.playerId))
  }
  if (semiLoserIds.length > 0) {
    await db.player.updateMany({
      where: { id: { in: semiLoserIds } },
      data: { glickoRating: { increment: SEMIFINALIST_BONUS } },
    })
  }

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

  // Determine true winners from the FINAL match result
  const teamAWon = (teamAScore) > (teamBScore)
  const winnerPlayerIds = new Set(
    match.players.filter((p) => p.team === (teamAWon ? 0 : 1)).map((p) => p.playerId),
  )

  // Update career stats (same logic as completeTournament)
  for (let i = 0; i < regs.length; i++) {
    const wl = playerWL[regs[i].playerId] ?? { won: 0, lost: 0 }
    const isWinner = winnerPlayerIds.has(regs[i].playerId)
    await db.player.update({
      where: { id: regs[i].playerId },
      data: {
        matchesWon: { increment: wl.won },
        matchesLost: { increment: wl.lost },
        tournamentsWon: isWinner ? { increment: 1 } : undefined,
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

// ── Full system recalculation helpers ────────────────────────────────────────

const FRIENDLY_DAMPENING = 0.4
const WINNER_BONUS      = 200
const RUNNER_UP_BONUS   = 100
const SEMIFINALIST_BONUS = 40

/**
 * Replay a completed session: XP, sessionsPlayed, W/L stats, and dampened Glicko.
 * Reads current player ratings from DB so chronological ordering is preserved.
 */
async function _replaySession(sessionId: string) {
  const session = await db.session.findUnique({
    where: { id: sessionId },
    include: {
      participants: {
        include: {
          player: { select: { id: true, glickoRating: true, glickoRD: true, glickoVolatility: true } },
        },
      },
      sets: true,
    },
  })
  if (!session) return

  // XP + sessionsPlayed for every participant
  for (const p of session.participants) {
    const cur = await db.player.findUnique({ where: { id: p.playerId }, select: { xp: true } })
    if (!cur) continue
    const newXp = cur.xp + 10
    await db.player.update({
      where: { id: p.playerId },
      data: { sessionsPlayed: { increment: 1 }, xp: newXp, level: Math.max(1, Math.floor(newXp / 100) + 1) },
    })
  }

  // matchMode W/L from individual SessionMatch results
  if (session.matchMode) {
    const sessionMatches = await db.sessionMatch.findMany({
      where: { sessionId, isCompleted: true },
      include: { players: { select: { playerId: true, team: true } } },
    })
    for (const m of sessionMatches) {
      if (m.teamAScore == null || m.teamBScore == null || m.teamAScore === m.teamBScore) continue
      const aWon = m.teamAScore > m.teamBScore
      for (const mp of m.players) {
        const won = (mp.team === 0 && aWon) || (mp.team === 1 && !aWon)
        await db.player.update({
          where: { id: mp.playerId },
          data: { matchesWon: { increment: won ? 1 : 0 }, matchesLost: { increment: won ? 0 : 1 } },
        })
      }
    }
  }

  // Session sets W/L (non-matchMode sessions with results)
  if (!session.matchMode && session.sets.length > 0) {
    const aSetWins = session.sets.filter((s) => s.teamAScore > s.teamBScore).length
    const bSetWins = session.sets.filter((s) => s.teamBScore > s.teamAScore).length
    if (aSetWins !== bSetWins) {
      const winTeam = aSetWins > bSetWins ? 0 : 1
      for (const p of session.participants) {
        if (p.team === null) continue
        const won = p.team === winTeam
        await db.player.update({
          where: { id: p.playerId },
          data: { matchesWon: { increment: won ? 1 : 0 }, matchesLost: { increment: won ? 0 : 1 } },
        })
      }
    }
  }

  // Dampened Glicko update (same algorithm as updateGlickoAfterSession)
  if (session.sets.length > 0) {
    const aSetWins = session.sets.filter((s) => s.teamAScore > s.teamBScore).length
    const bSetWins = session.sets.filter((s) => s.teamBScore > s.teamAScore).length
    if (aSetWins !== bSetWins) {
      const winningTeam = aSetWins > bSetWins ? 0 : 1
      const assigned = session.participants.filter((p) => p.team !== null)
      if (assigned.length >= 2) {
        // Snapshot current ratings (read fresh from DB to reflect prior events)
        const freshPlayers = await db.player.findMany({
          where: { id: { in: assigned.map((p) => p.playerId) } },
          select: { id: true, glickoRating: true, glickoRD: true, glickoVolatility: true },
        })
        const snap = new Map(freshPlayers.map((p) => [p.id, p]))
        const teamA = assigned.filter((p) => p.team === 0)
        const teamB = assigned.filter((p) => p.team === 1)
        const updates: { id: string; rating: number; rd: number; volatility: number }[] = []

        for (const part of assigned) {
          const s = snap.get(part.playerId)
          if (!s) continue
          const won = part.team === winningTeam
          const score = 0.5 + FRIENDLY_DAMPENING * (won ? 0.5 : -0.5)
          const opponents = part.team === 0 ? teamB : teamA
          const results = opponents
            .map((opp) => snap.get(opp.playerId))
            .filter(Boolean)
            .map((opp) => ({ opponent: { rating: opp!.glickoRating, rd: opp!.glickoRD, volatility: opp!.glickoVolatility }, score }))
          if (results.length === 0) continue
          const updated = updateRating({ rating: s.glickoRating, rd: s.glickoRD, volatility: s.glickoVolatility }, results)
          updates.push({ id: part.playerId, ...updated })
        }

        for (const u of updates) {
          await db.player.update({ where: { id: u.id }, data: { glickoRating: u.rating, glickoRD: u.rd, glickoVolatility: u.volatility } })
          await db.ratingHistory.create({ data: { playerId: u.id, rating: u.rating, rd: u.rd, source: "session", sourceId: sessionId } })
        }
      }
    }
  }
}

/**
 * Replay a completed tournament: career stats from standings, Glicko,
 * and placement bonuses for Chicece (winner +200, runner-up +100, semis +40).
 */
async function _replayTournament(tournamentId: string, type: string) {
  const standings = await db.tournamentStanding.findMany({ where: { tournamentId } })

  // Determine CHICECE final winners (rank=1 in standings is group leader, not tournament winner)
  let chiceceWinnerIds: string[] = []
  let chiceceFinalMatch: { teamAScore: number | null; teamBScore: number | null; players: { playerId: string; team: number }[] } | null = null
  if (type === "CHICECE") {
    chiceceFinalMatch = await db.match.findFirst({
      where: { tournamentId, bracketSection: "FINAL", isCompleted: true },
      include: { players: { select: { playerId: true, team: true } } },
    })
    if (chiceceFinalMatch) {
      const aWon = (chiceceFinalMatch.teamAScore ?? 0) > (chiceceFinalMatch.teamBScore ?? 0)
      chiceceWinnerIds = chiceceFinalMatch.players
        .filter((p) => p.team === (aWon ? 0 : 1))
        .map((p) => p.playerId)
    }
  }

  // Career stats from standings
  for (const s of standings) {
    const isWinner = type === "CHICECE" ? chiceceWinnerIds.includes(s.playerId) : s.rank === 1
    await db.player.update({
      where: { id: s.playerId },
      data: {
        matchesWon:     { increment: s.matchesWon },
        matchesLost:    { increment: s.matchesLost },
        tournamentsWon: isWinner ? { increment: 1 } : undefined,
      },
    })
  }

  // Full Glicko update (no dampening) + ratingHistory
  await applyTournamentGlicko(tournamentId)

  // Placement bonuses for Chicece only
  if (type === "CHICECE" && chiceceFinalMatch) {
    const aWon = (chiceceFinalMatch.teamAScore ?? 0) > (chiceceFinalMatch.teamBScore ?? 0)
    const winnerIds    = chiceceFinalMatch.players.filter((p) => p.team === (aWon ? 0 : 1)).map((p) => p.playerId)
    const runnerUpIds  = chiceceFinalMatch.players.filter((p) => p.team !== (aWon ? 0 : 1)).map((p) => p.playerId)
    if (winnerIds.length)   await db.player.updateMany({ where: { id: { in: winnerIds } },   data: { glickoRating: { increment: WINNER_BONUS } } })
    if (runnerUpIds.length) await db.player.updateMany({ where: { id: { in: runnerUpIds } }, data: { glickoRating: { increment: RUNNER_UP_BONUS } } })

    const semis = await db.match.findMany({
      where: { tournamentId, bracketSection: { in: ["SEMI1", "SEMI2"] }, isCompleted: true },
      include: { players: { select: { playerId: true, team: true } } },
    })
    const semiLoserIds: string[] = []
    for (const semi of semis) {
      const sAWon = (semi.teamAScore ?? 0) > (semi.teamBScore ?? 0)
      semi.players.filter((p) => p.team === (sAWon ? 1 : 0)).forEach((p) => semiLoserIds.push(p.playerId))
    }
    if (semiLoserIds.length) await db.player.updateMany({ where: { id: { in: semiLoserIds } }, data: { glickoRating: { increment: SEMIFINALIST_BONUS } } })
  }
}

/**
 * Full recalculation of ALL player stats and Glicko ratings.
 * Processes every completed session and tournament in chronological order:
 *   - Sessions:    XP, W/L stats, dampened Glicko (FRIENDLY_DAMPENING=0.4)
 *   - Tournaments: W/L stats from standings, full Glicko, placement bonuses (Chicece)
 * winRatePct is recomputed for all players at the end.
 */
async function _fullRecalculation() {
  // Reset every player to zero/default
  await db.player.updateMany({
    data: {
      glickoRating: 1500, glickoRD: 350, glickoVolatility: 0.06,
      matchesWon: 0, matchesLost: 0, winRatePct: 0, tournamentsWon: 0,
      sessionsPlayed: 0, xp: 0, level: 1,
    },
  })
  // Clear rating history — will be recreated chronologically during replay
  await db.ratingHistory.deleteMany({})

  // Collect all events sorted chronologically
  const [completedSessions, completedTournaments] = await Promise.all([
    db.session.findMany({
      where: { status: "COMPLETED" },
      orderBy: { date: "asc" },
      select: { id: true, date: true },
    }),
    db.tournament.findMany({
      where: { status: "COMPLETED" },
      orderBy: { date: "asc" },
      select: { id: true, date: true, type: true },
    }),
  ])

  type TimedEvent =
    | { kind: "session";    id: string; date: Date }
    | { kind: "tournament"; id: string; date: Date; type: string }

  const events: TimedEvent[] = [
    ...completedSessions.map((s) => ({ kind: "session" as const, id: s.id, date: s.date })),
    ...completedTournaments.map((t) => ({ kind: "tournament" as const, id: t.id, date: t.date, type: t.type })),
  ].sort((a, b) => a.date.getTime() - b.date.getTime())

  for (const event of events) {
    if (event.kind === "session") {
      await _replaySession(event.id)
    } else {
      await _replayTournament(event.id, event.type)
    }
  }

  // Recompute winRatePct for every player
  const allPlayers = await db.player.findMany({ select: { id: true, matchesWon: true, matchesLost: true } })
  for (const p of allPlayers) {
    const total = p.matchesWon + p.matchesLost
    if (total > 0) {
      await db.player.update({
        where: { id: p.id },
        data: { winRatePct: Math.round((p.matchesWon / total) * 100) },
      })
    }
  }
}

/**
 * Internal helper: replay Glicko for all tournaments only (no session replay).
 * Used after deleting a completed tournament or resetting Chicece finals.
 * Now delegates to _fullRecalculation for consistency.
 */
async function fullGlickoRecalculation() {
  await _fullRecalculation()
}

/**
 * Admin-only: full reset and replay of ALL player stats (Glicko + career)
 * from every completed session and tournament in chronological order.
 */
export async function adminRecalculateAllStats() {
  await requireAdmin()
  await _fullRecalculation()
  revalidatePath("/players")
  revalidatePath("/profile")
  revalidatePath("/tournaments")
}


// ─── Admin: corregge tournamentsWon per un torneo Chicece già completato ─────

export async function adminFixChiceceTournamentWinners(tournamentId: string) {
  const session = await getCurrentSession()
  const ok = await canManageTournament(session?.user?.email, tournamentId)
  if (!ok) throw new Error("Non autorizzato")

  const finalMatch = await db.match.findFirst({
    where: { tournamentId, bracketSection: "FINAL", isCompleted: true },
    include: { players: true },
  })
  if (!finalMatch) throw new Error("Nessuna finale completata trovata")

  const teamAWon = (finalMatch.teamAScore ?? 0) > (finalMatch.teamBScore ?? 0)
  const winnerIds = finalMatch.players
    .filter((p) => p.team === (teamAWon ? 0 : 1))
    .map((p) => p.playerId)

  // All other registrations that were wrongly awarded
  const regs = await db.tournamentRegistration.findMany({
    where: { tournamentId },
    orderBy: { chicecePlusMinus: "desc" },
  })
  const wrongIds = regs.map((r) => r.playerId).filter((pid) => !winnerIds.includes(pid))

  // Use absolute values (idempotent — safe to run multiple times)
  await db.$transaction(async (tx) => {
    for (const pid of winnerIds) {
      await tx.player.update({ where: { id: pid }, data: { tournamentsWon: 1 } })
    }
    for (const pid of wrongIds) {
      await tx.player.update({ where: { id: pid }, data: { tournamentsWon: 0 } })
    }
  })

  revalidatePath(`/tournaments/${tournamentId}`)
  revalidatePath("/players")
}

// ─── Admin: rigenera i round Chicece non ancora completati ───────────────────

export async function adminRegenerateChiceceRounds(tournamentId: string) {
  const session = await getCurrentSession()
  const ok = await canManageTournament(session?.user?.email, tournamentId)
  if (!ok) throw new Error("Non autorizzato")

  const tournament = await db.tournament.findUniqueOrThrow({
    where: { id: tournamentId },
    select: { numCourts: true, chiceceMatchCount: true, status: true, type: true },
  })
  if (tournament.type !== "CHICECE") throw new Error("Non è un torneo Chicece")
  if (tournament.status !== "LIVE") throw new Error("Il torneo non è LIVE")

  const allMatches = await db.match.findMany({
    where: { tournamentId, bracketSection: "GROUP" },
    include: { players: { select: { playerId: true, team: true } } },
    orderBy: [{ round: "asc" }, { matchNumber: "asc" }],
  })

  const completedMatches = allMatches.filter((m) => m.isCompleted)
  const pendingMatchIds = allMatches.filter((m) => !m.isCompleted).map((m) => m.id)

  // Build used partnerships from completed matches
  const usedPartnerships = new Set<string>()
  for (const m of completedMatches) {
    const teamA = m.players.filter((p) => p.team === 0).map((p) => p.playerId)
    const teamB = m.players.filter((p) => p.team === 1).map((p) => p.playerId)
    if (teamA.length === 2) usedPartnerships.add([teamA[0], teamA[1]].sort().join("|"))
    if (teamB.length === 2) usedPartnerships.add([teamB[0], teamB[1]].sort().join("|"))
  }

  const completedRoundCount = new Set(completedMatches.map((m) => m.round)).size
  const roundsRemaining = tournament.chiceceMatchCount - completedRoundCount
  if (roundsRemaining <= 0) throw new Error("Tutti i round sono già stati completati")

  const registrations = await db.tournamentRegistration.findMany({
    where: { tournamentId },
    orderBy: { createdAt: "asc" },
    select: { playerId: true, skillLevel: true },
  })
  const players: _PlayerSkill[] = registrations.map((r) => ({ id: r.playerId, skill: r.skillLevel ?? 2 }))
  const n = players.length
  if (n % 4 !== 0) throw new Error(`Numero di giocatori non valido (${n})`)

  const numMatchesPerRound = n / 4
  const completedMatchCount = completedMatches.length
  const totalRounds = tournament.chiceceMatchCount
  const skillOf = (id: string) => players.find((p) => p.id === id)!.skill

  const activeUsed = new Set(usedPartnerships)
  const newRounds: Array<{ roundNumber: number; matches: Array<{ teamA: [string, string]; teamB: [string, string]; matchNumber: number; roundNumber: number; courtLabel: string }> }> = []

  for (let ri = 0; ri < roundsRemaining; ri++) {
    const roundNumber = completedRoundCount + ri + 1
    const pairs = generateSkillConstrainedPairs(players, activeUsed)

    for (const [a, b] of pairs) activeUsed.add([a, b].sort().join("|"))

    pairs.sort((a, b) => (skillOf(a[0]) + skillOf(a[1])) - (skillOf(b[0]) + skillOf(b[1])))

    const matches = Array.from({ length: numMatchesPerRound }, (_, mi) => {
      const matchNumber = completedMatchCount + ri * numMatchesPerRound + mi + 1
      return {
        teamA: pairs[2 * mi] as [string, string],
        teamB: pairs[2 * mi + 1] as [string, string],
        matchNumber,
        roundNumber,
        courtLabel: assignCourtLabel(roundNumber, matchNumber, totalRounds, tournament.numCourts),
      }
    })
    newRounds.push({ roundNumber, matches })
  }

  await db.$transaction(async (tx) => {
    if (pendingMatchIds.length > 0) {
      await tx.match.deleteMany({ where: { id: { in: pendingMatchIds } } })
    }

    const created = await tx.match.createManyAndReturn({
      data: newRounds.flatMap((round) =>
        round.matches.map((m) => ({
          tournamentId,
          round: m.roundNumber,
          matchNumber: m.matchNumber,
          bracketSection: "GROUP",
          courtLabel: m.courtLabel,
        })),
      ),
      select: { id: true, round: true, matchNumber: true },
    })

    const matchIdMap = new Map(created.map((m) => [`${m.round}-${m.matchNumber}`, m.id]))

    await tx.matchPlayer.createMany({
      data: newRounds.flatMap((round) =>
        round.matches.flatMap((match) => {
          const matchId = matchIdMap.get(`${match.roundNumber}-${match.matchNumber}`)!
          return [
            { matchId, playerId: match.teamA[0], team: 0 },
            { matchId, playerId: match.teamA[1], team: 0 },
            { matchId, playerId: match.teamB[0], team: 1 },
            { matchId, playerId: match.teamB[1], team: 1 },
          ]
        }),
      ),
    })
  })

  revalidatePath(`/tournaments/${tournamentId}`)
}

// ─── Admin: reimposta fase finale (anche torneo completato) ──────────────────
// Usata per correggere i risultati delle semifinali/finale dopo che sono già stati inseriti.
// Ripristina le statistiche di carriera, cancella SEMI/FINAL e ricalcola Glicko da zero.

export async function adminForceResetChiceceFinals(tournamentId: string) {
  await requireAdmin()

  const tournament = await db.tournament.findUniqueOrThrow({
    where: { id: tournamentId },
    select: { type: true },
  })
  if (tournament.type !== "CHICECE") throw new Error("Non è un torneo Chicece")

  // Read standings and final match before any modification
  const [standings, finalMatch] = await Promise.all([
    db.tournamentStanding.findMany({ where: { tournamentId } }),
    db.match.findFirst({
      where: { tournamentId, bracketSection: "FINAL", isCompleted: true },
      include: { players: { select: { playerId: true, team: true } } },
    }),
  ])

  // Determine final winners (to undo tournamentsWon)
  const winnerIds: string[] = []
  if (finalMatch) {
    const teamAWon = (finalMatch.teamAScore ?? 0) > (finalMatch.teamBScore ?? 0)
    finalMatch.players
      .filter((p) => p.team === (teamAWon ? 0 : 1))
      .forEach((p) => winnerIds.push(p.playerId))
  }

  await db.$transaction(async (tx) => {
    // 1. Revert career stats (matchesWon/matchesLost/tournamentsWon)
    for (const s of standings) {
      await tx.player.update({
        where: { id: s.playerId },
        data: {
          matchesWon: { decrement: s.matchesWon },
          matchesLost: { decrement: s.matchesLost },
          ...(winnerIds.includes(s.playerId) && { tournamentsWon: { decrement: 1 } }),
        },
      })
    }

    // 2. Delete all SEMI/FINAL matches (MatchPlayer cascades automatically)
    await tx.match.deleteMany({
      where: { tournamentId, bracketSection: { in: ["SEMI", "SEMI1", "SEMI2", "FINAL"] } },
    })

    // 3. Delete standings and ratingHistory for this tournament
    await tx.tournamentStanding.deleteMany({ where: { tournamentId } })
    await tx.ratingHistory.deleteMany({ where: { source: "tournament", sourceId: tournamentId } })

    // 4. Reset to LIVE + GROUP phase so draft UI reappears
    await tx.tournament.update({
      where: { id: tournamentId },
      data: { status: "LIVE", chicecePhase: "GROUP" },
    })
  })

  // Fix winRatePct for affected players after career stat changes
  for (const s of standings) {
    const player = await db.player.findUnique({ where: { id: s.playerId } })
    if (!player) continue
    const total = Math.max(0, player.matchesWon) + Math.max(0, player.matchesLost)
    await db.player.update({
      where: { id: s.playerId },
      data: { winRatePct: total === 0 ? 0 : Math.round((Math.max(0, player.matchesWon) / total) * 100) },
    })
  }

  // Full Glicko recalculation — this tournament is now LIVE so it's excluded from replay
  await fullGlickoRecalculation()

  revalidatePath(`/tournaments/${tournamentId}`)
  revalidatePath("/tournaments")
  revalidatePath("/players")
}

// ─── Chicece: scambia giocatori tra partite pendenti ─────────────────────────

export async function swapChiceceGroupMatchPlayers(
  tournamentId: string,
  matchAId: string,
  playerAId: string,
  matchBId: string,
  playerBId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const session = await getCurrentSession()
    const ok = await canManageTournament(session?.user?.email, tournamentId)
    if (!ok) throw new Error("Non autorizzato")

    if (matchAId === matchBId) throw new Error("I due giocatori devono essere in partite diverse")
    if (playerAId === playerBId) throw new Error("Seleziona due giocatori diversi")

    const [matchA, matchB] = await Promise.all([
      db.match.findUniqueOrThrow({ where: { id: matchAId }, select: { bracketSection: true, isCompleted: true, tournamentId: true } }),
      db.match.findUniqueOrThrow({ where: { id: matchBId }, select: { bracketSection: true, isCompleted: true, tournamentId: true } }),
    ])

    if (matchA.tournamentId !== tournamentId || matchB.tournamentId !== tournamentId) {
      throw new Error("Le partite non appartengono a questo torneo")
    }
    if (matchA.bracketSection !== "GROUP" || matchB.bracketSection !== "GROUP") {
      throw new Error("Solo le partite del girone possono essere modificate")
    }
    if (matchA.isCompleted || matchB.isCompleted) {
      throw new Error("Non puoi modificare una partita già completata")
    }

    const [mpA, mpB] = await Promise.all([
      db.matchPlayer.findFirstOrThrow({ where: { matchId: matchAId, playerId: playerAId } }),
      db.matchPlayer.findFirstOrThrow({ where: { matchId: matchBId, playerId: playerBId } }),
    ])

    await db.$transaction([
      db.matchPlayer.update({ where: { id: mpA.id }, data: { playerId: playerBId } }),
      db.matchPlayer.update({ where: { id: mpB.id }, data: { playerId: playerAId } }),
    ])

    revalidatePath(`/tournaments/${tournamentId}`)
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Errore sconosciuto" }
  }
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
