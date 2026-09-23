"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { getCurrentPlayer, getCurrentSession } from "@/lib/getCurrentPlayer"
import {
  CreateSessionSchema,
  EditSessionSchema,
  AssignTeamSchema,
  SubmitSessionMatchScoreSchema,
  CompleteSessionSchema,
  LiveScoreSchema,
} from "@/lib/validators/session.schema"
import { updateGlickoAfterSession } from "@/lib/rating"
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

function recomputeLevel(xp: number) {
  return Math.max(1, Math.floor(xp / 100) + 1)
}

// ─── Actions ──────────────────────────────────────────────────────────────

export async function createSession(input: unknown) {
  const player = await getCurrentPlayer()
  if (!player) throw new Error("Non autenticato")

  const data = CreateSessionSchema.parse(input)
  const maxPlayers = FORMAT_MAX[data.format]

  const FORMAT_LABEL: Record<string, string> = {
    TWO_VS_TWO: "2v2",
    THREE_VS_THREE: "3v3",
    FOUR_VS_FOUR: "4v4",
  }
  const autoTitle = data.title?.trim() ||
    (data.location ? `${FORMAT_LABEL[data.format]} — ${data.location}` : FORMAT_LABEL[data.format])

  const session = await db.session.create({
    data: {
      organizerId: player.id,
      title: autoTitle,
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
    },
  })
}

// ── Live scoreboard: auto-save + resume + multi-device sync ──────────────────
async function isSessionMember(sessionId: string, playerId: string): Promise<boolean> {
  const s = await db.session.findUnique({
    where: { id: sessionId },
    select: { organizerId: true, participants: { select: { playerId: true } } },
  })
  if (!s) return false
  return s.organizerId === playerId || s.participants.some((p) => p.playerId === playerId)
}

// Persist the in-progress scoreboard state (called after each point, debounced client-side).
export async function saveLiveScore(sessionId: string, state: unknown) {
  const player = await getCurrentPlayer()
  if (!player) throw new Error("Non autenticato")
  // Validate the shape, not just "is an object": this row is served to every
  // polling device, so an arbitrary payload would bloat the row and break the
  // board that hydrates from it.
  const parsed = LiveScoreSchema.safeParse(state)
  if (!parsed.success) throw new Error("Stato del tabellone non valido")
  if (!(await isSessionMember(sessionId, player.id))) throw new Error("Non fai parte di questa partita")
  await db.session.update({ where: { id: sessionId }, data: { liveScore: parsed.data } })
  return { ok: true }
}

// Read the current scoreboard state (for resume on load + polling sync between devices).
// Returns null on anything that no longer matches the expected shape, so an old or
// corrupted row can never crash the board.
export async function getLiveScore(sessionId: string) {
  const player = await getCurrentPlayer()
  if (!player) return null
  if (!(await isSessionMember(sessionId, player.id))) return null
  const s = await db.session.findUnique({ where: { id: sessionId }, select: { liveScore: true } })
  if (!s?.liveScore) return null
  const parsed = LiveScoreSchema.safeParse(s.liveScore)
  return parsed.success ? parsed.data : null
}

export async function joinSession(sessionId: string) {
  const player = await getCurrentPlayer()
  if (!player) throw new Error("Non autenticato")

  // One serialisable transaction around capacity check + payment + seat:
  // previously the count was read before the insert, so two joins landing at
  // once could both pass and overflow maxPlayers, and credits were debited
  // before the insert, so a failed insert lost them with no rollback.
  try {
    await db.$transaction(
      async (tx) => {
        const session = await tx.session.findUniqueOrThrow({
          where: { id: sessionId },
          include: { _count: { select: { participants: true } } },
        })

        if (session.status === "COMPLETED" || session.status === "CANCELLED") {
          throw new Error("La sessione non è aperta")
        }
        if (session._count.participants >= session.maxPlayers) {
          throw new Error("Sessione al completo")
        }

        const scCost = session.paymentType === "SC" ? (session.quotaAmount ?? 0) : 0

        if (scCost > 0) {
          const paid = await tx.player.updateMany({
            where: { id: player.id, sanderCredits: { gte: scCost } },
            data: { sanderCredits: { decrement: scCost } },
          })
          if (paid.count === 0) {
            const bal = await tx.player.findUnique({
              where: { id: player.id },
              select: { sanderCredits: true },
            })
            throw new Error(
              `Crediti insufficienti. Ti servono ${scCost} SC (ne hai ${bal?.sanderCredits ?? 0}).`,
            )
          }
        }

        // Record what was actually paid so leaving refunds exactly this amount.
        await tx.sessionParticipant.create({
          data: { sessionId, playerId: player.id, paidCredits: scCost },
        })

        // Flip to FULL if now at capacity
        if (session._count.participants + 1 >= session.maxPlayers) {
          await tx.session.update({ where: { id: sessionId }, data: { status: "FULL" } })
        }
      },
      { isolationLevel: "Serializable" },
    )
  } catch (e) {
    // P2034 = write conflict / deadlock: someone took the last seat at the very
    // same moment. Surface something actionable instead of a database error.
    if (e && typeof e === "object" && "code" in e && e.code === "P2034") {
      throw new Error("Posto appena occupato, riprova.")
    }
    throw e
  }

  revalidatePath(`/sessions/${sessionId}`)
  revalidatePath("/sessions")
}

export async function editSession(input: unknown): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const data = EditSessionSchema.parse(input)
    const player = await getCurrentPlayer()
    if (!player) return { ok: false, error: "Non autenticato" }

    const session = await db.session.findUniqueOrThrow({
      where: { id: data.sessionId },
      select: { organizerId: true, status: true, _count: { select: { participants: true } } },
    })
    if (session.organizerId !== player.id) {
      return { ok: false, error: "Solo l'organizzatore può modificare la partita." }
    }
    if (session.status === "COMPLETED" || session.status === "CANCELLED") {
      return { ok: false, error: "Questa partita non è più modificabile." }
    }
    // Don't shrink capacity below the players already in.
    const maxPlayers =
      data.maxPlayers && data.maxPlayers >= session._count.participants ? data.maxPlayers : undefined

    await db.session.update({
      where: { id: data.sessionId },
      data: {
        ...(data.title !== undefined ? { title: data.title } : {}),
        location: data.location,
        date: data.date,
        notes: data.notes ?? null,
        ...(maxPlayers ? { maxPlayers } : {}),
      },
    })

    revalidatePath(`/sessions/${data.sessionId}`)
    revalidatePath("/sessions")
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Errore" }
  }
}

export async function leaveSession(sessionId: string) {
  const player = await getCurrentPlayer()
  if (!player) throw new Error("Non autenticato")

  let wasFull = false

  await db.$transaction(async (tx) => {
    // Delete and read back the amount actually paid in one atomic step: the
    // delete throws if the row is already gone, so a double leave cannot refund
    // twice.
    const participant = await tx.sessionParticipant.delete({
      where: { sessionId_playerId: { sessionId, playerId: player.id } },
      select: { paidCredits: true },
    })

    const session = await tx.session.findUnique({
      where: { id: sessionId },
      select: { status: true },
    })
    wasFull = session?.status === "FULL"

    // Refund exactly what this player paid — never a flat quota, or anyone the
    // organiser added for free could farm credits by joining and leaving.
    if (participant.paidCredits > 0 && session?.status !== "COMPLETED") {
      await tx.player.update({
        where: { id: player.id },
        data: { sanderCredits: { increment: participant.paidCredits } },
      })
    }

    // Re-open if was FULL
    if (wasFull) {
      await tx.session.update({ where: { id: sessionId }, data: { status: "OPEN" } })
    }
  })

  revalidatePath(`/sessions/${sessionId}`)
  revalidatePath("/sessions")
}

export async function createRematch(sessionId: string): Promise<string> {
  const player = await getCurrentPlayer()
  if (!player) throw new Error("Non autenticato")

  const original = await db.session.findUniqueOrThrow({
    where: { id: sessionId },
    include: {
      participants: { select: { playerId: true, team: true } },
    },
  })

  if (original.status !== "COMPLETED") throw new Error("La sessione non è completata")

  const isParticipant = original.participants.some((p) => p.playerId === player.id)
  if (!isParticipant) throw new Error("Non sei partecipante di questa sessione")

  // Schedule rematch for the next day at the same time
  const rematchDate = new Date(original.date)
  rematchDate.setDate(rematchDate.getDate() + 1)

  const newSession = await db.session.create({
    data: {
      organizerId: player.id,
      title: original.title,
      location: original.location,
      date: rematchDate,
      format: original.format,
      maxPlayers: original.maxPlayers,
      courtCost: original.courtCost,
      notes: original.notes,
      paymentType: original.paymentType,
      quotaAmount: original.quotaAmount,
      loserPays: original.loserPays,
      matchMode: original.matchMode,
      participants: {
        create: original.participants.map((p) => ({
          playerId: p.playerId,
          team: p.team === 0 ? 1 : p.team === 1 ? 0 : null,
        })),
      },
    },
  })

  revalidatePath("/sessions")
  return newSession.id
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

  // Notify the assigned player (fire-and-forget) — skip guests
  if (data.team !== null && participant.player) {
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
  // Validate for its side effect: the schema is non-transforming, so the
  // parameters below stay usable as-is once this call has not thrown.
  CompleteSessionSchema.parse({ sessionId, sets })

  const player = await getCurrentPlayer()
  if (!player) throw new Error("Non autenticato")

  const session = await db.session.findUniqueOrThrow({
    where: { id: sessionId },
    include: { participants: { select: { playerId: true, team: true } } },
  })
  // Chi gioca può chiudere la partita, non solo l'organizzatore (beach volley reale).
  const isParticipant = session.participants.some((p) => p.playerId === player.id)
  if (session.organizerId !== player.id && !isParticipant) {
    throw new Error("Solo chi partecipa può completare la partita")
  }

  // Idempotency guard: claim the session atomically. A double tap, a retry, or a
  // second participant closing the same match must not re-apply sets, career
  // stats, XP and rating deltas — only the call that flips the status proceeds.
  const claimed = await db.session.updateMany({
    where: { id: sessionId, status: { not: "COMPLETED" } },
    data: { status: "COMPLETED" },
  })
  if (claimed.count === 0) {
    revalidatePath(`/sessions/${sessionId}`)
    return
  }

  // Multi-match mode: aggregate win/loss from SessionMatch results
  if (session.matchMode) {
    const completedMatches = await db.sessionMatch.findMany({
      where: { sessionId, isCompleted: true },
      include: { players: { select: { playerId: true, team: true } } },
    })

    if (completedMatches.length > 0) {
      // Build initial standings for every participant (skip guests)
      let standings: StandingEntry[] = session.participants
        .filter(p => p.playerId !== null)
        .map((p) => ({
          playerId: p.playerId!,
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
      if (!p.playerId) continue  // skip guests
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

  // Update sessionsPlayed + XP for every participant (skip guests)
  for (const p of session.participants) {
    if (!p.playerId) continue  // skip guests
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

export async function addGuestToSession(sessionId: string, guestName: string) {
  const player = await getCurrentPlayer()
  if (!player) throw new Error("Non autenticato")
  const trimmed = guestName.trim()
  if (!trimmed) throw new Error("Nome ospite non valido")

  const session = await db.session.findUniqueOrThrow({
    where: { id: sessionId },
    select: { organizerId: true, maxPlayers: true, _count: { select: { participants: true } } },
  })
  if (session.organizerId !== player.id) throw new Error("Solo l'organizzatore può aggiungere ospiti")
  if (session._count.participants >= session.maxPlayers) throw new Error("Sessione al completo")

  await db.sessionParticipant.create({
    data: { sessionId, guestName: trimmed },
  })
  revalidatePath(`/sessions/${sessionId}`)
  return { ok: true as const }
}

export async function removeGuestFromSession(participantId: string) {
  const player = await getCurrentPlayer()
  if (!player) throw new Error("Non autenticato")

  const participant = await db.sessionParticipant.findUniqueOrThrow({
    where: { id: participantId },
    include: { session: { select: { organizerId: true, id: true } } },
  })
  if (participant.session.organizerId !== player.id) throw new Error("Solo l'organizzatore può rimuovere ospiti")
  if (participant.playerId !== null) throw new Error("Usa l'azione di rimozione normale per i giocatori")

  await db.sessionParticipant.delete({ where: { id: participantId } })
  revalidatePath(`/sessions/${participant.session.id}`)
  return { ok: true as const }
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

  const playerIds = session.participants
    .filter(p => p.playerId !== null)
    .map((p) => p.playerId!)
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
