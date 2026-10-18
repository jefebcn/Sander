"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { getCurrentPlayer } from "@/lib/getCurrentPlayer"
import { formatWhen } from "@/lib/datetime"
import { sessionDateError } from "@/lib/sessionRules"
import { romeDayStart } from "@/lib/romeMonth"
import { isBlockedPair, blockedWith } from "@/lib/scopri/blocks"
import { DUO_LIKES_PER_DAY } from "@/lib/scopri/rules"
import { notify, postMessages } from "@/lib/scopri/server"
import {
  activeDuoOf,
  sentInviteOf,
  duoDeck,
  duoLikesUsedToday,
  createDuoMatch,
  duoName,
  DUO_SELECT,
} from "@/lib/scopri/duos"
import {
  DuoInviteSchema,
  DuoRefSchema,
  DuoRespondSchema,
  DuoUpdateSchema,
  DuoLikeSchema,
  DuoRespondLikeSchema,
  DuoGameSchema,
} from "@/lib/validators/scopri.schema"

/* ────────────────────────────────────────────────────────────────────────── */
/*  Coppie (2v2) actions. Public endpoints: every one validates its input and */
/*  acts only for the signed-in player and the pair they belong to.           */
/* ────────────────────────────────────────────────────────────────────────── */

async function requireMe() {
  const me = await getCurrentPlayer()
  if (!me) throw new Error("Non autenticato")
  return me
}

async function requireMyDuo(meId: string) {
  const duo = await activeDuoOf(meId)
  if (!duo) throw new Error("Prima forma una coppia")
  return duo
}

function firstName(p: { firstName: string | null; name: string }): string {
  return p.firstName?.trim() || p.name.split(" ")[0]
}

function refresh() {
  revalidatePath("/scopri/coppie")
  revalidatePath("/scopri")
}

export async function inviteDuoPartner(input: unknown) {
  const data = DuoInviteSchema.parse(input)
  const me = await requireMe()
  if (data.partnerId === me.id) throw new Error("Scegli un compagno")
  if (await activeDuoOf(me.id)) throw new Error("Sei già in una coppia: lasciala prima di formarne un'altra")
  if (await sentInviteOf(me.id)) throw new Error("Hai già un invito in attesa")
  const partner = await db.player.findUnique({
    where: { id: data.partnerId },
    select: { id: true, userId: true, name: true },
  })
  if (!partner?.userId) throw new Error("Giocatore non trovato")
  if (await isBlockedPair(me.id, partner.id)) throw new Error("Giocatore non trovato")
  if (await activeDuoOf(partner.id)) throw new Error("Gioca già in un'altra coppia")

  const duo = await db.duo.create({
    data: { aId: me.id, bId: partner.id, name: data.name || null, motto: data.motto || null },
    select: { id: true },
  })
  await notify([partner.id], {
    title: `${firstName(me)} ti vuole in coppia`,
    body: "Formate una coppia per il 2v2 e sfidate le altre",
    url: "/scopri/coppie",
  })
  refresh()
  return { duoId: duo.id }
}

export async function respondDuoInvite(input: unknown) {
  const { duoId, accept } = DuoRespondSchema.parse(input)
  const me = await requireMe()
  const duo = await db.duo.findUnique({ where: { id: duoId }, select: { id: true, aId: true, bId: true, status: true } })
  if (!duo || duo.bId !== me.id || duo.status !== "PENDING") throw new Error("Invito non trovato")
  const now = new Date()
  if (!accept) {
    await db.duo.update({ where: { id: duoId }, data: { status: "ENDED", endedAt: now } })
    refresh()
    return { ok: true as const }
  }
  if (await activeDuoOf(me.id)) throw new Error("Sei già in una coppia")
  if (await activeDuoOf(duo.aId)) throw new Error("Ha già formato un'altra coppia")
  await db.$transaction([
    db.duo.update({ where: { id: duoId }, data: { status: "ACTIVE", acceptedAt: now } }),
    // My own pending invite to someone else is now moot.
    db.duo.updateMany({ where: { aId: me.id, status: "PENDING" }, data: { status: "ENDED", endedAt: now } }),
  ])
  await notify([duo.aId], {
    title: `${firstName(me)} ha accettato`,
    body: "La vostra coppia è pronta: cercate i vostri avversari",
    url: "/scopri/coppie",
  })
  refresh()
  return { ok: true as const }
}

export async function leaveDuo(input: unknown) {
  const { duoId } = DuoRefSchema.parse(input)
  const me = await requireMe()
  const duo = await db.duo.findUnique({ where: { id: duoId }, select: { aId: true, bId: true, status: true } })
  if (!duo || (duo.aId !== me.id && duo.bId !== me.id) || duo.status === "ENDED") throw new Error("Coppia non trovata")
  await db.duo.update({ where: { id: duoId }, data: { status: "ENDED", endedAt: new Date() } })
  refresh()
  return { ok: true as const }
}

export async function updateDuo(input: unknown) {
  const data = DuoUpdateSchema.parse(input)
  const me = await requireMe()
  const duo = await db.duo.findUnique({ where: { id: data.duoId }, select: { aId: true, bId: true, status: true } })
  if (!duo || (duo.aId !== me.id && duo.bId !== me.id) || duo.status === "ENDED") throw new Error("Coppia non trovata")
  await db.duo.update({
    where: { id: data.duoId },
    data: {
      ...(data.name !== undefined ? { name: data.name || null } : {}),
      ...(data.motto !== undefined ? { motto: data.motto || null } : {}),
    },
  })
  refresh()
  return { ok: true as const }
}

export async function getDuoDeck() {
  const me = await requireMe()
  const mine = await requireMyDuo(me.id)
  const now = new Date()
  const [cards, used] = await Promise.all([duoDeck(mine, now), duoLikesUsedToday(mine.id, now)])
  return { cards, likesLeft: Math.max(0, DUO_LIKES_PER_DAY - used) }
}

async function otherDuoFor(meDuoId: string, toDuoId: string, memberIds: string[]) {
  if (toDuoId === meDuoId) throw new Error("È la tua coppia")
  const other = await db.duo.findUnique({ where: { id: toDuoId }, select: DUO_SELECT })
  if (!other || other.status !== "ACTIVE") throw new Error("Questa coppia non c'è più")
  const blocked = new Set<string>()
  for (const id of memberIds) for (const b of await blockedWith(id)) blocked.add(b)
  if (blocked.has(other.aId) || blocked.has(other.bId)) throw new Error("Questa coppia non c'è più")
  if ([other.aId, other.bId].some((id) => memberIds.includes(id))) throw new Error("Questa coppia non c'è più")
  return other
}

export async function likeDuo(input: unknown) {
  const { toDuoId, comment } = DuoLikeSchema.parse(input)
  const me = await requireMe()
  const mine = await requireMyDuo(me.id)
  const other = await otherDuoFor(mine.id, toDuoId, [mine.aId, mine.bId])
  const now = new Date()

  try {
    await db.$transaction(
      async (tx) => {
        const existing = await tx.duoSwipe.findUnique({
          where: { fromDuoId_toDuoId: { fromDuoId: mine.id, toDuoId } },
          select: { liked: true },
        })
        if (existing?.liked) throw new Error("La tua coppia ha già mandato un like")
        const used = await tx.duoSwipe.count({
          where: { fromDuoId: mine.id, liked: true, reply: false, createdAt: { gte: romeDayStart(now) } },
        })
        if (used >= DUO_LIKES_PER_DAY) throw new Error("Avete finito i like di coppia di oggi")
        const like = { byId: me.id, liked: true, comment: comment?.trim() || null, status: "PENDING" as const, reply: false }
        await tx.duoSwipe.upsert({
          where: { fromDuoId_toDuoId: { fromDuoId: mine.id, toDuoId } },
          create: { fromDuoId: mine.id, toDuoId, ...like },
          update: { ...like, createdAt: now },
        })
      },
      { isolationLevel: "Serializable" },
    )
  } catch (e) {
    if (e && typeof e === "object" && "code" in e && e.code === "P2034") throw new Error("Un attimo di traffico, riprova.")
    throw e
  }

  const theirs = await db.duoSwipe.findUnique({ where: { fromDuoId_toDuoId: { fromDuoId: toDuoId, toDuoId: mine.id } } })
  if (theirs?.liked && theirs.status === "PENDING") {
    await db.duoSwipe.updateMany({
      where: { OR: [{ id: theirs.id }, { fromDuoId: mine.id, toDuoId }] },
      data: { status: "MATCHED" },
    })
    const opening = [
      theirs.comment ? { senderId: theirs.byId, body: theirs.comment } : null,
      comment?.trim() ? { senderId: me.id, body: comment.trim() } : null,
    ].filter((m): m is { senderId: string; body: string } => !!m)
    const { threadId } = await createDuoMatch(mine, other, opening)
    await notify([mine.aId, mine.bId, other.aId, other.bId].filter((id) => id !== me.id), {
      title: "Sfida accettata!",
      body: `${duoName(mine)} vs ${duoName(other)}: organizzate il 2v2`,
      url: `/messaggi/${threadId}`,
    })
    refresh()
    return { matched: true as const, threadId }
  }

  const partnerId = mine.aId === me.id ? mine.bId : mine.aId
  await notify([other.aId, other.bId], {
    title: `${duoName(mine)} vi sfida`,
    body: comment?.trim() ? `«${comment.trim().slice(0, 100)}»` : "Una coppia vuole giocare contro di voi",
    url: "/scopri/coppie",
  })
  await notify([partnerId], {
    title: `${firstName(me)} ha sfidato ${duoName(other)}`,
    body: "Se accettano, si apre la chat a quattro",
    url: "/scopri/coppie",
  })
  return { matched: false as const }
}

export async function skipDuo(input: unknown) {
  const { duoId } = DuoRefSchema.parse(input)
  const me = await requireMe()
  const mine = await requireMyDuo(me.id)
  if (duoId === mine.id) return { ok: true as const }
  const existing = await db.duoSwipe.findUnique({
    where: { fromDuoId_toDuoId: { fromDuoId: mine.id, toDuoId: duoId } },
    select: { liked: true },
  })
  if (existing?.liked) return { ok: true as const }
  const target = await db.duo.findUnique({ where: { id: duoId }, select: { id: true } })
  if (!target) return { ok: true as const }
  await db.duoSwipe.upsert({
    where: { fromDuoId_toDuoId: { fromDuoId: mine.id, toDuoId: duoId } },
    create: { fromDuoId: mine.id, toDuoId: duoId, byId: me.id, liked: false },
    update: { liked: false, byId: me.id, createdAt: new Date() },
  })
  return { ok: true as const }
}

export async function respondDuoLike(input: unknown) {
  const { fromDuoId, accept } = DuoRespondLikeSchema.parse(input)
  const me = await requireMe()
  const mine = await requireMyDuo(me.id)
  const like = await db.duoSwipe.findUnique({ where: { fromDuoId_toDuoId: { fromDuoId, toDuoId: mine.id } } })
  if (!like || !like.liked || like.status !== "PENDING") throw new Error("Questa sfida non c'è più")
  const now = new Date()
  if (!accept) {
    await db.$transaction([
      db.duoSwipe.update({ where: { id: like.id }, data: { status: "DECLINED" } }),
      db.duoSwipe.upsert({
        where: { fromDuoId_toDuoId: { fromDuoId: mine.id, toDuoId: fromDuoId } },
        create: { fromDuoId: mine.id, toDuoId: fromDuoId, byId: me.id, liked: false },
        update: { liked: false, byId: me.id, createdAt: now },
      }),
    ])
    refresh()
    return { matched: false as const }
  }
  const other = await otherDuoFor(mine.id, fromDuoId, [mine.aId, mine.bId])
  await db.$transaction([
    db.duoSwipe.update({ where: { id: like.id }, data: { status: "MATCHED" } }),
    db.duoSwipe.upsert({
      where: { fromDuoId_toDuoId: { fromDuoId: mine.id, toDuoId: fromDuoId } },
      create: { fromDuoId: mine.id, toDuoId: fromDuoId, byId: me.id, liked: true, reply: true, status: "MATCHED" },
      update: { liked: true, reply: true, status: "MATCHED", byId: me.id, createdAt: now },
    }),
  ])
  const opening = like.comment ? [{ senderId: like.byId, body: like.comment }] : []
  const { threadId } = await createDuoMatch(mine, other, opening)
  await notify([mine.aId, mine.bId, other.aId, other.bId].filter((id) => id !== me.id), {
    title: "Sfida accettata!",
    body: `${duoName(mine)} vs ${duoName(other)}: organizzate il 2v2`,
    url: `/messaggi/${threadId}`,
  })
  refresh()
  return { matched: true as const, threadId }
}

/**
 * The 2v2 between two matched pairs: a full match on the calendar, each pair
 * on its own side, and the link in the group chat.
 */
export async function proposeDuoGame(input: unknown) {
  const data = DuoGameSchema.parse(input)
  const me = await requireMe()
  const dateError = sessionDateError(data.date)
  if (dateError) throw new Error(dateError)
  const match = await db.duoMatch.findUnique({
    where: { id: data.duoMatchId },
    select: { id: true, threadId: true, aDuo: { select: DUO_SELECT }, bDuo: { select: DUO_SELECT } },
  })
  if (!match) throw new Error("Sfida non trovata")
  const mineFirst = [match.aDuo.aId, match.aDuo.bId].includes(me.id)
  const mineSecond = [match.bDuo.aId, match.bDuo.bId].includes(me.id)
  if (!mineFirst && !mineSecond) throw new Error("Sfida non trovata")
  const [us, them] = mineFirst ? [match.aDuo, match.bDuo] : [match.bDuo, match.aDuo]

  const session = await db.session.create({
    data: {
      organizerId: me.id,
      title: `${duoName(us)} vs ${duoName(them)}`.slice(0, 80),
      location: data.location,
      city: data.city ?? null,
      date: data.date,
      format: "TWO_VS_TWO",
      maxPlayers: 4,
      status: "FULL",
      paymentType: "FREE",
      participants: {
        create: [
          { playerId: us.aId, team: 0 },
          { playerId: us.bId, team: 0 },
          { playerId: them.aId, team: 1 },
          { playerId: them.bId, team: 1 },
        ],
      },
    },
    select: { id: true, date: true },
  })
  await db.duoMatch.update({ where: { id: match.id }, data: { sessionId: session.id } })
  if (match.threadId) {
    await postMessages(match.threadId, [
      { senderId: me.id, body: `2v2 in calendario: ${formatWhen(session.date)}, ${data.location}.\n/sessions/${session.id}` },
    ])
  }
  await notify([us.aId, us.bId, them.aId, them.bId].filter((id) => id !== me.id), {
    title: "Il 2v2 è in calendario",
    body: `${formatWhen(session.date)} · ${data.location}`,
    url: `/sessions/${session.id}`,
  })
  revalidatePath("/sessions")
  refresh()
  return { sessionId: session.id }
}
