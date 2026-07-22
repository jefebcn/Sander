"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { getCurrentPlayer } from "@/lib/getCurrentPlayer"
import { SendMessageSchema } from "@/lib/validators/message.schema"

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
      const isSession = t.kind === "SESSION"
      const other = t.participants.find((pp) => pp.player.id !== me.id)?.player
      const last = t.messages[0]
      const unread = await db.chatMessage.count({
        where: {
          threadId: t.id,
          senderId: { not: me.id },
          ...(p.lastReadAt ? { createdAt: { gt: p.lastReadAt } } : {}),
        },
      })
      return {
        id: t.id,
        kind: isSession ? "SESSION" : "DM",
        title: isSession
          ? t.session?.title ?? "Partita"
          : other
            ? other.firstName ?? other.name
            : "Chat",
        avatarUrl: isSession ? null : other?.avatarUrl ?? null,
        lastMessage: last
          ? isSession
            ? `${last.sender.firstName ?? last.sender.name}: ${last.body}`
            : last.body
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
      sessionId: true,
      session: { select: { id: true, title: true } },
      participants: { select: { playerId: true, player: { select: { id: true, name: true, firstName: true } } } },
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

  const isSession = thread.kind === "SESSION"
  const other = thread.participants.find((pp) => pp.player.id !== me.id)?.player

  return {
    id: thread.id,
    kind: isSession ? ("SESSION" as const) : ("DM" as const),
    sessionId: thread.sessionId,
    title: isSession
      ? thread.session?.title ?? "Partita"
      : other
        ? other.firstName ?? other.name
        : "Chat",
    meId: me.id,
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
  const isSession = thread.kind === "SESSION"
  const notifTitle = isSession ? thread.session?.title ?? "Partita" : senderName
  const notifBody = (isSession ? `${senderName}: ${body}` : body).slice(0, 140)
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
