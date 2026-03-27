"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { getCurrentPlayer } from "@/lib/getCurrentPlayer"
import {
  CreateSessionSchema,
  RatePlayerSchema,
  AssignTeamSchema,
} from "@/lib/validators/session.schema"
import { notifyPlayer, notifyPlayers } from "@/lib/push"

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
    },
  })

  revalidatePath("/sessions")
  return session
}

export async function getSessions() {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

  return db.session.findMany({
    where: {
      OR: [
        { status: { in: ["OPEN", "FULL"] } },
        { status: "COMPLETED", date: { gte: thirtyDaysAgo } },
      ],
    },
    include: {
      organizer: { select: { id: true, name: true } },
      _count: { select: { participants: true } },
    },
    orderBy: [{ status: "asc" }, { date: "asc" }],
  })
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
    notifyPlayer(participant.player.id, {
      title: "Sei stato assegnato a una squadra!",
      body: `${participant.session.title} — ${teamLabel}. Preparati!`,
      url: `/sessions/${data.sessionId}`,
    }).catch(() => {})
  }

  revalidatePath(`/sessions/${data.sessionId}`)
}

export async function completeSession(sessionId: string) {
  const player = await getCurrentPlayer()
  if (!player) throw new Error("Non autenticato")

  const session = await db.session.findUniqueOrThrow({
    where: { id: sessionId },
    include: { participants: { select: { playerId: true } } },
  })
  if (session.organizerId !== player.id) throw new Error("Solo l'organizzatore può completare la sessione")

  await db.session.update({ where: { id: sessionId }, data: { status: "COMPLETED" } })

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
  notifyPlayers(playerIds, {
    title: "Partita finita! Vota i giocatori ⭐",
    body: `Come è andata in ${session.title}? Dai un voto ai tuoi compagni!`,
    url: `/sessions/${sessionId}`,
  }).catch(() => {})

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

export async function getSessionsForPlayer(playerId: string) {
  return db.sessionParticipant.findMany({
    where: { playerId },
    include: {
      session: {
        select: {
          id: true,
          title: true,
          date: true,
          location: true,
          status: true,
          format: true,
        },
      },
    },
    orderBy: { session: { date: "desc" } },
    take: 10,
  })
}
