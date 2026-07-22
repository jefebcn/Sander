"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { getCurrentPlayer } from "@/lib/getCurrentPlayer"
import { getPartnerStats } from "@/actions/players"
import { SendMessageSchema, CreateGroupSchema } from "@/lib/validators/message.schema"

// Lazy push import keeps web-push out of the SSR/client bundle (mirrors sessions.ts).
async function safeNotifyPlayers(
  playerIds: string[],
  payload: { title: string; body: string; url?: string },
) {
  if (playerIds.length === 0) return
  try {
    const { notifyPlayers } = await import("@/lib/push")
    await notifyPlayers(playerIds, payload)
  } catch (e) {
    console.error("chat notify failed", e)
  }
}

function dmKeyFor(a: string, b: string): string {
  return [a, b].sort().join(":")
}

type ThreadForMembers = {
  kind: string
  sessionId: string | null
  participants: { playerId: string }[]
}

/**
 * Resolve who belongs to a thread.
 * - DM: membership is the ChatParticipant rows.
 * - SESSION: membership derives live from SessionParticipant (roster can change).
 */
async function resolveMembers(thread: ThreadForMembers, meId: string) {
  if (thread.kind === "SESSION" && thread.sessionId) {
    const parts = await db.sessionParticipant.findMany({
      where: { sessionId: thread.sessionId, playerId: { not: null } },
      select: { playerId: true },
    })
    const ids = parts.map((p) => p.playerId as string).filter(Boolean)
    return { isMember: ids.includes(meId), others: ids.filter((id) => id !== meId) }
  }
  const ids = thread.participants.map((p) => p.playerId)
  return { isMember: ids.includes(meId), others: ids.filter((id) => id !== meId) }
}

// ── 1:1 DM: open or create the thread with another player ────────────────────
export async function getOrCreateDmThread(otherPlayerId: string): Promise<string> {
  const me = await getCurrentPlayer()
  if (!me) throw new Error("Non autenticato")
  if (otherPlayerId === me.id) throw new Error("Non puoi scrivere a te stesso")

  const other = await db.player.findUnique({ where: { id: otherPlayerId }, select: { id: true } })
  if (!other) throw new Error("Giocatore non trovato")

  const key = dmKeyFor(me.id, other.id)
  const existing = await db.chatThread.findUnique({ where: { dmKey: key }, select: { id: true } })
  if (existing) return existing.id

  try {
    const thread = await db.chatThread.create({
      data: {
        kind: "DM",
        dmKey: key,
        participants: { create: [{ playerId: me.id }, { playerId: other.id }] },
      },
      select: { id: true },
    })
    return thread.id
  } catch {
    // Lost a create race — the row now exists.
    const t = await db.chatThread.findUnique({ where: { dmKey: key }, select: { id: true } })
    if (!t) throw new Error("Impossibile aprire la conversazione")
    return t.id
  }
}

// ── Ad-hoc group chat: create a group with 2+ other players ──────────────────
export async function createGroupThread(input: unknown): Promise<string> {
  const me = await getCurrentPlayer()
  if (!me) throw new Error("Non autenticato")
  const { playerIds, name } = CreateGroupSchema.parse(input)

  const others = Array.from(new Set(playerIds.filter((id) => id && id !== me.id)))
  if (others.length < 2) throw new Error("Seleziona almeno 2 giocatori")

  const found = await db.player.findMany({ where: { id: { in: others } }, select: { id: true } })
  const validIds = found.map((f) => f.id)
  if (validIds.length < 2) throw new Error("Giocatori non validi")

  const memberIds = Array.from(new Set([me.id, ...validIds]))
  const thread = await db.chatThread.create({
    data: {
      kind: "GROUP",
      name: name?.trim() || null,
      createdById: me.id,
      participants: { create: memberIds.map((playerId) => ({ playerId })) },
    },
    select: { id: true },
  })
  return thread.id
}

// ── Leave a group (removes me; deletes the thread if empty) ──────────────────
export async function leaveGroup(threadId: string) {
  const me = await getCurrentPlayer()
  if (!me) throw new Error("Non autenticato")
  const thread = await db.chatThread.findUnique({
    where: { id: threadId },
    select: { kind: true, participants: { select: { playerId: true } } },
  })
  if (!thread || thread.kind !== "GROUP") throw new Error("Non è un gruppo")
  await db.chatParticipant.deleteMany({ where: { threadId, playerId: me.id } })
  const remaining = thread.participants.filter((p) => p.playerId !== me.id).length
  if (remaining === 0) {
    await db.chatThread.delete({ where: { id: threadId } })
  }
  revalidatePath("/messaggi")
  revalidatePath("/")
}

// ── Delete a group (creator only) ────────────────────────────────────────────
export async function deleteGroup(threadId: string) {
  const me = await getCurrentPlayer()
  if (!me) throw new Error("Non autenticato")
  const thread = await db.chatThread.findUnique({
    where: { id: threadId },
    select: { kind: true, createdById: true },
  })
  if (!thread || thread.kind !== "GROUP") throw new Error("Non è un gruppo")
  if (thread.createdById !== me.id) throw new Error("Solo chi ha creato il gruppo può eliminarlo")
  await db.chatThread.delete({ where: { id: threadId } })
  revalidatePath("/messaggi")
  revalidatePath("/")
}

// ── Session group chat: open or create the thread for a session ──────────────
export async function getOrCreateSessionThread(sessionId: string): Promise<string> {
  const me = await getCurrentPlayer()
  if (!me) throw new Error("Non autenticato")

  const membership = await db.sessionParticipant.findFirst({
    where: { sessionId, playerId: me.id },
    select: { id: true },
  })
  if (!membership) throw new Error("Non fai parte di questa partita")

  const existing = await db.chatThread.findUnique({ where: { sessionId }, select: { id: true } })
  if (existing) {
    // Ensure I have a participant row for read-tracking (joined after creation).
    await db.chatParticipant.upsert({
      where: { threadId_playerId: { threadId: existing.id, playerId: me.id } },
      create: { threadId: existing.id, playerId: me.id },
      update: {},
    })
    return existing.id
  }

  const parts = await db.sessionParticipant.findMany({
    where: { sessionId, playerId: { not: null } },
    select: { playerId: true },
  })
  const ids = Array.from(new Set(parts.map((p) => p.playerId as string).filter(Boolean)))
  try {
    const thread = await db.chatThread.create({
      data: {
        kind: "SESSION",
        sessionId,
        participants: { create: ids.map((playerId) => ({ playerId })) },
      },
      select: { id: true },
    })
    return thread.id
  } catch {
    const t = await db.chatThread.findUnique({ where: { sessionId }, select: { id: true } })
    if (!t) throw new Error("Impossibile aprire la chat della partita")
    return t.id
  }
}

// ── Inbox: all my threads with preview + unread count ────────────────────────
export async function getThreads() {
  const me = await getCurrentPlayer()
  if (!me) return []

  const parts = await db.chatParticipant.findMany({
    where: { playerId: me.id },
    select: {
      lastReadAt: true,
      thread: {
        select: {
          id: true,
          kind: true,
          name: true,
          lastMessageAt: true,
          session: { select: { id: true, title: true } },
          participants: {
            select: { player: { select: { id: true, name: true, firstName: true, avatarUrl: true } } },
          },
          messages: {
            orderBy: { createdAt: "desc" },
            take: 1,
            select: { body: true, sender: { select: { firstName: true, name: true } } },
          },
        },
      },
    },
  })

  const items = await Promise.all(
    parts.map(async (p) => {
      const t = p.thread
      const isDM = t.kind === "DM"
      const others = t.participants.filter((pp) => pp.player.id !== me.id).map((pp) => pp.player)
      const other = others[0]
      const last = t.messages[0]
      const unread = await db.chatMessage.count({
        where: {
          threadId: t.id,
          senderId: { not: me.id },
          ...(p.lastReadAt ? { createdAt: { gt: p.lastReadAt } } : {}),
        },
      })
      let title: string
      if (t.kind === "SESSION") title = t.session?.title ?? "Partita"
      else if (t.kind === "GROUP")
        title = t.name || others.map((o) => o.firstName ?? o.name).join(", ") || "Gruppo"
      else title = other ? other.firstName ?? other.name : "Chat"
      return {
        id: t.id,
        kind: t.kind,
        title,
        avatarUrl: isDM ? other?.avatarUrl ?? null : null,
        lastMessage: last
          ? isDM
            ? last.body
            : `${last.sender.firstName ?? last.sender.name}: ${last.body}`
          : null,
        lastMessageAt: t.lastMessageAt ? t.lastMessageAt.toISOString() : null,
        unread,
      }
    }),
  )

  items.sort((a, b) => (b.lastMessageAt ?? "").localeCompare(a.lastMessageAt ?? ""))
  return items
}

// ── One conversation: metadata + messages (authorized) ───────────────────────
export async function getThread(threadId: string) {
  const me = await getCurrentPlayer()
  if (!me) throw new Error("Non autenticato")

  const thread = await db.chatThread.findUnique({
    where: { id: threadId },
    select: {
      id: true,
      kind: true,
      name: true,
      createdById: true,
      sessionId: true,
      session: { select: { id: true, title: true } },
      participants: {
        select: {
          playerId: true,
          lastReadAt: true,
          player: { select: { id: true, name: true, firstName: true, avatarUrl: true } },
        },
      },
    },
  })
  if (!thread) throw new Error("Conversazione non trovata")

  const { isMember } = await resolveMembers(thread, me.id)
  if (!isMember) throw new Error("Non autorizzato")

  const rows = await db.chatMessage.findMany({
    where: { threadId },
    orderBy: { createdAt: "asc" },
    take: 300,
    select: {
      id: true,
      body: true,
      createdAt: true,
      senderId: true,
      sender: { select: { firstName: true, name: true } },
    },
  })

  const isDM = thread.kind === "DM"
  const others = thread.participants.filter((pp) => pp.player.id !== me.id).map((pp) => pp.player)
  const otherPart = thread.participants.find((pp) => pp.player.id !== me.id)
  const other = otherPart?.player
  // Read receipt (DM only): when the other player last read the thread.
  const otherReadAt = isDM && otherPart?.lastReadAt ? otherPart.lastReadAt.toISOString() : null

  let title: string
  if (thread.kind === "SESSION") title = thread.session?.title ?? "Partita"
  else if (thread.kind === "GROUP")
    title = thread.name || others.map((o) => o.firstName ?? o.name).join(", ") || "Gruppo"
  else title = other ? other.firstName ?? other.name : "Chat"

  return {
    id: thread.id,
    kind: thread.kind,
    sessionId: thread.sessionId,
    otherReadAt,
    title,
    meId: me.id,
    amCreator: thread.kind === "GROUP" && thread.createdById === me.id,
    members: thread.participants.map((pp) => ({
      id: pp.player.id,
      name: pp.player.firstName ?? pp.player.name,
      avatarUrl: pp.player.avatarUrl,
    })),
    messages: rows.map((r) => ({
      id: r.id,
      body: r.body,
      createdAt: r.createdAt.toISOString(),
      senderId: r.senderId,
      senderName: r.sender.firstName ?? r.sender.name,
      mine: r.senderId === me.id,
    })),
  }
}

// ── Send a message ───────────────────────────────────────────────────────────
export async function sendMessage(input: unknown) {
  const me = await getCurrentPlayer()
  if (!me) throw new Error("Non autenticato")
  const { threadId, body } = SendMessageSchema.parse(input)

  const thread = await db.chatThread.findUnique({
    where: { id: threadId },
    select: {
      kind: true,
      name: true,
      sessionId: true,
      participants: { select: { playerId: true } },
      session: { select: { title: true } },
    },
  })
  if (!thread) throw new Error("Conversazione non trovata")

  const { isMember, others } = await resolveMembers(thread, me.id)
  if (!isMember) throw new Error("Non autorizzato")

  const now = new Date()
  const msg = await db.chatMessage.create({
    data: { threadId, senderId: me.id, body },
    select: { id: true, createdAt: true },
  })
  await db.chatThread.update({ where: { id: threadId }, data: { lastMessageAt: now } })
  await db.chatParticipant.upsert({
    where: { threadId_playerId: { threadId, playerId: me.id } },
    create: { threadId, playerId: me.id, lastReadAt: now },
    update: { lastReadAt: now },
  })

  const senderName = me.firstName ?? me.name.split(" ")[0]
  const isDM = thread.kind === "DM"
  const notifTitle = isDM
    ? senderName
    : thread.kind === "SESSION"
      ? thread.session?.title ?? "Partita"
      : thread.name || "Gruppo"
  const notifBody = (isDM ? body : `${senderName}: ${body}`).slice(0, 140)
  await safeNotifyPlayers(others, { title: notifTitle, body: notifBody, url: `/messaggi/${threadId}` })

  revalidatePath(`/messaggi/${threadId}`)
  revalidatePath("/messaggi")
  return { id: msg.id, createdAt: msg.createdAt.toISOString() }
}

// ── Read tracking + global unread badge ──────────────────────────────────────
export async function markThreadRead(threadId: string) {
  const me = await getCurrentPlayer()
  if (!me) return
  const now = new Date()
  await db.chatParticipant.upsert({
    where: { threadId_playerId: { threadId, playerId: me.id } },
    create: { threadId, playerId: me.id, lastReadAt: now },
    update: { lastReadAt: now },
  })
  revalidatePath("/messaggi")
  revalidatePath("/")
}

export async function getUnreadMessageCount(): Promise<number> {
  const me = await getCurrentPlayer()
  if (!me) return 0
  const parts = await db.chatParticipant.findMany({
    where: { playerId: me.id },
    select: { threadId: true, lastReadAt: true },
  })
  if (parts.length === 0) return 0
  const counts = await Promise.all(
    parts.map((p) =>
      db.chatMessage.count({
        where: {
          threadId: p.threadId,
          senderId: { not: me.id },
          ...(p.lastReadAt ? { createdAt: { gt: p.lastReadAt } } : {}),
        },
      }),
    ),
  )
  return counts.reduce((a, b) => a + b, 0)
}

// ── V2: companions (players I've played with) for quick-DM ───────────────────
export async function getChatCompanions() {
  const me = await getCurrentPlayer()
  if (!me) return []
  const partners = await getPartnerStats(me.id)
  const ids = partners.slice(0, 12).map((p) => p.playerId)
  if (ids.length === 0) return []
  const players = await db.player.findMany({
    where: { id: { in: ids } },
    select: { id: true, name: true, firstName: true, avatarUrl: true },
  })
  const byId = new Map(players.map((p) => [p.id, p]))
  // preserve partner ordering (most-played first)
  return ids
    .map((id) => byId.get(id))
    .filter((p): p is NonNullable<typeof p> => Boolean(p))
    .map((p) => ({ id: p.id, name: p.firstName ?? p.name, avatarUrl: p.avatarUrl }))
}

// ── V2: my upcoming sessions, to propose one inside a chat ───────────────────
export async function getMyUpcomingSessions() {
  const me = await getCurrentPlayer()
  if (!me) return []
  const now = new Date()
  const rows = await db.session.findMany({
    where: {
      status: { in: ["OPEN", "FULL"] },
      date: { gte: now },
      OR: [{ organizerId: me.id }, { participants: { some: { playerId: me.id } } }],
    },
    orderBy: { date: "asc" },
    take: 20,
    select: { id: true, title: true, location: true, date: true },
  })
  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    location: r.location,
    date: r.date.toISOString(),
  }))
}
