"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { getCurrentPlayer, getCurrentSession } from "@/lib/getCurrentPlayer"
import {
  CreateSessionSchema,
  RatePlayerSchema,
  AssignTeamSchema,
  SubmitSessionMatchScoreSchema,
} from "@/lib/validators/session.schema"
import { updateGlickoAfterSession } from "@/actions/rating"
import { isAdminEmail } from "@/lib/isAdmin"
import { generateKOTBSchedule, applyMatchResult, rankStandings } from "@/lib/tournament/kotb"
import type { StandingEntry } from "@/lib/tournament/types"
// ─── Push helpers (dynamic import — keeps web-push out of SSR bundle) ────────

type PushPayload = { title: string; body: string; url: string }

function safeNotifyPlayer(playerId: string, payload: PushPayload) {
  import("@/lib/push").then((m) => m.notifyPlayer(playerId, payload)).catch(() => {})
}

function safeNotifyPlayers(playerIds: string[], payload: PushPayload) {
  import("@/lib/push").then((m) => m.notifyPlayers(playerIds, payload)).catch(() => {})
}

// ─── Format helpers ────────────────────────────────────────────────────────

const FORMAT_MAX: Record<string, number> = {
  TWO_VS_TWO: 4,
  THREE_VS_THREE: 6,
  FOUR_VS_FOUR: 8,
}

function recomputeAvg(superVotes: number, topVotes: number, flopVotes: number) {
  const total = superVotes + topVotes + flopVotes
  return total === 0 ? 0 : Math.round((superVotes * 50 + topVotes * 30) / total)
}

function recomputeLevel(xp: number) {
  return Math.max(1, Math.floor(xp / 100) + 1)
}

// ─── Actions ──────────────────────────────────────────────────────────────

export async function createSession(input: unknown) {
  const player = await getCurrentPlayer()
  if (!player) throw new Error("Non autenticato")

  const data = CreateSessionSchema.parse(input)
  const maxPlayers = FORMAT_MAX[data.format]

  const session = await db.session.create({
    data: {
      organizerId: player.id,
      title: data.title,
      location: data.location,
      date: data.date,
      format: data.format,
      maxPlayers,
      courtCost: data.courtCost ?? null,
      notes: data.notes ?? null,
      paymentType: data.paymentType ?? "FREE",
      quotaAmount: data.paymentType === "QUOTA" ? (data.quotaAmount ?? null) : null,
      loserPays: data.paymentType === "LOSER_PAYS" ? (data.loserPays ?? null) : null,
      matchMode: data.format === "TWO_VS_TWO" ? (data.matchMode ?? false) : false,
    },
  })

  revalidatePath("/sessions")
  return session
}

export async function getSessions(playerId?: string) {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

  const include = {
    organizer: { select: { id: true, name: true } },
    _count: { select: { participants: true } },
  } as const

  const [openSessions, completedSessions] = await Promise.all([
    db.session.findMany({
      where: { status: { in: ["OPEN", "FULL"] } },
      include,
      orderBy: [{ status: "asc" }, { date: "asc" }],
    }),
    playerId
      ? db.session.findMany({
          where: {
            status: "COMPLETED",
            date: { gte: thirtyDaysAgo },
            participants: { some: { playerId } },
          },
          include,
          orderBy: { date: "desc" },
        })
      : Promise.resolve([] as Awaited<ReturnType<typeof db.session.findMany<{ include: typeof include }>>>),
  ])

  return [...openSessions, ...completedSessions]
}

export async function adminDeleteSession(id: string) {
  const authSession = await getCurrentSession()
  if (!isAdminEmail(authSession?.user?.email)) throw new Error("Non autorizzato")
  await db.session.delete({ where: { id } })
  revalidatePath("/sessions")
  revalidatePath("/profile")
}

export async function getSession(id: string) {
  return db.session.findUniqueOrThrow({
    where: { id },
    include: {
      organizer: { select: { id: true, name: true } },
      participants: {
        include: { player: { select: { id: true, name: true, preferredRole: true, level: true } } },
        orderBy: { team: "asc" },
      },
      ratings: { select: { raterId: true, ratedId: true, type: true } },
    },
  })
}

export async function joinSession(sessionId: string) {
  const player = await getCurrentPlayer()
  if (!player) throw new Error("Non autenticato")

  const session = await db.session.findUniqueOrThrow({
    where: { id: sessionId },
    include: { _count: { select: { participants: true } } },
  })

  if (session.status === "COMPLETED" || session.status === "CANCELLED") {
    throw new Error("La sessione non è aperta")
  }
  if (session._count.participants >= session.maxPlayers) {
    throw new Error("Sessione al completo")
  }

  await db.sessionParticipant.create({
    data: { sessionId, playerId: player.id },
  })

  // Flip to FULL if now at capacity
  const newCount = session._count.participants + 1
  if (newCount >= session.maxPlayers) {
    await db.session.update({ where: { id: sessionId }, data: { status: "FULL" } })
  }

  revalidatePath(`/sessions/${sessionId}`)
  revalidatePath("/sessions")
}

export async function leaveSession(sessionId: string) {
  const player = await getCurrentPlayer()
  if (!player) throw new Error("Non autenticato")

  await db.sessionParticipant.delete({
    where: { sessionId_playerId: { sessionId, playerId: player.id } },
  })

  // Re-open if was FULL
  const session = await db.session.findUnique({
    where: { id: sessionId },
    select: { status: true },
  })
  if (session?.status === "FULL") {
    await db.session.update({ where: { id: sessionId }, data: { status: "OPEN" } })
  }

  revalidatePath(`/sessions/${sessionId}`)
  revalidatePath("/sessions")
}

export async function assignTeam(input: unknown) {
  const player = await getCurrentPlayer()
  if (!player) throw new Error("Non autenticato")

  const data = AssignTeamSchema.parse(input)

  const session = await db.session.findUniqueOrThrow({
    where: { id: data.sessionId },
    select: { organizerId: true },
  })
  if (session.organizerId !== player.id) throw new Error("Solo l'organizzatore può assegnare le squadre")

  const participant = await db.sessionParticipant.update({
    where: { id: data.participantId },
    data: { team: data.team },
    include: {
      player: { select: { id: true, name: true } },
      session: { select: { title: true } },
    },
  })

  // Notify the assigned player (fire-and-forget)
  if (data.team !== null) {
    const teamLabel = data.team === 0 ? "Team A" : "Team B"
    safeNotifyPlayer(participant.player.id, {
      title: "Sei stato assegnato a una squadra!",
      body: `${participant.session.title} — ${teamLabel}. Preparati!`,
      url: `/sessions/${data.sessionId}`,
    })
  }

  revalidatePath(`/sessions/${data.sessionId}`)
}

export async function completeSession(
  sessionId: string,
  sets?: { teamAScore: number; teamBScore: number }[]
) {
  const player = await getCurrentPlayer()
  if (!player) throw new Error("Non autenticato")

  const session = await db.session.findUniqueOrThrow({
    where: { id: sessionId },
    include: { participants: { select: { playerId: true, team: true } } },
  })
  if (session.organizerId !== player.id) throw new Error("Solo l'organizzatore può completare la sessione")

  await db.session.update({ where: { id: sessionId }, data: { status: "COMPLETED" } })

  // Multi-match mode: aggregate win/loss from SessionMatch results
  if (session.matchMode) {
    const completedMatches = await db.sessionMatch.findMany({
      where: { sessionId, isCompleted: true },
      include: { players: { select: { playerId: true, team: true } } },
    })

    if (completedMatches.length > 0) {
      // Build initial standings for every participant
      let standings: StandingEntry[] = session.participants.map((p) => ({
        playerId: p.playerId,
        points: 0, matchesWon: 0, matchesLost: 0, pointsFor: 0, pointsAgainst: 0, rank: 0,
      }))

      for (const m of completedMatches) {
        if (m.teamAScore == null || m.teamBScore == null) continue
        const teamAIds = m.players.filter((p) => p.team === 0).map((p) => p.playerId)
        const teamBIds = m.players.filter((p) => p.team === 1).map((p) => p.playerId)
        standings = applyMatchResult(standings, {
          teamAPlayerIds: teamAIds,
          teamBPlayerIds: teamBIds,
          teamAScore: m.teamAScore,
          teamBScore: m.teamBScore,
        })
      }

      standings = rankStandings(standings)

      // Update each player's aggregate stats
      for (const s of standings) {
        const cur = await db.player.findUniqueOrThrow({
          where: { id: s.playerId },
          select: { matchesWon: true, matchesLost: true },
        })
        const newWon = cur.matchesWon + s.matchesWon
        const newLost = cur.matchesLost + s.matchesLost
        const total = newWon + newLost
        await db.player.update({
          where: { id: s.playerId },
          data: {
            matchesWon: newWon,
            matchesLost: newLost,
            winRatePct: total > 0 ? Math.round((newWon / total) * 100) : 0,
          },
        })
      }
    }
  }

  // Save sets if provided
  if (sets && sets.length > 0) {
    await db.sessionSet.createMany({
      data: sets.map((s, i) => ({
        sessionId,
        setNumber: i + 1,
        teamAScore: s.teamAScore,
        teamBScore: s.teamBScore,
      })),
    })

    // Determine winning team (most sets won)
    const teamAWins = sets.filter((s) => s.teamAScore > s.teamBScore).length
    const teamBWins = sets.filter((s) => s.teamBScore > s.teamAScore).length
    const winningTeam = teamAWins > teamBWins ? 0 : teamBWins > teamAWins ? 1 : null // null = draw

    // Update matchesWon / matchesLost for participants with assigned teams
    for (const p of session.participants) {
      if (p.team === null || winningTeam === null) continue
      const won = p.team === winningTeam
      const current = await db.player.findUniqueOrThrow({
        where: { id: p.playerId },
        select: { matchesWon: true, matchesLost: true },
      })
      const newWon = current.matchesWon + (won ? 1 : 0)
      const newLost = current.matchesLost + (won ? 0 : 1)
      const total = newWon + newLost
      await db.player.update({
        where: { id: p.playerId },
        data: {
          matchesWon: newWon,
          matchesLost: newLost,
          winRatePct: total > 0 ? Math.round((newWon / total) * 100) : 0,
        },
      })
    }
  }

  // Update Glicko-2 ratings (dampened for friendly sessions)
  try {
    await updateGlickoAfterSession(sessionId)
  } catch (e) {
    console.error("Glicko update failed for session", sessionId, e)
  }

  // Update sessionsPlayed + XP for every participant
  for (const p of session.participants) {
    const current = await db.player.findUniqueOrThrow({
      where: { id: p.playerId },
      select: { xp: true, sessionsPlayed: true },
    })
    const newXp = current.xp + 10
    await db.player.update({
      where: { id: p.playerId },
      data: {
        sessionsPlayed: { increment: 1 },
        xp: newXp,
        level: recomputeLevel(newXp),
      },
    })
  }

  // Notify all participants to rate each other (fire-and-forget)
  const playerIds = session.participants.map((p) => p.playerId)
  safeNotifyPlayers(playerIds, {
    title: "Partita finita! Vota i giocatori ⭐",
    body: `Come è andata in ${session.title}? Dai un voto ai tuoi compagni!`,
    url: `/sessions/${sessionId}`,
  })

  revalidatePath(`/sessions/${sessionId}`)
  revalidatePath("/sessions")
}

export async function addPlayerToSession(sessionId: string, playerId: string) {
  const organizer = await getCurrentPlayer()
  if (!organizer) throw new Error("Non autenticato")

  const session = await db.session.findUniqueOrThrow({
    where: { id: sessionId },
    select: {
      organizerId: true,
      status: true,
      maxPlayers: true,
      title: true,
      location: true,
      _count: { select: { participants: true } },
    },
  })

  if (session.organizerId !== organizer.id) {
    throw new Error("Solo l'organizzatore può aggiungere giocatori")
  }
  if (session.status === "COMPLETED" || session.status === "CANCELLED") {
    throw new Error("La sessione non è più aperta")
  }
  if (session._count.participants >= session.maxPlayers) {
    throw new Error("Sessione al completo")
  }

  await db.sessionParticipant.create({
    data: { sessionId, playerId },
  })

  const newCount = session._count.participants + 1
  if (newCount >= session.maxPlayers) {
    await db.session.update({ where: { id: sessionId }, data: { status: "FULL" } })
  }

  // Notify the added player
  safeNotifyPlayer(playerId, {
    title: "Sei stato aggiunto a una sessione!",
    body: `${session.title} — ${session.location}`,
    url: `/sessions/${sessionId}`,
  })

  revalidatePath(`/sessions/${sessionId}`)
  revalidatePath("/sessions")
}

export async function cancelSession(sessionId: string) {
  const player = await getCurrentPlayer()
  if (!player) throw new Error("Non autenticato")

  const session = await db.session.findUniqueOrThrow({
    where: { id: sessionId },
    select: { organizerId: true },
  })
  if (session.organizerId !== player.id) throw new Error("Solo l'organizzatore può cancellare la sessione")

  await db.session.update({ where: { id: sessionId }, data: { status: "CANCELLED" } })

  revalidatePath(`/sessions/${sessionId}`)
  revalidatePath("/sessions")
}

export async function ratePlayer(input: unknown) {
  const rater = await getCurrentPlayer()
  if (!rater) throw new Error("Non autenticato")

  const data = RatePlayerSchema.parse(input)
  if (data.ratedId === rater.id) throw new Error("Non puoi votare te stesso")

  // Verify both players participated in this session
  const [raterPart, ratedPart] = await Promise.all([
    db.sessionParticipant.findUnique({
      where: { sessionId_playerId: { sessionId: data.sessionId, playerId: rater.id } },
    }),
    db.sessionParticipant.findUnique({
      where: { sessionId_playerId: { sessionId: data.sessionId, playerId: data.ratedId } },
    }),
  ])
  if (!raterPart || !ratedPart) throw new Error("Partecipazione non trovata")

  // Upsert rating
  const existing = await db.playerRating.findUnique({
    where: { sessionId_raterId_ratedId: { sessionId: data.sessionId, raterId: rater.id, ratedId: data.ratedId } },
  })

  if (existing) {
    await db.playerRating.update({
      where: { id: existing.id },
      data: { type: data.type },
    })
  } else {
    await db.playerRating.create({
      data: { sessionId: data.sessionId, raterId: rater.id, ratedId: data.ratedId, type: data.type },
    })
  }

  // Recompute rated player's vote counts, avgRating, XP, level
  const allRatings = await db.playerRating.groupBy({
    by: ["type"],
    where: { ratedId: data.ratedId },
    _count: { type: true },
  })

  const counts = { SUPER: 0, TOP: 0, FLOP: 0 }
  for (const r of allRatings) counts[r.type] = r._count.type

  const ratedPlayer = await db.player.findUniqueOrThrow({
    where: { id: data.ratedId },
    select: { xp: true, superVotes: true },
  })

  // XP bonus only for new SUPER votes (not re-votes)
  const superDelta = counts.SUPER - ratedPlayer.superVotes
  const newXp = ratedPlayer.xp + (superDelta > 0 ? superDelta * 5 : 0)

  await db.player.update({
    where: { id: data.ratedId },
    data: {
      superVotes: counts.SUPER,
      topVotes: counts.TOP,
      flopVotes: counts.FLOP,
      avgRating: recomputeAvg(counts.SUPER, counts.TOP, counts.FLOP),
      xp: newXp,
      level: recomputeLevel(newXp),
    },
  })

  revalidatePath(`/sessions/${data.sessionId}`)
}

// ─── Multi-match mode actions ─────────────────────────────────────────────────

export async function generateSessionMatches(
  sessionId: string,
  requestedRounds?: number,
) {
  const player = await getCurrentPlayer()
  if (!player) throw new Error("Non autenticato")

  const session = await db.session.findUniqueOrThrow({
    where: { id: sessionId },
    include: {
      participants: { select: { playerId: true } },
      sessionMatches: { select: { id: true, isCompleted: true } },
    },
  })

  if (session.organizerId !== player.id) throw new Error("Solo l'organizzatore può generare le partite")
  if (!session.matchMode) throw new Error("Modalità multi-partita non attiva")
  if (session.status === "COMPLETED" || session.status === "CANCELLED") throw new Error("Sessione già chiusa")

  const hasScores = session.sessionMatches.some((m) => m.isCompleted)
  if (hasScores) throw new Error("Impossibile rigenerare: alcuni risultati già inseriti")

  const playerIds = session.participants.map((p) => p.playerId)
  if (playerIds.length < 4) throw new Error("Servono almeno 4 giocatori per generare le partite")

  const schedule = generateKOTBSchedule(playerIds, requestedRounds)

  const matchRows: { sessionId: string; round: number; matchNumber: number }[] = []
  const playerRows: { round: number; matchNumber: number; playerId: string; team: number }[] = []

  for (const round of schedule.rounds) {
    for (const match of round.matches) {
      matchRows.push({ sessionId, round: round.roundNumber, matchNumber: match.matchNumber })
      for (const pid of match.teamA) playerRows.push({ round: round.roundNumber, matchNumber: match.matchNumber, playerId: pid, team: 0 })
      for (const pid of match.teamB) playerRows.push({ round: round.roundNumber, matchNumber: match.matchNumber, playerId: pid, team: 1 })
    }
  }

  await db.$transaction(async (tx) => {
    await tx.sessionMatch.deleteMany({ where: { sessionId } })

    const created = await Promise.all(
      matchRows.map((r) =>
        tx.sessionMatch.create({ data: r, select: { id: true, round: true, matchNumber: true } })
      )
    )

    const idMap = new Map(created.map((m) => [`${m.round}:${m.matchNumber}`, m.id]))

    await tx.sessionMatchPlayer.createMany({
      data: playerRows.map((r) => ({
        matchId: idMap.get(`${r.round}:${r.matchNumber}`)!,
        playerId: r.playerId,
        team: r.team,
      })),
    })
  })

  revalidatePath(`/sessions/${sessionId}`)
}

export async function submitSessionMatchScore(input: unknown) {
  const player = await getCurrentPlayer()
  if (!player) throw new Error("Non autenticato")

  const { matchId, teamAScore, teamBScore } = SubmitSessionMatchScoreSchema.parse(input)

  const match = await db.sessionMatch.findUniqueOrThrow({
    where: { id: matchId },
    include: {
      session: { select: { organizerId: true, title: true } },
      players: { select: { playerId: true, team: true } },
    },
  })

  if (match.session.organizerId !== player.id) throw new Error("Solo l'organizzatore può inviare i risultati")

  await db.sessionMatch.update({
    where: { id: matchId },
    data: { teamAScore, teamBScore, isCompleted: true },
  })

  // Notify all players in this match
  const winningTeam = teamAScore > teamBScore ? 0 : teamBScore > teamAScore ? 1 : null
  const matchPlayerIds = match.players.map((p) => p.playerId)
  safeNotifyPlayers(matchPlayerIds, {
    title: winningTeam === null
      ? `Pareggio! ${teamAScore} - ${teamBScore}`
      : `Risultato: ${teamAScore} - ${teamBScore}`,
    body: `Partita completata in ${match.session.title}`,
    url: `/sessions/${match.sessionId}`,
  })

  revalidatePath(`/sessions/${match.sessionId}`)
}
