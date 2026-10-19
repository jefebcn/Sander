"use server"

import { revalidatePath } from "next/cache"
import { after } from "next/server"
import { db } from "@/lib/db"
import { getCurrentPlayer } from "@/lib/getCurrentPlayer"
import { formatWhen, dayKey } from "@/lib/datetime"
import { romeDayStart, romeWeekStart } from "@/lib/romeMonth"
import { sessionDateError } from "@/lib/sessionRules"
import { nudgeForSession } from "@/lib/nudges"
import { promptText } from "@/lib/scopri/prompts"
import {
  nextLikeSource,
  nextAceSource,
  mutuallyEligible,
  likeMessage,
  ageOn,
  SC_OFFERS,
  MAX_PHOTOS,
  YOUR_TURN_LIMIT,
} from "@/lib/scopri/rules"
import { isBlockedPair } from "@/lib/scopri/blocks"
import { freeSlotLabel } from "@/lib/scopri/reliability"
import {
  loadCardRow,
  readiness,
  sideOf,
  buildDeck,
  allowance,
  createMatch,
  postMessages,
  notify,
  waitingCount,
  markReadyIfComplete,
  type CardRow,
} from "@/lib/scopri/server"
import {
  SendLikeSchema,
  PlayerRefSchema,
  RespondLikeSchema,
  BlockSchema,
  MatchRefSchema,
  PlayedSchema,
  BuyExtraSchema,
  DiscoverSettingsSchema,
  PromptSchema,
  PromptRefSchema,
  PhotoRefSchema,
  ReorderPhotosSchema,
  ProposeGameSchema,
  FreeTodaySchema,
  QuickStartSchema,
} from "@/lib/validators/scopri.schema"

/* ────────────────────────────────────────────────────────────────────────── */
/*  Scopri actions. Public endpoints: every one validates its input and works  */
/*  only on behalf of the signed-in player.                                    */
/* ────────────────────────────────────────────────────────────────────────── */

async function requireMe() {
  const me = await getCurrentPlayer()
  if (!me) throw new Error("Non autenticato")
  return me
}

/** The signed-in player, only if their Scopri profile is complete and active. */
async function requireReadyMe(now: Date): Promise<CardRow> {
  const me = await requireMe()
  const row = await loadCardRow(me.id)
  if (!row || readiness(row, now).length > 0) throw new Error("Completa prima il tuo profilo Scopri")
  if (row.discoverProfile?.paused) throw new Error("Il tuo profilo è in pausa: riattivalo per mandare like")
  return row
}

function firstName(row: { firstName: string | null; name: string }): string {
  return row.firstName?.trim() || row.name.split(" ")[0]
}

function busyRetry(e: unknown): never {
  if (e && typeof e === "object" && "code" in e && e.code === "P2034") throw new Error("Un attimo di traffico, riprova.")
  throw e
}

function refreshScopri() {
  revalidatePath("/scopri")
  revalidatePath("/scopri/like")
  revalidatePath("/scopri/match")
}

// ── Deck ─────────────────────────────────────────────────────────────────────

export async function getDeck() {
  const now = new Date()
  const me = await requireReadyMe(now)
  const [cards, left, waiting] = await Promise.all([buildDeck(me, now), allowance(me.id, now), waitingCount(me.id)])
  return { cards, allowance: left, gated: waiting >= YOUR_TURN_LIMIT }
}

export async function sendLike(input: unknown) {
  const data = SendLikeSchema.parse(input)
  const now = new Date()
  const me = await requireReadyMe(now)
  if (data.toId === me.id) throw new Error("Non puoi mettere like a te stesso")

  const gone = "Questo giocatore non è più su Scopri"
  const to = await loadCardRow(data.toId)
  if (!to || !to.userId || to.discoverProfile?.paused || readiness(to, now).length > 0) throw new Error(gone)
  if (await isBlockedPair(me.id, to.id)) throw new Error(gone)
  if (!mutuallyEligible(sideOf(me), sideOf(to))) throw new Error(gone)
  if ((await waitingCount(me.id)) >= YOUR_TURN_LIMIT) {
    throw new Error("Prima rispondi a chi ti aspetta nei match")
  }

  let targetLabel: string | null = null
  if (data.target === "PHOTO") {
    const photo =
      to.discoverPhotos.find((p) => p.id === data.targetId) ??
      (data.targetId === "avatar" && to.avatarUrl ? { url: to.avatarUrl } : null)
    if (!photo) throw new Error("Questa foto non c'è più")
    targetLabel = photo.url
  } else if (data.target === "PROMPT") {
    const prompt = to.discoverPrompts.find((p) => p.id === data.targetId)
    if (!prompt) throw new Error("Questa risposta non c'è più")
    targetLabel = `${promptText(prompt.promptKey)} ${prompt.answer}`
  }
  const comment = data.comment?.trim() || null
  const isAce = data.ace === true

  try {
    await db.$transaction(
      async (tx) => {
        const existing = await tx.playerSwipe.findUnique({
          where: { fromId_toId: { fromId: me.id, toId: to.id } },
          select: { liked: true },
        })
        if (existing?.liked) throw new Error("Gli hai già mandato un like")
        const profile = await tx.discoverProfile.findUnique({
          where: { playerId: me.id },
          select: { bonusLikes: true, bonusAces: true },
        })
        if (isAce) {
          const used = await tx.playerSwipe.count({
            where: { fromId: me.id, isAce: true, createdAt: { gte: romeWeekStart(now) } },
          })
          const source = nextAceSource(used, profile?.bonusAces ?? 0)
          if (!source) throw new Error("Hai già usato l'Ace di questa settimana")
          if (source === "bonus") {
            const r = await tx.discoverProfile.updateMany({
              where: { playerId: me.id, bonusAces: { gt: 0 } },
              data: { bonusAces: { decrement: 1 } },
            })
            if (r.count === 0) throw new Error("Hai già usato l'Ace di questa settimana")
          }
        } else {
          const used = await tx.playerSwipe.count({
            where: { fromId: me.id, liked: true, isAce: false, reply: false, createdAt: { gte: romeDayStart(now) } },
          })
          const source = nextLikeSource(used, profile?.bonusLikes ?? 0)
          if (!source) throw new Error("Hai finito i like di oggi")
          if (source === "bonus") {
            const r = await tx.discoverProfile.updateMany({
              where: { playerId: me.id, bonusLikes: { gt: 0 } },
              data: { bonusLikes: { decrement: 1 } },
            })
            if (r.count === 0) throw new Error("Hai finito i like di oggi")
          }
        }
        const like = {
          liked: true,
          target: data.target,
          targetId: data.target === "PROFILE" ? null : (data.targetId ?? null),
          targetLabel,
          comment,
          isAce,
          reply: false,
          status: "PENDING" as const,
          respondedAt: null,
        }
        await tx.playerSwipe.upsert({
          where: { fromId_toId: { fromId: me.id, toId: to.id } },
          create: { fromId: me.id, toId: to.id, ...like },
          update: { ...like, createdAt: now },
        })
      },
      { isolationLevel: "Serializable" },
    )
  } catch (e) {
    busyRetry(e)
  }

  const myName = firstName(me)
  const theirs = await db.playerSwipe.findUnique({ where: { fromId_toId: { fromId: to.id, toId: me.id } } })
  if (theirs?.liked && theirs.status === "PENDING") {
    // They had already liked me: it's a match.
    await db.playerSwipe.updateMany({
      where: { OR: [{ id: theirs.id }, { fromId: me.id, toId: to.id }] },
      data: { status: "MATCHED", respondedAt: now },
    })
    const opening = [
      { senderId: to.id, body: likeMessage(theirs.target, theirs.targetLabel, theirs.comment) },
      { senderId: me.id, body: likeMessage(data.target, targetLabel, comment) },
    ].filter((m): m is { senderId: string; body: string } => !!m.body)
    const { threadId } = await createMatch(me.id, to.id, opening)
    await notify([to.id], {
      title: "È un match!",
      body: `Tu e ${myName} volete giocare insieme. Scrivi per primo.`,
      url: `/messaggi/${threadId}`,
    })
    refreshScopri()
    return { matched: true as const, threadId, name: firstName(to), photo: to.discoverPhotos[0]?.url ?? to.avatarUrl }
  }

  await notify([to.id], {
    title: isAce ? `${myName} ti ha mandato un Ace` : `${myName} vuole giocare con te`,
    body: comment ? `«${comment.slice(0, 100)}»` : "Guarda chi ti vuole in squadra",
    url: "/scopri/like",
  })
  return { matched: false as const, allowance: await allowance(me.id, now) }
}

export async function skipPlayer(input: unknown) {
  const { playerId } = PlayerRefSchema.parse(input)
  const me = await requireMe()
  if (playerId === me.id) return { ok: true as const }
  const existing = await db.playerSwipe.findUnique({
    where: { fromId_toId: { fromId: me.id, toId: playerId } },
    select: { liked: true },
  })
  if (existing?.liked) return { ok: true as const }
  const target = await db.player.findUnique({ where: { id: playerId }, select: { id: true } })
  if (!target) return { ok: true as const }
  await db.playerSwipe.upsert({
    where: { fromId_toId: { fromId: me.id, toId: playerId } },
    create: { fromId: me.id, toId: playerId, liked: false },
    update: { liked: false, createdAt: new Date() },
  })
  return { ok: true as const }
}

// ── Ti vogliono ──────────────────────────────────────────────────────────────

export async function respondToLike(input: unknown) {
  const data = RespondLikeSchema.parse(input)
  const now = new Date()
  const me = await requireMe()
  const like = await db.playerSwipe.findUnique({
    where: { fromId_toId: { fromId: data.fromId, toId: me.id } },
    include: { from: { select: { firstName: true, name: true } } },
  })
  if (!like || !like.liked || like.status !== "PENDING") throw new Error("Questo like non c'è più")
  if (await isBlockedPair(me.id, data.fromId)) throw new Error("Questo like non c'è più")

  if (!data.accept) {
    await db.$transaction([
      db.playerSwipe.update({ where: { id: like.id }, data: { status: "DECLINED", respondedAt: now } }),
      db.playerSwipe.upsert({
        where: { fromId_toId: { fromId: me.id, toId: data.fromId } },
        create: { fromId: me.id, toId: data.fromId, liked: false },
        update: { liked: false, createdAt: now },
      }),
    ])
    refreshScopri()
    return { matched: false as const }
  }

  const ready = await loadCardRow(me.id)
  if (!ready || readiness(ready, now).length > 0) throw new Error("Completa prima il tuo profilo Scopri")
  const comment = data.comment?.trim() || null
  await db.$transaction([
    db.playerSwipe.update({ where: { id: like.id }, data: { status: "MATCHED", respondedAt: now } }),
    db.playerSwipe.upsert({
      where: { fromId_toId: { fromId: me.id, toId: data.fromId } },
      create: { fromId: me.id, toId: data.fromId, liked: true, reply: true, status: "MATCHED", respondedAt: now, comment },
      update: { liked: true, reply: true, status: "MATCHED", respondedAt: now, comment, createdAt: now },
    }),
  ])
  const opening = [
    { senderId: data.fromId, body: likeMessage(like.target, like.targetLabel, like.comment) },
    { senderId: me.id, body: comment },
  ].filter((m): m is { senderId: string; body: string } => !!m.body)
  const { threadId } = await createMatch(me.id, data.fromId, opening)
  await notify([data.fromId], {
    title: "È un match!",
    body: `${firstName(me)} ha accettato il tuo like. Organizzate la partita.`,
    url: `/messaggi/${threadId}`,
  })
  refreshScopri()
  return { matched: true as const, threadId }
}

// ── Sicurezza ────────────────────────────────────────────────────────────────

function adminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? process.env.ADMIN_EMAIL ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
}

async function blockPair(meId: string, otherId: string, report?: { reason: string; note?: string }, reason?: string) {
  const now = new Date()
  await db.playerBlock.upsert({
    where: { blockerId_blockedId: { blockerId: meId, blockedId: otherId } },
    create: {
      blockerId: meId,
      blockedId: otherId,
      reported: !!report,
      reason: report?.reason ?? reason ?? null,
      note: report?.note ?? null,
    },
    update: report ? { reported: true, reason: report.reason, note: report.note ?? null } : {},
  })
  await db.playerMatch.updateMany({
    where: { OR: [{ aId: meId, bId: otherId }, { aId: otherId, bId: meId }], endedAt: null },
    data: { endedAt: now },
  })
  await db.playerSwipe.updateMany({
    where: { OR: [{ fromId: meId, toId: otherId }, { fromId: otherId, toId: meId }], status: "PENDING" },
    data: { status: "DECLINED", respondedAt: now },
  })
}

export async function blockPlayer(input: unknown) {
  const data = BlockSchema.parse(input)
  const me = await requireMe()
  if (data.playerId === me.id) throw new Error("Non puoi bloccare te stesso")
  const other = await db.player.findUnique({ where: { id: data.playerId }, select: { id: true, name: true } })
  if (!other) throw new Error("Giocatore non trovato")
  await blockPair(me.id, other.id, data.report)

  if (data.report) {
    const emails = adminEmails()
    if (emails.length) {
      const admins = await db.player.findMany({
        where: { user: { email: { in: emails, mode: "insensitive" } } },
        select: { id: true },
      })
      await notify(
        admins.map((a) => a.id),
        { title: "Nuova segnalazione su Scopri", body: `${other.name}: ${data.report.reason}`, url: "/admin/segnalazioni" },
      )
    }
  }
  refreshScopri()
  revalidatePath("/messaggi")
  return { ok: true as const }
}

export async function unmatch(input: unknown) {
  const { matchId } = MatchRefSchema.parse(input)
  const me = await requireMe()
  const match = await db.playerMatch.findUnique({ where: { id: matchId }, select: { aId: true, bId: true } })
  if (!match || (match.aId !== me.id && match.bId !== me.id)) throw new Error("Match non trovato")
  // Unmatching is a quiet block: no more cards, likes or messages between you.
  await blockPair(me.id, match.aId === me.id ? match.bId : match.aId, undefined, "UNMATCH")
  refreshScopri()
  revalidatePath("/messaggi")
  return { ok: true as const }
}

export async function answerPlayed(input: unknown) {
  const { matchId, played } = PlayedSchema.parse(input)
  const me = await requireMe()
  const match = await db.playerMatch.findUnique({ where: { id: matchId }, select: { aId: true, bId: true } })
  if (!match || (match.aId !== me.id && match.bId !== me.id)) throw new Error("Match non trovato")
  await db.playerMatch.update({
    where: { id: matchId },
    data: match.aId === me.id ? { aPlayed: played } : { bPlayed: played },
  })
  revalidatePath("/scopri/match")
  return { ok: true as const }
}

// ── Extra con gli SC ─────────────────────────────────────────────────────────

export async function buyScopriExtra(input: unknown) {
  const { offer } = BuyExtraSchema.parse(input)
  const me = await requireMe()
  const o = SC_OFFERS[offer]
  const now = new Date()
  await db.$transaction(async (tx) => {
    const paid = await tx.player.updateMany({
      where: { id: me.id, sanderCredits: { gte: o.sc } },
      data: { sanderCredits: { decrement: o.sc } },
    })
    if (paid.count === 0) throw new Error(`Ti servono ${o.sc} SC: ricarica dal profilo`)
    await tx.creditSpend.create({ data: { playerId: me.id, kind: `scopri_${offer}`, credits: o.sc } })
    const profile = await tx.discoverProfile.upsert({
      where: { playerId: me.id },
      create: { playerId: me.id },
      update: {},
      select: { likesUnlockedUntil: true },
    })
    if (offer === "likes") {
      await tx.discoverProfile.update({ where: { playerId: me.id }, data: { bonusLikes: { increment: SC_OFFERS.likes.amount } } })
    } else if (offer === "ace") {
      await tx.discoverProfile.update({ where: { playerId: me.id }, data: { bonusAces: { increment: SC_OFFERS.ace.amount } } })
    } else {
      const from = profile.likesUnlockedUntil && profile.likesUnlockedUntil > now ? profile.likesUnlockedUntil : now
      await tx.discoverProfile.update({
        where: { playerId: me.id },
        data: { likesUnlockedUntil: new Date(from.getTime() + SC_OFFERS.reveal.hours * 3600_000) },
      })
    }
  })
  refreshScopri()
  revalidatePath("/profile")
  return { ok: true as const, allowance: await allowance(me.id, now) }
}

// ── Il tuo profilo Scopri ────────────────────────────────────────────────────

export async function saveDiscoverSettings(input: unknown) {
  const data = DiscoverSettingsSchema.parse(input)
  const me = await requireMe()

  const playerData: { birthDate?: Date; homeCity?: string; gender?: string; preferredRole?: "BLOCKER" | "DEFENDER" } = {}
  if (data.birthDate) {
    const d = new Date(`${data.birthDate}T00:00:00Z`)
    const age = ageOn(d)
    if (Number.isNaN(d.getTime()) || age < 0 || age > 100) throw new Error("Data di nascita non valida")
    playerData.birthDate = d
  }
  if (data.homeCity) playerData.homeCity = data.homeCity
  if (data.gender) playerData.gender = data.gender
  if (data.preferredRole) playerData.preferredRole = data.preferredRole
  if (Object.keys(playerData).length) await db.player.update({ where: { id: me.id }, data: playerData })

  const profileData = {
    ...(data.side !== undefined ? { side: data.side } : {}),
    ...(data.lookingFor ? { lookingFor: data.lookingFor } : {}),
    ...(data.paused !== undefined ? { paused: data.paused } : {}),
    ...(data.prefCities ? { prefCities: data.prefCities } : {}),
    ...(data.prefGender !== undefined ? { prefGender: data.prefGender } : {}),
    ...(data.prefRole !== undefined ? { prefRole: data.prefRole } : {}),
    ...(data.maxGap ? { maxGap: data.maxGap } : {}),
  }
  await db.discoverProfile.upsert({
    where: { playerId: me.id },
    create: { playerId: me.id, ...profileData },
    update: profileData,
  })
  await markReadyIfComplete(me.id)
  refreshScopri()
  revalidatePath("/scopri/profilo")
  return { ok: true as const }
}

export async function savePrompt(input: unknown) {
  const data = PromptSchema.parse(input)
  const me = await requireMe()
  const dup = await db.playerPrompt.findFirst({
    where: { playerId: me.id, promptKey: data.promptKey, position: { not: data.position } },
    select: { id: true },
  })
  if (dup) throw new Error("Hai già risposto a questa domanda: scegline un'altra")
  await db.playerPrompt.upsert({
    where: { playerId_position: { playerId: me.id, position: data.position } },
    create: { playerId: me.id, position: data.position, promptKey: data.promptKey, answer: data.answer },
    update: { promptKey: data.promptKey, answer: data.answer },
  })
  await db.discoverProfile.upsert({ where: { playerId: me.id }, create: { playerId: me.id }, update: {} })
  await markReadyIfComplete(me.id)
  revalidatePath("/scopri/profilo")
  revalidatePath("/scopri")
  return { ok: true as const }
}

export async function deletePrompt(input: unknown) {
  const { position } = PromptRefSchema.parse(input)
  const me = await requireMe()
  await db.playerPrompt.deleteMany({ where: { playerId: me.id, position } })
  revalidatePath("/scopri/profilo")
  return { ok: true as const }
}

async function renumberPhotos(playerId: string) {
  const photos = await db.playerPhoto.findMany({ where: { playerId }, orderBy: { position: "asc" }, select: { id: true } })
  await db.$transaction(photos.map((p, i) => db.playerPhoto.update({ where: { id: p.id }, data: { position: i } })))
}

export async function deletePhoto(input: unknown) {
  const { photoId } = PhotoRefSchema.parse(input)
  const me = await requireMe()
  await db.playerPhoto.deleteMany({ where: { id: photoId, playerId: me.id } })
  await renumberPhotos(me.id)
  revalidatePath("/scopri/profilo")
  return { ok: true as const }
}

export async function reorderPhotos(input: unknown) {
  const { ids } = ReorderPhotosSchema.parse(input)
  const me = await requireMe()
  const mine = await db.playerPhoto.findMany({ where: { playerId: me.id }, select: { id: true } })
  const set = new Set(mine.map((p) => p.id))
  if (ids.length !== set.size || ids.some((id) => !set.has(id))) throw new Error("Ordine non valido")
  await db.$transaction(ids.map((id, i) => db.playerPhoto.update({ where: { id }, data: { position: i } })))
  revalidatePath("/scopri/profilo")
  return { ok: true as const }
}

/** Put the profile picture in the first free photo slot. */
export async function addAvatarAsPhoto() {
  const me = await requireMe()
  if (!me.avatarUrl) throw new Error("Non hai ancora una foto profilo")
  const count = await db.playerPhoto.count({ where: { playerId: me.id } })
  if (count >= MAX_PHOTOS) throw new Error(`Al massimo ${MAX_PHOTOS} foto`)
  const already = await db.playerPhoto.findFirst({ where: { playerId: me.id, url: me.avatarUrl }, select: { id: true } })
  if (!already) await db.playerPhoto.create({ data: { playerId: me.id, url: me.avatarUrl, position: count } })
  await markReadyIfComplete(me.id)
  revalidatePath("/scopri/profilo")
  return { ok: true as const }
}

// ── Dal match alla sabbia ────────────────────────────────────────────────────

/**
 * Turn a match into a 2v2: the two of you on the same side, two seats left
 * for opponents, the link posted in your chat and nearby players told.
 */
export async function proposeGameTogether(input: unknown) {
  const data = ProposeGameSchema.parse(input)
  const me = await requireMe()
  const dateError = sessionDateError(data.date)
  if (dateError) throw new Error(dateError)
  const match = await db.playerMatch.findUnique({ where: { id: data.matchId } })
  if (!match || match.endedAt || (match.aId !== me.id && match.bId !== me.id)) throw new Error("Match non trovato")
  const otherId = match.aId === me.id ? match.bId : match.aId
  if (await isBlockedPair(me.id, otherId)) throw new Error("Match non trovato")

  const session = await db.session.create({
    data: {
      organizerId: me.id,
      title: `2v2 — ${data.location}`,
      location: data.location,
      city: data.city ?? null,
      date: data.date,
      format: "TWO_VS_TWO",
      maxPlayers: 4,
      paymentType: "FREE",
      participants: { create: [{ playerId: me.id, team: 0 }, { playerId: otherId, team: 0 }] },
    },
    select: { id: true, date: true },
  })
  if (match.threadId) {
    await postMessages(match.threadId, [
      {
        senderId: me.id,
        body: `Partita creata: ${formatWhen(session.date)}, ${data.location}. Noi due in coppia, cerchiamo due avversari.\n/sessions/${session.id}`,
      },
    ])
  }
  await notify([otherId], {
    title: `${firstName(me)} ha creato la vostra partita`,
    body: `${formatWhen(session.date)} · ${data.location}`,
    url: `/sessions/${session.id}`,
  })
  if (session.date.getTime() - Date.now() < 7 * 24 * 3600_000) {
    after(() => nudgeForSession(session.id, "new").catch(() => {}))
  }
  revalidatePath("/sessions")
  return { sessionId: session.id }
}

/** Count for the Scopri button in the navbar: likes waiting + matches waiting on you. */
export async function getScopriBadge(): Promise<number> {
  const me = await getCurrentPlayer()
  if (!me) return 0
  const [likes, waiting] = await Promise.all([
    db.playerSwipe.count({ where: { toId: me.id, liked: true, status: "PENDING" } }),
    waitingCount(me.id),
  ])
  return likes + waiting
}

/**
 * "Libero oggi": put yourself forward in decks for today, in a slot. Turning it
 * on also tells your matches once a day, since they're the quickest game.
 */
export async function setFreeToday(input: unknown) {
  const { slot } = FreeTodaySchema.parse(input)
  const me = await requireMe()
  const today = dayKey(new Date())
  const profile = await db.discoverProfile.upsert({
    where: { playerId: me.id },
    create: { playerId: me.id },
    update: {},
    select: { freeNotifiedDay: true },
  })
  if (!slot) {
    await db.discoverProfile.update({ where: { playerId: me.id }, data: { freeDay: null, freeSlot: null } })
    refreshScopri()
    return { ok: true as const, notified: 0 }
  }
  await db.discoverProfile.update({ where: { playerId: me.id }, data: { freeDay: today, freeSlot: slot } })

  let notified = 0
  if (profile.freeNotifiedDay !== today) {
    const matches = await db.playerMatch.findMany({
      where: { OR: [{ aId: me.id }, { bId: me.id }], endedAt: null },
      select: { aId: true, bId: true },
      orderBy: { createdAt: "desc" },
      take: 15,
    })
    const ids = matches.map((m) => (m.aId === me.id ? m.bId : m.aId))
    if (ids.length) {
      const when = freeSlotLabel(slot).toLowerCase()
      await notify(ids, {
        title: `${firstName(me)} è libero oggi`,
        body: slot === "ANY" ? "Tutto il giorno: proponi la partita, siete già in match." : `Di ${when}: proponi la partita, siete già in match.`,
        url: "/scopri/match",
      })
      notified = ids.length
    }
    await db.discoverProfile.update({ where: { playerId: me.id }, data: { freeNotifiedDay: today } })
  }
  refreshScopri()
  return { ok: true as const, notified }
}

/**
 * Sign-up's last (optional) step: profile photo as first Scopri photo, three
 * answers, age, what you look for. Returns whether you're live on Scopri.
 */
export async function saveScopriQuickStart(input: unknown) {
  const data = QuickStartSchema.parse(input)
  const me = await requireMe()
  if (data.birthDate) {
    const d = new Date(`${data.birthDate}T00:00:00Z`)
    const age = ageOn(d)
    if (Number.isNaN(d.getTime()) || age < 0 || age > 100) throw new Error("Data di nascita non valida")
    await db.player.update({ where: { id: me.id }, data: { birthDate: d } })
  }
  await db.discoverProfile.upsert({
    where: { playerId: me.id },
    create: { playerId: me.id, lookingFor: data.lookingFor ?? [] },
    update: data.lookingFor ? { lookingFor: data.lookingFor } : {},
  })
  if (data.useAvatar && me.avatarUrl) {
    const count = await db.playerPhoto.count({ where: { playerId: me.id } })
    const already = await db.playerPhoto.findFirst({ where: { playerId: me.id, url: me.avatarUrl }, select: { id: true } })
    if (!already && count < MAX_PHOTOS) {
      await db.playerPhoto.create({ data: { playerId: me.id, url: me.avatarUrl, position: count } })
    }
  }
  await db.$transaction(
    data.prompts.map((p, position) =>
      db.playerPrompt.upsert({
        where: { playerId_position: { playerId: me.id, position } },
        create: { playerId: me.id, position, promptKey: p.promptKey, answer: p.answer },
        update: { promptKey: p.promptKey, answer: p.answer },
      }),
    ),
  )
  const ready = await markReadyIfComplete(me.id)
  refreshScopri()
  return { ready }
}
