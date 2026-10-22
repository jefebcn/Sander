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
import { ProposeInChatSchema, ProposalAnswerSchema, JoinAsPairSchema } from "@/lib/validators/message.schema"
import { joinWindowOpen } from "@/lib/sessionRules"
import { creditCost } from "@/lib/joinPrice"
import { pairSlotsNear } from "@/lib/scopri/pairPlay"
import { teamForPair } from "@/lib/scopri/pairTeam"

/* ────────────────────────────────────────────────────────────────────────── */
/*  "Proponi una partita" in a private chat: a card with when and where.       */
/*  "Ci sto" creates the 2v2 with the two of them as a pair and two seats      */
/*  open (nearby players are told); "Non posso" or "Annulla" close it.         */
/*  A training ("Allenamento a due") is just the two of them: accepting it     */
/*  confirms it in the chat. And "Entrate in coppia" puts both of them in a    */
/*  game that misses exactly a pair.                                           */
/* ────────────────────────────────────────────────────────────────────────── */

const firstName = (p: { firstName: string | null; name: string }) => p.firstName?.trim() || p.name.split(" ")[0]

const FOCUS_LABEL: Record<string, string> = {
  PALLEGGIO: "palleggio",
  SERVIZIO: "servizio",
  RICEZIONE: "ricezione",
  TUTTO: "un po' di tutto",
}

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

  const training = data.kind === "TRAINING"
  const proposal = await db.gameProposal.create({
    data: {
      threadId: data.threadId,
      fromId: me.id,
      toId: otherId,
      date: data.date,
      location: data.location,
      city: data.city ?? null,
      kind: data.kind,
      focus: training ? (data.focus ?? "TUTTO") : null,
    },
    select: { id: true },
  })
  const when = formatWhen(data.date)
  const what = training ? `un allenamento a due (${FOCUS_LABEL[data.focus ?? "TUTTO"]})` : "una partita"
  await post(data.threadId, me.id, `🏐 Ti propongo ${what}: ${when}, ${data.location}`, proposal.id)
  await notify([otherId], {
    title: `${firstName(me)} ti propone ${training ? "un allenamento" : "una partita"}`,
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
  if (answer === "accept" && p.kind === "TRAINING") {
    // Just the two of you: nothing to open to others, the chat holds the date.
    const focus = FOCUS_LABEL[p.focus ?? "TUTTO"]
    await post(p.threadId, me.id, `Ci sto! Allenamento a due confermato: ${when}, ${p.location} · ${focus}.`)
    await notify([p.fromId], { title: `${firstName(me)} ci sta!`, body: `Allenamento · ${when} · ${p.location}`, url: `/messaggi/${p.threadId}` })
  } else if (answer === "accept") {
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

/** The other person of a private chat you're in, unless one of you blocked the other. */
async function dmPartner(threadId: string, meId: string): Promise<string> {
  const thread = await db.chatThread.findUnique({
    where: { id: threadId },
    select: { kind: true, participants: { select: { playerId: true } } },
  })
  if (!thread || thread.kind !== "DM") throw new Error("Si entra in coppia da una chat privata")
  const ids = thread.participants.map((x) => x.playerId)
  if (!ids.includes(meId)) throw new Error("Non autorizzato")
  const otherId = ids.find((id) => id !== meId)
  if (!otherId || (await isBlockedPair(meId, otherId))) throw new Error("Non puoi più scrivere in questa conversazione")
  return otherId
}

/** Games near either of you, in the next week, that miss at least a pair. */
export async function listPairSlots(threadId: string) {
  const me = await requireMe()
  const otherId = await dmPartner(String(threadId), me.id)
  const other = await db.player.findUnique({ where: { id: otherId }, select: { homeCity: true } })
  const cities = [...new Set([me.homeCity, other?.homeCity].filter((c): c is string => !!c))]
  return pairSlotsNear(me.id, otherId, cities)
}

/**
 * "Entrate in coppia": you and the person you're chatting with take two seats
 * of the same game, on the same side when teams are set. Free games only
 * (credits are paid by each player from the match page). The other person is
 * told in the chat and by notification, and can leave like from any game.
 */
export async function joinAsPair(input: unknown): Promise<{ ok: true; sessionId: string } | { ok: false; error: string }> {
  const parsed = JoinAsPairSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: "Partita non valida" }
  const { threadId, sessionId } = parsed.data
  const me = await requireMe()
  let otherId: string
  try {
    otherId = await dmPartner(threadId, me.id)
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Non autorizzato" }
  }
  let session: { title: string; location: string; date: Date }
  try {
    session = await db.$transaction(
      async (tx) => {
        const s = await tx.session.findUniqueOrThrow({
          where: { id: sessionId },
          select: {
            title: true, location: true, date: true, status: true, maxPlayers: true,
            paymentType: true, quotaAmount: true, courtCost: true,
            participants: { select: { playerId: true, team: true } },
          },
        })
        if (s.status !== "OPEN") throw new Error("Questa partita non è più aperta")
        if (!joinWindowOpen(s.date)) throw new Error("Questa partita è già iniziata")
        if (s.participants.some((x) => x.playerId === me.id || x.playerId === otherId)) throw new Error("Uno di voi è già in questa partita")
        if (s.maxPlayers - s.participants.length < 2) throw new Error("Non ci sono più due posti liberi")
        if (creditCost(s) > 0) throw new Error("Questa partita si paga in crediti: entrate ognuno dalla sua pagina")
        const team = teamForPair(s.participants.map((x) => x.team), s.maxPlayers)
        await tx.sessionParticipant.createMany({
          data: [
            { sessionId, playerId: me.id, team },
            { sessionId, playerId: otherId, team },
          ],
        })
        await tx.sessionWaitlist.deleteMany({ where: { sessionId, playerId: { in: [me.id, otherId] } } })
        if (s.participants.length + 2 >= s.maxPlayers) await tx.session.update({ where: { id: sessionId }, data: { status: "FULL" } })
        return { title: s.title, location: s.location, date: s.date }
      },
      { isolationLevel: "Serializable" },
    )
  } catch (e) {
    if (e && typeof e === "object" && "code" in e && e.code === "P2034") return { ok: false, error: "Posti appena occupati, riprova" }
    const forPeople = e instanceof Error && e.constructor === Error
    return { ok: false, error: forPeople ? e.message : "Non siete riusciti a entrare, riprova" }
  }
  const when = formatWhen(session.date)
  await post(threadId, me.id, `Siamo dentro in coppia: ${session.title}, ${when}, ${session.location}. Se non puoi, esci dalla partita.\n/sessions/${sessionId}`)
  await notify([otherId], { title: `${firstName(me)} vi ha messi in coppia`, body: `${when} · ${session.location}`, url: `/sessions/${sessionId}` })
  revalidatePath(`/sessions/${sessionId}`)
  revalidatePath("/sessions")
  revalidatePath(`/messaggi/${threadId}`)
  return { ok: true, sessionId }
}
