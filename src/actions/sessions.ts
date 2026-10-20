"use server"

import { revalidatePath, revalidateTag } from "next/cache"
import { LEADERBOARDS_TAG } from "@/lib/cacheTags"
import { db } from "@/lib/db"
import { getCurrentPlayer, getCurrentSession } from "@/lib/getCurrentPlayer"
import {
  CreateSessionSchema,
  EditSessionSchema,
  AssignTeamSchema,
  SubmitSessionMatchScoreSchema,
  CompleteSessionSchema,
  LiveScoreSchema,
  QuickJoinSchema,
  AddPlayerToSessionSchema,
  AddGuestSchema,
  SessionIdSchema,
} from "@/lib/validators/session.schema"
import {
  sessionDateError,
  joinWindowOpen,
  completionError,
  countsForProgress,
  isActiveStatus,
  JOIN_GRACE_MS,
} from "@/lib/sessionRules"
import { isLateCancel } from "@/lib/scopri/reliability"
import { rateDuoMatch } from "@/lib/scopri/duos"
import { rewardInvitesAfterMatch } from "@/lib/referralRedeem"
import { refundSessionCredits } from "@/lib/sessionRefunds"
import { updateGlickoAfterSession } from "@/lib/rating"
import { isAdminEmail } from "@/lib/isAdmin"
import { generateKOTBSchedule, applyMatchResult, rankStandings } from "@/lib/tournament/kotb"
import type { StandingEntry } from "@/lib/tournament/types"
import { after } from "next/server"
import { nudgeForSession } from "@/lib/nudges"
import { creditCost } from "@/lib/joinPrice"
// ─── Push helpers (dynamic import — keeps web-push out of SSR bundle) ────────

type PushPayload = { title: string; body: string; url: string }

function safeNotifyPlayer(playerId: string, payload: PushPayload) {
  import("@/lib/push").then((m) => m.notifyPlayer(playerId, payload)).catch(() => {})
}

function safeNotifyPlayers(playerIds: string[], payload: PushPayload) {
  import("@/lib/push").then((m) => m.notifyPlayers(playerIds, payload)).catch(() => {})
}

/**
 * Awaited variant. The helpers above are fire-and-forget, which on serverless
 * can be cut short when the invocation ends — the push and its Notification row
 * then land only sometimes. Use this wherever the notification IS the feature.
 */
async function notifyPlayerNow(playerId: string, payload: PushPayload) {
  try {
    const m = await import("@/lib/push")
    await m.notifyPlayer(playerId, payload)
  } catch {
    // A failed push must never fail the action that triggered it.
  }
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
  const dateError = sessionDateError(data.date)
  if (dateError) throw new Error(dateError)
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
      city: data.city ?? null,
      date: data.date,
      format: data.format,
      maxPlayers,
      courtCost: data.courtCost ?? null,
      notes: data.notes ?? null,
      paymentType: data.paymentType ?? "FREE",
      // SC matches charge quotaAmount credits on join: dropping it here made
      // every credits match free.
      quotaAmount: data.paymentType === "QUOTA" || data.paymentType === "SC" ? (data.quotaAmount ?? null) : null,
      loserPays: data.paymentType === "LOSER_PAYS" ? (data.loserPays ?? null) : null,
      matchMode: data.format === "TWO_VS_TWO" ? (data.matchMode ?? false) : false,
    },
  })

  // Tell nearby free players about it once the response is sent. Only for the
  // coming week: a match a month out is noise today.
  if (session.date.getTime() - Date.now() < 7 * 24 * 3600_000) {
    after(() => nudgeForSession(session.id, "new").catch(() => {}))
  }

  revalidatePath("/sessions")
  return session
}

export async function getSessions(playerId?: string) {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

  const include = {
    organizer: { select: { id: true, name: true } },
    _count: { select: { participants: true } },
    // Faces for the seat circles on the card (8 = largest format).
    participants: {
      take: 8,
      select: { guestName: true, player: { select: { name: true, avatarUrl: true } } },
    },
  } as const

  // Matches whose time has passed stay listed only for the people in them (to
  // close them with the score); everyone else sees only what they can still join.
  const publicFrom = new Date(Date.now() - JOIN_GRACE_MS)
  const [openSessions, completedSessions] = await Promise.all([
    db.session.findMany({
      where: {
        status: { in: ["OPEN", "FULL"] },
        OR: [
          { date: { gte: publicFrom } },
          ...(playerId ? [{ organizerId: playerId }, { participants: { some: { playerId } } }] : []),
        ],
      },
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
  SessionIdSchema.parse(id)
  // Give back what players paid before the cascade deletes their seats.
  await db.$transaction(async (tx) => {
    const s = await tx.session.findUnique({ where: { id }, select: { status: true } })
    if (s && s.status !== "COMPLETED") await refundSessionCredits(tx, id)
    await tx.session.delete({ where: { id } })
  })
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
        if (!joinWindowOpen(session.date)) {
          throw new Error("Questa partita è già iniziata")
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

        // Got in, so drop out of the queue for this match.
        await tx.sessionWaitlist.deleteMany({
          where: { sessionId, playerId: player.id },
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

/** The home says "partita" and offers the waitlist on the match page. */
const QUICK_JOIN_WORDING: Record<string, string> = {
  "Sessione al completo": "Partita al completo: aprila per metterti in lista",
  "La sessione non è aperta": "Questa partita non è più aperta",
}

/**
 * One tap on a free seat from the home. Same rules as joinSession, but the
 * expected failures come back as values (thrown messages are hidden in
 * production builds) and the home refreshes, so the match moves up to "La tua
 * prossima partita". Seats paid in credits are not taken from here: the
 * balance has to be checked on the match page first. (Euro paid on the sand
 * is shown on the home card, next to the button.)
 */
export async function quickJoinSession(
  input: unknown,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const parsed = QuickJoinSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: "Partita non valida" }
  const { sessionId } = parsed.data
  try {
    const session = await db.session.findUnique({
      where: { id: sessionId },
      select: { paymentType: true, quotaAmount: true, courtCost: true, maxPlayers: true },
    })
    if (!session) return { ok: false, error: "Partita non trovata" }
    if (creditCost(session) > 0) {
      return { ok: false, error: "Questa partita si paga in crediti: aprila per entrare" }
    }
    await joinSession(sessionId)
  } catch (e) {
    if (e && typeof e === "object" && "code" in e && e.code === "P2002") {
      return { ok: false, error: "Sei già in questa partita" }
    }
    // joinSession's own messages are plain Errors written for people; anything
    // else (database, network) gets a generic line instead of its internals.
    const forPeople = e instanceof Error && e.constructor === Error
    const message = forPeople ? e.message : "Non sei riuscito a entrare, riprova"
    return { ok: false, error: QUICK_JOIN_WORDING[message] ?? message }
  }
  revalidatePath("/")
  return { ok: true }
}

export async function editSession(input: unknown): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const data = EditSessionSchema.parse(input)
    const player = await getCurrentPlayer()
    if (!player) return { ok: false, error: "Non autenticato" }

    const session = await db.session.findUniqueOrThrow({
      where: { id: data.sessionId },
      select: { organizerId: true, status: true, date: true, _count: { select: { participants: true } } },
    })
    if (session.organizerId !== player.id) {
      return { ok: false, error: "Solo l'organizzatore può modificare la partita." }
    }
    if (session.status === "COMPLETED" || session.status === "CANCELLED") {
      return { ok: false, error: "Questa partita non è più modificabile." }
    }
    if (data.date.getTime() !== session.date.getTime()) {
      const dateError = sessionDateError(data.date)
      if (dateError) return { ok: false, error: dateError }
    }
    // Don't shrink capacity below the players already in.
    const maxPlayers =
      data.maxPlayers && data.maxPlayers >= session._count.participants ? data.maxPlayers : undefined

    await db.session.update({
      where: { id: data.sessionId },
      data: {
        ...(data.title !== undefined ? { title: data.title } : {}),
        location: data.location,
        ...(data.city !== undefined ? { city: data.city } : {}),
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

/* ── Waitlist on a full session ───────────────────────────────────────────── */

export async function joinWaitlist(sessionId: string): Promise<{ ok: true; position: number } | { ok: false; error: string }> {
  const player = await getCurrentPlayer()
  if (!player) return { ok: false, error: "Non autenticato" }

  const session = await db.session.findUnique({
    where: { id: sessionId },
    select: { status: true, date: true, participants: { select: { playerId: true } } },
  })
  if (!session) return { ok: false, error: "Partita non trovata" }
  if (session.status === "COMPLETED" || session.status === "CANCELLED" || !joinWindowOpen(session.date)) {
    return { ok: false, error: "Questa partita non è più attiva" }
  }
  if (session.participants.some((p) => p.playerId === player.id)) {
    return { ok: false, error: "Sei già in questa partita" }
  }

  try {
    await db.sessionWaitlist.create({ data: { sessionId, playerId: player.id } })
  } catch {
    // Unique constraint: already queued. Treat as success and just report where.
  }

  const position = await waitlistPosition(sessionId, player.id)
  revalidatePath(`/sessions/${sessionId}`)
  return { ok: true, position }
}

export async function leaveWaitlist(sessionId: string): Promise<{ ok: true }> {
  const player = await getCurrentPlayer()
  if (!player) throw new Error("Non autenticato")
  await db.sessionWaitlist.deleteMany({ where: { sessionId, playerId: player.id } })
  revalidatePath(`/sessions/${sessionId}`)
  return { ok: true }
}

async function waitlistPosition(sessionId: string, playerId: string): Promise<number> {
  const queue = await db.sessionWaitlist.findMany({
    where: { sessionId },
    orderBy: { createdAt: "asc" },
    select: { playerId: true },
  })
  return queue.findIndex((q) => q.playerId === playerId) + 1
}

/** Queue state for the current user, for the session detail page. */
export async function getWaitlistInfo(sessionId: string): Promise<{ count: number; myPosition: number | null }> {
  const player = await getCurrentPlayer()
  const queue = await db.sessionWaitlist.findMany({
    where: { sessionId },
    orderBy: { createdAt: "asc" },
    select: { playerId: true },
  })
  const idx = player ? queue.findIndex((q) => q.playerId === player.id) : -1
  return { count: queue.length, myPosition: idx >= 0 ? idx + 1 : null }
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
      select: { status: true, date: true },
    })
    wasFull = session?.status === "FULL"
    // Leaving in the last hours leaves the others short: it counts against
    // your attendance on Scopri (lib/scopri/reliability).
    if (session && isActiveStatus(session.status) && isLateCancel(session.date)) {
      await tx.attendanceEvent.create({ data: { playerId: player.id, sessionId, kind: "LATE_CANCEL" } })
    }

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

  // A seat just freed up: tell whoever has been waiting longest. Done after the
  // transaction so we never notify about a rollback, and awaited so the push
  // isn't dropped when the serverless invocation ends.
  if (wasFull) {
    // Tell whoever has queued longest, or nearby free players if nobody queued.
    await notifyWaitlistHead(sessionId)
  } else {
    after(() => nudgeForSession(sessionId, "freed").catch(() => {}))
  }

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

  // Schedule rematch for the next day at the same time (or tomorrow at that
  // time if the original is older than a day).
  const rematchDate = new Date(original.date)
  rematchDate.setDate(rematchDate.getDate() + 1)
  while (rematchDate.getTime() < Date.now()) rematchDate.setDate(rematchDate.getDate() + 1)

  // A credits match must be paid on join, so nobody is seated for free: the
  // others get a push to join. Free matches keep the same line-up (swapped sides).
  const copyLineUp = original.paymentType !== "SC"
  const others = original.participants
    .map((p) => p.playerId)
    .filter((id): id is string => !!id && id !== player.id)

  const newSession = await db.session.create({
    data: {
      organizerId: player.id,
      title: original.title,
      location: original.location,
      city: original.city,
      date: rematchDate,
      format: original.format,
      maxPlayers: original.maxPlayers,
      courtCost: original.courtCost,
      notes: original.notes,
      paymentType: original.paymentType,
      quotaAmount: original.quotaAmount,
      loserPays: original.loserPays,
      matchMode: original.matchMode,
      ...(copyLineUp
        ? {
            participants: {
              create: original.participants.map((p) => ({
                playerId: p.playerId,
                team: p.team === 0 ? 1 : p.team === 1 ? 0 : null,
              })),
            },
          }
        : {}),
    },
  })

  safeNotifyPlayers(others, {
    title: "Rivincita! 🔁",
    body: copyLineUp
      ? `${player.name} ha fissato la rivincita: ci sei già dentro.`
      : `${player.name} ha fissato la rivincita: entra per tenerti il posto.`,
    url: `/sessions/${newSession.id}`,
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

  // The seat must belong to this match: otherwise an organiser of any match
  // could move players around in someone else's.
  const owned = await db.sessionParticipant.findFirst({
    where: { id: data.participantId, sessionId: data.sessionId },
    select: { id: true },
  })
  if (!owned) throw new Error("Giocatore non trovato in questa partita")

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
  if (session.status === "COMPLETED") {
    revalidatePath(`/sessions/${sessionId}`)
    return
  }
  // Not before it starts, not with an empty side, not a cancelled match: those
  // were free wins, XP and rating for whoever closed them.
  const ruleError = completionError({
    status: session.status,
    date: session.date,
    participants: session.participants,
    withScore: !!sets && sets.length > 0,
  })
  if (ruleError) throw new Error(ruleError)

  // Idempotency guard: claim the session atomically. A double tap, a retry, or a
  // second participant closing the same match must not re-apply sets, career
  // stats, XP and rating deltas — only the call that flips the status proceeds.
  // Only an active match can be claimed, so a cancelled one stays cancelled.
  const claimed = await db.session.updateMany({
    where: { id: sessionId, status: { in: ["OPEN", "FULL"] } },
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

    // A 2v2 between two Scopri pairs also moves the pair ratings (Coppie).
    if (winningTeam !== null) {
      await rateDuoMatch(sessionId, winningTeam).catch((e) => console.error("duo rating failed", e))
    }
  }

  // Update Glicko-2 ratings (dampened for friendly sessions)
  try {
    await updateGlickoAfterSession(sessionId)
  } catch (e) {
    console.error("Glicko update failed for session", sessionId, e)
  }

  // Update sessionsPlayed + XP for every participant (skip guests). A "match"
  // with a single real account earns nothing, or anyone could farm XP alone.
  const progress = countsForProgress(session.participants)
  for (const p of session.participants) {
    if (!p.playerId || !progress) continue  // skip guests
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

  // First real match for an invited friend: pay both referral rewards.
  if (progress) {
    await rewardInvitesAfterMatch(
      session.participants.map((p) => p.playerId).filter((id): id is string => !!id),
    ).catch((e) => console.error("Referral reward failed for session", sessionId, e))
  }

  revalidatePath(`/sessions/${sessionId}`)
  revalidatePath("/sessions")
  // The boards just changed: the recap's "Nº a Riccione" must read fresh.
  revalidateTag(LEADERBOARDS_TAG, { expire: 0 })
}

export async function addPlayerToSession(sessionId: string, playerId: string) {
  const organizer = await getCurrentPlayer()
  if (!organizer) throw new Error("Non autenticato")
  AddPlayerToSessionSchema.parse({ sessionId, playerId })

  const session = await seatTransaction(sessionId, organizer.id, (tx) =>
    tx.sessionParticipant.create({ data: { sessionId, playerId } }),
  )

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
  const data = AddGuestSchema.parse({ sessionId, guestName })

  await seatTransaction(sessionId, player.id, (tx) =>
    tx.sessionParticipant.create({ data: { sessionId, guestName: data.guestName } }),
  )
  revalidatePath(`/sessions/${sessionId}`)
  revalidatePath("/sessions")
  return { ok: true as const }
}

/**
 * Seat someone on the organiser's behalf: capacity check, insert and the FULL
 * flip happen in one serialisable transaction, like joinSession, so two adds at
 * once can't overflow the match.
 */
async function seatTransaction(
  sessionId: string,
  organizerId: string,
  insert: (tx: Parameters<Parameters<typeof db.$transaction>[0]>[0]) => Promise<unknown>,
) {
  try {
    return await db.$transaction(
      async (tx) => {
        const session = await tx.session.findUniqueOrThrow({
          where: { id: sessionId },
          select: {
            organizerId: true,
            status: true,
            date: true,
            maxPlayers: true,
            title: true,
            location: true,
            _count: { select: { participants: true } },
          },
        })
        if (session.organizerId !== organizerId) throw new Error("Solo l'organizzatore può aggiungere giocatori")
        if (!isActiveStatus(session.status)) throw new Error("La sessione non è più aperta")
        if (session._count.participants >= session.maxPlayers) throw new Error("Sessione al completo")

        await insert(tx)
        if (session._count.participants + 1 >= session.maxPlayers) {
          await tx.session.update({ where: { id: sessionId }, data: { status: "FULL" } })
        }
        return session
      },
      { isolationLevel: "Serializable" },
    )
  } catch (e) {
    if (e && typeof e === "object" && "code" in e) {
      if (e.code === "P2034") throw new Error("Posto appena occupato, riprova.")
      if (e.code === "P2002") throw new Error("È già in questa partita")
    }
    throw e
  }
}

/**
 * Organiser marks a registered player who never showed up: they leave the
 * match (seat freed, as with a removal) and it counts against their attendance
 * on Scopri. Only between the start and 48 hours after, before closing it.
 */
export async function markNoShow(participantId: string) {
  const player = await getCurrentPlayer()
  if (!player) throw new Error("Non autenticato")
  SessionIdSchema.parse(participantId)
  const part = await db.sessionParticipant.findUnique({
    where: { id: participantId },
    select: { playerId: true, sessionId: true, session: { select: { organizerId: true, status: true, date: true } } },
  })
  if (!part) throw new Error("Giocatore non trovato")
  if (!part.playerId) throw new Error("Vale solo per i giocatori con un account")
  if (part.session.organizerId !== player.id) throw new Error("Solo l'organizzatore può segnarlo")
  if (part.playerId === player.id) throw new Error("Non puoi segnare te stesso")
  if (!isActiveStatus(part.session.status)) throw new Error("La partita è già chiusa")
  const now = Date.now()
  if (part.session.date.getTime() > now) throw new Error("Si può segnare solo dopo l'inizio della partita")
  if (now - part.session.date.getTime() > 48 * 3600_000) throw new Error("Sono passate più di 48 ore")

  await removeParticipantFromSession(participantId)
  await db.attendanceEvent.create({ data: { playerId: part.playerId, sessionId: part.sessionId, kind: "NO_SHOW" } })
  safeNotifyPlayer(part.playerId, {
    title: "Segnato come non presentato",
    body: "Se c'eri, contestalo dalle tue presenze: «Ero presente».",
    url: "/profile/presenze",
  })
  return { ok: true as const }
}

/** Organiser removes a seat (guest or registered player). Paid credits go back. */
export async function removeParticipantFromSession(participantId: string) {
  const player = await getCurrentPlayer()
  if (!player) throw new Error("Non autenticato")
  SessionIdSchema.parse(participantId)

  const participant = await db.sessionParticipant.findUniqueOrThrow({
    where: { id: participantId },
    include: { session: { select: { organizerId: true, id: true, status: true, title: true } } },
  })
  if (participant.session.organizerId !== player.id) throw new Error("Solo l'organizzatore può rimuovere giocatori")
  if (!isActiveStatus(participant.session.status)) throw new Error("La partita non è più modificabile")
  const sessionId = participant.session.id

  let wasFull = false
  await db.$transaction(async (tx) => {
    const removed = await tx.sessionParticipant.delete({
      where: { id: participantId },
      select: { paidCredits: true, playerId: true },
    })
    if (removed.playerId && removed.paidCredits > 0) {
      await tx.player.update({
        where: { id: removed.playerId },
        data: { sanderCredits: { increment: removed.paidCredits } },
      })
    }
    const reopened = await tx.session.updateMany({
      where: { id: sessionId, status: "FULL" },
      data: { status: "OPEN" },
    })
    wasFull = reopened.count > 0
  })

  if (participant.playerId) {
    await notifyPlayerNow(participant.playerId, {
      title: "Sei stato tolto da una partita",
      body: `${participant.session.title}${participant.paidCredits > 0 ? `: ti abbiamo restituito ${participant.paidCredits} SC.` : "."}`,
      url: "/sessions",
    })
  }
  if (wasFull) await notifyWaitlistHead(sessionId)

  revalidatePath(`/sessions/${sessionId}`)
  revalidatePath("/sessions")
  return { ok: true as const }
}

/** Kept for existing callers: removing a guest is removing a seat. */
export async function removeGuestFromSession(participantId: string) {
  return removeParticipantFromSession(participantId)
}

async function notifyWaitlistHead(sessionId: string) {
  const next = await db.sessionWaitlist.findFirst({
    where: { sessionId },
    orderBy: { createdAt: "asc" },
    select: { playerId: true, session: { select: { title: true, location: true } } },
  })
  if (next) {
    await notifyPlayerNow(next.playerId, {
      title: "Si è liberato un posto! 🏐",
      body: `${next.session.title} a ${next.session.location}: corri a prenderlo.`,
      url: `/sessions/${sessionId}`,
    })
  } else {
    after(() => nudgeForSession(sessionId, "freed").catch(() => {}))
  }
}

export async function cancelSession(sessionId: string) {
  const player = await getCurrentPlayer()
  if (!player) throw new Error("Non autenticato")
  SessionIdSchema.parse(sessionId)

  const session = await db.session.findUniqueOrThrow({
    where: { id: sessionId },
    select: { organizerId: true, title: true },
  })
  if (session.organizerId !== player.id) throw new Error("Solo l'organizzatore può cancellare la sessione")

  // Cancel and refund in one step: players who paid in credits get them back.
  const notify = await db.$transaction(async (tx) => {
    const claimed = await tx.session.updateMany({
      where: { id: sessionId, status: { in: ["OPEN", "FULL"] } },
      data: { status: "CANCELLED" },
    })
    if (claimed.count === 0) throw new Error("La partita non è più attiva")
    await refundSessionCredits(tx, sessionId)
    const seats = await tx.sessionParticipant.findMany({
      where: { sessionId, playerId: { not: null } },
      select: { playerId: true },
    })
    return seats.map((p) => p.playerId!).filter((id) => id !== player.id)
  })

  safeNotifyPlayers(notify, {
    title: "Partita annullata",
    body: `${session.title} è stata annullata dall'organizzatore. Eventuali crediti ti sono stati restituiti.`,
    url: `/sessions/${sessionId}`,
  })

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
