"use server"

import { revalidatePath } from "next/cache"
import { after } from "next/server"
import { db } from "@/lib/db"
import { getCurrentPlayer } from "@/lib/getCurrentPlayer"
import { formatWhen } from "@/lib/datetime"
import { sessionDateError } from "@/lib/sessionRules"
import { isBlockedPair } from "@/lib/scopri/blocks"
import { notify } from "@/lib/scopri/server"
import { nudgeForSession } from "@/lib/nudges"
import { ProposeInChatSchema, ProposalAnswerSchema } from "@/lib/validators/message.schema"

/* ────────────────────────────────────────────────────────────────────────── */
/*  "Proponi una partita" in a private chat: a card with when and where.       */
/*  "Ci sto" creates the 2v2 with the two of them as a pair and two seats      */
/*  open (nearby players are told); "Non posso" or "Annulla" close it.         */
/* ────────────────────────────────────────────────────────────────────────── */

const firstName = (p: { firstName: string | null; name: string }) => p.firstName?.trim() || p.name.split(" ")[0]

async function requireMe() {
  const me = await getCurrentPlayer()
  if (!me) throw new Error("Non autenticato")
  return me
}

/** Post a chat message (optionally carrying a proposal card) and touch the thread. */
async function post(threadId: string, senderId: string, body: string, proposalId?: string) {
  const now = new Date()
  await db.chatMessage.create({ data: { threadId, senderId, body: body.slice(0, 2000), proposalId } })
  await db.chatThread.update({ where: { id: threadId }, data: { lastMessageAt: now } })
  await db.chatParticipant.upsert({
    where: { threadId_playerId: { threadId, playerId: senderId } },
    create: { threadId, playerId: senderId, lastReadAt: now },
    update: { lastReadAt: now },
  })
}

export async function proposeGameInChat(input: unknown) {
  const data = ProposeInChatSchema.parse(input)
  const me = await requireMe()
  const dateError = sessionDateError(data.date)
  if (dateError) throw new Error(dateError)

  const thread = await db.chatThread.findUnique({
    where: { id: data.threadId },
    select: { kind: true, participants: { select: { playerId: true } } },
  })
  if (!thread || thread.kind !== "DM") throw new Error("Le proposte si fanno in una chat privata")
  const ids = thread.participants.map((p) => p.playerId)
  if (!ids.includes(me.id)) throw new Error("Non autorizzato")
  const otherId = ids.find((id) => id !== me.id)
  if (!otherId || (await isBlockedPair(me.id, otherId))) throw new Error("Non puoi più scrivere in questa conversazione")

  const open = await db.gameProposal.count({ where: { threadId: data.threadId, status: "PENDING", date: { gt: new Date() } } })
  if (open >= 3) throw new Error("Ci sono già tre proposte in attesa: aspetta una risposta")

  const proposal = await db.gameProposal.create({
    data: { threadId: data.threadId, fromId: me.id, toId: otherId, date: data.date, location: data.location, city: data.city ?? null },
    select: { id: true },
  })
  const when = formatWhen(data.date)
  await post(data.threadId, me.id, `🏐 Ti propongo una partita: ${when}, ${data.location}`, proposal.id)
  await notify([otherId], {
    title: `${firstName(me)} ti propone una partita`,
    body: `${when} · ${data.location}`,
    url: `/messaggi/${data.threadId}`,
  })
  revalidatePath(`/messaggi/${data.threadId}`)
  return { proposalId: proposal.id }
}

export async function answerGameProposal(input: unknown) {
  const { proposalId, answer } = ProposalAnswerSchema.parse(input)
  const me = await requireMe()
  const p = await db.gameProposal.findUnique({ where: { id: proposalId } })
  if (!p) throw new Error("Proposta non trovata")
  if (answer === "cancel" ? p.fromId !== me.id : p.toId !== me.id) throw new Error("Non autorizzato")
  if (p.status !== "PENDING") throw new Error("Questa proposta è già chiusa")
  if (p.date <= new Date()) throw new Error("Questa proposta è scaduta")
  if (await isBlockedPair(p.fromId, p.toId)) throw new Error("Non puoi più rispondere")

  // Claim it atomically: a double tap must not create two matches.
  const status = answer === "accept" ? "ACCEPTED" : answer === "decline" ? "DECLINED" : "CANCELLED"
  const claimed = await db.gameProposal.updateMany({ where: { id: proposalId, status: "PENDING" }, data: { status, respondedAt: new Date() } })
  if (claimed.count === 0) throw new Error("Questa proposta è già chiusa")

  const when = formatWhen(p.date)
  if (answer === "accept") {
    const session = await db.session.create({
      data: {
        organizerId: p.fromId,
        title: `2v2 — ${p.location}`,
        location: p.location,
        city: p.city,
        date: p.date,
        format: "TWO_VS_TWO",
        maxPlayers: 4,
        paymentType: "FREE",
        participants: { create: [{ playerId: p.fromId, team: 0 }, { playerId: p.toId, team: 0 }] },
      },
      select: { id: true },
    })
    await db.gameProposal.update({ where: { id: proposalId }, data: { sessionId: session.id } })
    await post(p.threadId, me.id, `Ci sto! Partita creata: ${when}, ${p.location}. Noi due in coppia, cerchiamo due avversari.\n/sessions/${session.id}`)
    await notify([p.fromId], { title: `${firstName(me)} ci sta!`, body: `${when} · ${p.location}`, url: `/sessions/${session.id}` })
    if (p.date.getTime() - Date.now() < 7 * 24 * 3600_000) {
      after(() => nudgeForSession(session.id, "new").catch(() => {}))
    }
    revalidatePath("/sessions")
  } else if (answer === "decline") {
    await post(p.threadId, me.id, `Questa volta non riesco (${when}). Proponi un altro momento?`)
    await notify([p.fromId], { title: `${firstName(me)} non riesce`, body: `${when} · proponi un altro momento`, url: `/messaggi/${p.threadId}` })
  }
  revalidatePath(`/messaggi/${p.threadId}`)
  return { ok: true as const }
}
