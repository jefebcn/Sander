import { db } from "@/lib/db"
import type { Prisma } from "@/generated/prisma/client"
import { NOT_DELETED_PLAYER } from "@/lib/publicPlayer"
import { ratedGames } from "@/lib/rankingEligibility"
import { getDivision } from "@/lib/divisions"
import { dayKey } from "@/lib/datetime"
import { romeDayStart, romeWeekStart } from "@/lib/romeMonth"
import { promptText } from "./prompts"
import {
  ageOn,
  missingSteps,
  mutuallyEligible,
  swipeHides,
  likesLeft,
  acesLeft,
  chatTurn,
  MIN_AGE,
  DEFAULT_MAX_GAP,
  type DealbreakerSide,
  type ChatTurn,
} from "./rules"
import { discoverScore, stableJitter, type DiscoverPerson, type DiscoverScore } from "./score"
import { dailyPairs } from "./stableMatch"
import { blockedWith } from "./blocks"
import { reliabilityPct, isVerified, freeToday, rankKey, type FreeSlot } from "./reliability"

/* ────────────────────────────────────────────────────────────────────────── */
/*  Scopri on the server: who is in the pool, the deck, matches, daily pick.   */
/*  Not a "use server" file: these helpers trust their arguments, so only the  */
/*  actions in actions/scopri.ts (which check who is asking) may call them.   */
/* ────────────────────────────────────────────────────────────────────────── */

export const CARD_SELECT = {
  id: true,
  name: true,
  firstName: true,
  birthDate: true,
  gender: true,
  homeCity: true,
  preferredRole: true,
  avatarUrl: true,
  glickoRating: true,
  matchesWon: true,
  matchesLost: true,
  level: true,
  userId: true,
  sessionsPlayed: true,
  _count: { select: { attendanceEvents: true } },
  discoverProfile: true,
  discoverPhotos: { orderBy: { position: "asc" }, select: { id: true, url: true } },
  discoverPrompts: { orderBy: { position: "asc" }, select: { id: true, promptKey: true, answer: true, position: true } },
  availability: { select: { weekday: true, slot: true } },
} as const satisfies Prisma.PlayerSelect

export type CardRow = Prisma.PlayerGetPayload<{ select: typeof CARD_SELECT }>

/** What a client may see of someone on Scopri: never birth date or gender. */
export interface ScopriCard {
  id: string
  name: string
  age: number | null
  homeCity: string | null
  role: "BLOCKER" | "DEFENDER"
  side: string | null
  lookingFor: string[]
  rating: number
  division: string
  games: number
  /** Completed matches on SANDER (presences). */
  played: number
  /** Share of presences 0–100, null with no history. */
  reliability: number | null
  verified: boolean
  /** "Libero oggi" slot, null if not free today. */
  freeToday: FreeSlot | null
  photos: { id: string; url: string }[]
  prompts: { id: string; key: string; question: string; answer: string }[]
  score?: number
  reasons?: string[]
}

export function toCard(row: CardRow, now: Date = new Date(), score?: DiscoverScore): ScopriCard {
  const photos = row.discoverPhotos.length > 0
    ? row.discoverPhotos
    : row.avatarUrl
      ? [{ id: "avatar", url: row.avatarUrl }]
      : []
  return {
    id: row.id,
    name: row.firstName?.trim() || row.name.split(" ")[0],
    age: row.birthDate ? ageOn(row.birthDate, now) : null,
    homeCity: row.homeCity,
    role: row.preferredRole,
    side: row.discoverProfile?.side ?? null,
    lookingFor: row.discoverProfile?.lookingFor ?? [],
    rating: Math.round(row.glickoRating),
    division: getDivision(row.glickoRating).name,
    games: ratedGames(row),
    played: row.sessionsPlayed,
    reliability: reliabilityOf(row),
    verified: isVerified(row.sessionsPlayed, reliabilityOf(row)),
    freeToday: freeToday(row.discoverProfile?.freeDay, row.discoverProfile?.freeSlot, now),
    photos,
    prompts: row.discoverPrompts.map((p) => ({ id: p.id, key: p.promptKey, question: promptText(p.promptKey), answer: p.answer })),
    ...(score ? { score: score.score, reasons: score.reasons } : {}),
  }
}

export function reliabilityOf(row: Pick<CardRow, "sessionsPlayed" | "_count">): number | null {
  return reliabilityPct(row.sessionsPlayed, row._count.attendanceEvents)
}

export function readiness(row: CardRow, now: Date = new Date()) {
  return missingSteps(
    {
      photos: row.discoverPhotos.length,
      hasAvatar: !!row.avatarUrl,
      prompts: row.discoverPrompts.length,
      birthDate: row.birthDate,
      homeCity: row.homeCity,
    },
    now,
  )
}

export function sideOf(row: CardRow): DealbreakerSide {
  const p = row.discoverProfile
  return {
    homeCity: row.homeCity,
    gender: row.gender,
    role: row.preferredRole,
    rating: row.glickoRating,
    prefCities: p?.prefCities ?? [],
    prefGender: p?.prefGender ?? null,
    prefRole: p?.prefRole ?? null,
    maxGap: p?.maxGap ?? DEFAULT_MAX_GAP,
  }
}

export function personOf(row: CardRow): DiscoverPerson {
  return {
    id: row.id,
    rating: row.glickoRating,
    role: row.preferredRole,
    games: ratedGames(row),
    homeCity: row.homeCity,
    slots: row.availability.map((a) => `${a.weekday}:${a.slot}`),
    lookingFor: row.discoverProfile?.lookingFor ?? [],
    side: row.discoverProfile?.side ?? null,
  }
}

export async function loadCardRow(playerId: string): Promise<CardRow | null> {
  return db.player.findUnique({ where: { id: playerId }, select: CARD_SELECT })
}

/** Everyone who can be shown on Scopri right now: real, adult, complete, not paused. */
export async function loadPool(now: Date = new Date()): Promise<CardRow[]> {
  const adultBefore = new Date(now)
  adultBefore.setUTCFullYear(adultBefore.getUTCFullYear() - MIN_AGE)
  const rows = await db.player.findMany({
    where: {
      ...NOT_DELETED_PLAYER,
      userId: { not: null },
      homeCity: { not: null },
      birthDate: { not: null, lte: adultBefore },
      discoverProfile: { is: { paused: false } },
    },
    select: CARD_SELECT,
  })
  return rows.filter((r) => readiness(r, now).length === 0)
}

/** People `meId` must not see in the deck: self, blocks, matches, likes and recent skips. */
export async function hiddenFor(meId: string, now: Date = new Date()): Promise<Set<string>> {
  const [swipes, matches, blocked] = await Promise.all([
    db.playerSwipe.findMany({ where: { fromId: meId }, select: { toId: true, liked: true, createdAt: true } }),
    db.playerMatch.findMany({ where: { OR: [{ aId: meId }, { bId: meId }] }, select: { aId: true, bId: true } }),
    blockedWith(meId),
  ])
  const out = new Set<string>([meId, ...blocked])
  for (const s of swipes) if (swipeHides(s, now)) out.add(s.toId)
  for (const m of matches) out.add(m.aId === meId ? m.bId : m.aId)
  return out
}

/**
 * The next cards for `me`, best first. Order = affinity, weighted by showing
 * up, verified, and "libero oggi" (see rankKey), with a small daily shuffle.
 */
export async function buildDeck(me: CardRow, now: Date = new Date(), limit = 12): Promise<ScopriCard[]> {
  const [pool, hidden] = await Promise.all([loadPool(now), hiddenFor(me.id, now)])
  const meSide = sideOf(me)
  const mePerson = personOf(me)
  const meFree = freeToday(me.discoverProfile?.freeDay, me.discoverProfile?.freeSlot, now)
  const day = dayKey(now)
  return pool
    .filter((r) => !hidden.has(r.id) && mutuallyEligible(meSide, sideOf(r)))
    .map((r) => {
      const s = discoverScore(mePerson, personOf(r))
      const reliability = reliabilityOf(r)
      const key = rankKey({
        score: s.score,
        jitter: stableJitter(`${day}:${me.id}:${r.id}`),
        reliability,
        verified: isVerified(r.sessionsPlayed, reliability),
        themFree: freeToday(r.discoverProfile?.freeDay, r.discoverProfile?.freeSlot, now),
        meFree,
      })
      return { r, s, key }
    })
    .sort((a, b) => b.key - a.key || (a.r.id < b.r.id ? -1 : 1))
    .slice(0, limit)
    .map(({ r, s }) => toCard(r, now, s))
}

/** Likes, Aces and "vedi tutti" left for `meId`. */
export async function allowance(meId: string, now: Date = new Date()) {
  const [likesToday, acesWeek, profile] = await Promise.all([
    db.playerSwipe.count({
      where: { fromId: meId, liked: true, isAce: false, reply: false, createdAt: { gte: romeDayStart(now) } },
    }),
    db.playerSwipe.count({ where: { fromId: meId, isAce: true, createdAt: { gte: romeWeekStart(now) } } }),
    db.discoverProfile.findUnique({
      where: { playerId: meId },
      select: { bonusLikes: true, bonusAces: true, likesUnlockedUntil: true },
    }),
  ])
  const reveal = profile?.likesUnlockedUntil && profile.likesUnlockedUntil > now ? profile.likesUnlockedUntil : null
  return {
    likesUsed: likesToday,
    acesUsed: acesWeek,
    likes: likesLeft(likesToday, profile?.bonusLikes ?? 0),
    aces: acesLeft(acesWeek, profile?.bonusAces ?? 0),
    revealUntil: reveal ? reveal.toISOString() : null,
  }
}

export type Allowance = Awaited<ReturnType<typeof allowance>>

// ── Chat for a match ─────────────────────────────────────────────────────────

function dmKeyFor(a: string, b: string): string {
  return [a, b].sort().join(":")
}

/** The one DM thread of a pair (same key as actions/messages.ts). */
export async function ensureDmThread(a: string, b: string): Promise<string> {
  const key = dmKeyFor(a, b)
  const existing = await db.chatThread.findUnique({ where: { dmKey: key }, select: { id: true } })
  if (existing) return existing.id
  try {
    const t = await db.chatThread.create({
      data: { kind: "DM", dmKey: key, participants: { create: [{ playerId: a }, { playerId: b }] } },
      select: { id: true },
    })
    return t.id
  } catch {
    const t = await db.chatThread.findUnique({ where: { dmKey: key }, select: { id: true } })
    if (!t) throw new Error("Impossibile aprire la conversazione")
    return t.id
  }
}

/** Post messages into a thread on behalf of its members (like comments, links). */
export async function postMessages(threadId: string, messages: { senderId: string; body: string }[]) {
  if (messages.length === 0) return
  for (const m of messages) {
    await db.chatMessage.create({ data: { threadId, senderId: m.senderId, body: m.body.slice(0, 2000) } })
  }
  const now = new Date()
  await db.chatThread.update({ where: { id: threadId }, data: { lastMessageAt: now } })
  for (const senderId of new Set(messages.map((m) => m.senderId))) {
    await db.chatParticipant.upsert({
      where: { threadId_playerId: { threadId, playerId: senderId } },
      create: { threadId, playerId: senderId, lastReadAt: now },
      update: { lastReadAt: now },
    })
  }
}

/** Record a mutual like: the match row, the DM thread and the opening lines. */
export async function createMatch(x: string, y: string, opening: { senderId: string; body: string }[] = []) {
  const [aId, bId] = [x, y].sort()
  const threadId = await ensureDmThread(aId, bId)
  const match = await db.playerMatch.upsert({
    where: { aId_bId: { aId, bId } },
    create: { aId, bId, threadId },
    update: { threadId },
    select: { id: true },
  })
  await postMessages(threadId, opening)
  return { matchId: match.id, threadId }
}

/** Push + in-app notification, never failing the caller. */
export async function notify(playerIds: string[], payload: { title: string; body: string; url?: string }) {
  if (playerIds.length === 0) return
  try {
    const { notifyPlayers } = await import("@/lib/push")
    await notifyPlayers(playerIds, payload)
  } catch (e) {
    console.error("scopri notify failed", e)
  }
}

// ── Matches ──────────────────────────────────────────────────────────────────

const MINI_SELECT = {
  id: true,
  name: true,
  firstName: true,
  avatarUrl: true,
  homeCity: true,
  preferredRole: true,
  discoverPhotos: { orderBy: { position: "asc" }, take: 1, select: { url: true } },
} as const satisfies Prisma.PlayerSelect

type MiniRow = Prisma.PlayerGetPayload<{ select: typeof MINI_SELECT }>

export interface MiniPlayer {
  id: string
  name: string
  photo: string | null
  homeCity: string | null
  role: "BLOCKER" | "DEFENDER"
}

export function toMini(p: MiniRow): MiniPlayer {
  return {
    id: p.id,
    name: p.firstName?.trim() || p.name.split(" ")[0],
    photo: p.discoverPhotos[0]?.url ?? p.avatarUrl ?? null,
    homeCity: p.homeCity,
    role: p.preferredRole,
  }
}

export interface MatchRow {
  id: string
  threadId: string | null
  createdAt: string
  other: MiniPlayer
  turn: ChatTurn
  lastMessage: string | null
  lastAt: string | null
  unread: boolean
  /** Ask "Avete giocato insieme?" (match older than two days, not answered). */
  askPlayed: boolean
}

export async function matchList(meId: string, now: Date = new Date()): Promise<MatchRow[]> {
  const matches = await db.playerMatch.findMany({
    where: { OR: [{ aId: meId }, { bId: meId }], endedAt: null },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      aId: true,
      threadId: true,
      createdAt: true,
      aPlayed: true,
      bPlayed: true,
      a: { select: MINI_SELECT },
      b: { select: MINI_SELECT },
    },
  })
  const threadIds = matches.map((m) => m.threadId).filter((t): t is string => !!t)
  const [last, mine] = threadIds.length
    ? await Promise.all([
        db.chatMessage.findMany({
          where: { threadId: { in: threadIds } },
          orderBy: { createdAt: "desc" },
          distinct: ["threadId"],
          select: { threadId: true, senderId: true, body: true, createdAt: true },
        }),
        db.chatParticipant.findMany({ where: { threadId: { in: threadIds }, playerId: meId }, select: { threadId: true, lastReadAt: true } }),
      ])
    : [[], []]
  const lastBy = new Map(last.map((m) => [m.threadId, m]))
  const readBy = new Map(mine.map((p) => [p.threadId, p.lastReadAt]))

  const rows = matches.map((m): MatchRow => {
    const iAmA = m.aId === meId
    const other = toMini(iAmA ? m.b : m.a)
    const msg = m.threadId ? lastBy.get(m.threadId) : undefined
    const read = m.threadId ? readBy.get(m.threadId) : undefined
    const myPlayed = iAmA ? m.aPlayed : m.bPlayed
    return {
      id: m.id,
      threadId: m.threadId,
      createdAt: m.createdAt.toISOString(),
      other,
      turn: chatTurn(msg?.senderId ?? null, meId),
      lastMessage: msg?.body ?? null,
      lastAt: msg?.createdAt.toISOString() ?? null,
      unread: !!msg && msg.senderId !== meId && (!read || read < msg.createdAt),
      askPlayed: myPlayed === null && now.getTime() - m.createdAt.getTime() > 2 * 86_400_000,
    }
  })
  const order: Record<ChatTurn, number> = { "tocca-a-te": 0, nuovo: 1, "in-attesa": 2 }
  return rows.sort((a, b) => order[a.turn] - order[b.turn] || (b.lastAt ?? b.createdAt).localeCompare(a.lastAt ?? a.createdAt))
}

// ── Likes you ────────────────────────────────────────────────────────────────

export interface IncomingLike {
  id: string
  isAce: boolean
  target: "PROFILE" | "PHOTO" | "PROMPT"
  targetLabel: string | null
  comment: string | null
  createdAt: string
  card: ScopriCard
}

export async function incomingLikes(meId: string, now: Date = new Date()): Promise<IncomingLike[]> {
  const [rows, blocked] = await Promise.all([
    db.playerSwipe.findMany({
      where: { toId: meId, liked: true, status: "PENDING", from: { is: NOT_DELETED_PLAYER } },
      orderBy: [{ isAce: "desc" }, { createdAt: "desc" }],
      take: 100,
      select: {
        id: true,
        isAce: true,
        target: true,
        targetLabel: true,
        comment: true,
        createdAt: true,
        from: { select: CARD_SELECT },
      },
    }),
    blockedWith(meId),
  ])
  const me = await loadCardRow(meId)
  const mePerson = me ? personOf(me) : null
  return rows
    .filter((r) => !blocked.has(r.from.id))
    .map((r) => ({
      id: r.id,
      isAce: r.isAce,
      target: r.target,
      targetLabel: r.targetLabel,
      comment: r.comment,
      createdAt: r.createdAt.toISOString(),
      card: toCard(r.from, now, mePerson ? discoverScore(mePerson, personOf(r.from)) : undefined),
    }))
}

// ── Il più compatibile di oggi ───────────────────────────────────────────────

function pairKey(a: string, b: string): string {
  return a < b ? `${a}|${b}` : `${b}|${a}`
}

/**
 * Pair the whole pool for `day` with Gale–Shapley and store everyone's pick.
 * Pairs who already swiped, matched or blocked each other are left out.
 */
export async function computeDailyPicks(day: string, now: Date = new Date()): Promise<number> {
  const pool = await loadPool(now)
  if (pool.length < 2) return 0
  const ids = pool.map((p) => p.id)
  const [swipes, matches, blocks] = await Promise.all([
    db.playerSwipe.findMany({ where: { fromId: { in: ids }, toId: { in: ids } }, select: { fromId: true, toId: true, liked: true, createdAt: true } }),
    db.playerMatch.findMany({ where: { aId: { in: ids }, bId: { in: ids } }, select: { aId: true, bId: true } }),
    db.playerBlock.findMany({ where: { blockerId: { in: ids }, blockedId: { in: ids } }, select: { blockerId: true, blockedId: true } }),
  ])
  const banned = new Set<string>()
  for (const s of swipes) if (swipeHides(s, now)) banned.add(pairKey(s.fromId, s.toId))
  for (const m of matches) banned.add(pairKey(m.aId, m.bId))
  for (const b of blocks) banned.add(pairKey(b.blockerId, b.blockedId))

  const byId = new Map(pool.map((r) => [r.id, { side: sideOf(r), person: personOf(r) }]))
  const cache = new Map<string, DiscoverScore>()
  const scoreOf = (a: string, b: string): DiscoverScore | null => {
    if (banned.has(pairKey(a, b))) return null
    const A = byId.get(a)
    const B = byId.get(b)
    if (!A || !B || !mutuallyEligible(A.side, B.side)) return null
    const k = `${a}>${b}`
    let s = cache.get(k)
    if (!s) {
      s = discoverScore(A.person, B.person)
      cache.set(k, s)
    }
    return s
  }
  const blockersPropose = Number(day.slice(-2)) % 2 === 0
  const pairs = dailyPairs(
    pool.map((r) => ({ id: r.id, role: r.preferredRole })),
    (a, b) => scoreOf(a, b)?.score ?? null,
    blockersPropose,
  )
  const data = [...pairs].map(([playerId, pickId]) => {
    const s = scoreOf(playerId, pickId) ?? { score: 0, reasons: [] }
    return { playerId, pickId, day, score: s.score, reasons: s.reasons }
  })
  if (data.length) await db.dailyPick.createMany({ data, skipDuplicates: true })
  return data.length
}

export interface DailyPickView {
  card: ScopriCard
  /** Already liked, skipped or matched: the card shows as done. */
  seen: boolean
}

export async function dailyPickFor(me: CardRow, now: Date = new Date()): Promise<DailyPickView | null> {
  const day = dayKey(now)
  const where = { playerId_day: { playerId: me.id, day } }
  let row = await db.dailyPick.findUnique({ where })
  if (!row) {
    const done = await db.dailyPick.count({ where: { day } })
    if (done === 0) await computeDailyPicks(day, now)
    row = await db.dailyPick.findUnique({ where })
  }
  if (!row) {
    // Joined after today's pairing: their own best card stands in.
    const [best] = await buildDeck(me, now, 1)
    if (!best) return null
    row = await db.dailyPick.upsert({
      where,
      create: { playerId: me.id, pickId: best.id, day, score: best.score ?? 0, reasons: best.reasons ?? [] },
      update: {},
    })
  }
  const [pick, blocked, swipe, match] = await Promise.all([
    loadCardRow(row.pickId),
    blockedWith(me.id),
    db.playerSwipe.findUnique({ where: { fromId_toId: { fromId: me.id, toId: row.pickId } }, select: { createdAt: true } }),
    db.playerMatch.findFirst({
      where: { OR: [{ aId: me.id, bId: row.pickId }, { aId: row.pickId, bId: me.id }] },
      select: { id: true },
    }),
  ])
  if (!pick || blocked.has(pick.id) || readiness(pick, now).length > 0 || pick.discoverProfile?.paused) return null
  return {
    card: toCard(pick, now, { score: row.score, reasons: row.reasons }),
    seen: !!match || (!!swipe && swipe.createdAt >= romeDayStart(now)),
  }
}

/** How many matches are waiting on `meId` (new, or the other wrote last). */
export async function waitingCount(meId: string): Promise<number> {
  const rows = await matchList(meId)
  return rows.filter((r) => r.turn !== "in-attesa").length
}

/** What the home card needs: is the profile live, who's waiting, who's nearby. */
export async function scopriSummary(playerId: string, city: string | null, now: Date = new Date()) {
  const [me, likes, waiting, nearby] = await Promise.all([
    loadCardRow(playerId),
    db.playerSwipe.count({ where: { toId: playerId, liked: true, status: "PENDING" } }),
    waitingCount(playerId),
    city
      ? db.player.count({
          where: { id: { not: playerId }, homeCity: city, discoverProfile: { is: { paused: false } }, discoverPrompts: { some: {} } },
        })
      : Promise.resolve(0),
  ])
  const ready = !!me && readiness(me, now).length === 0 && !me.discoverProfile?.paused
  // Scopri is adults only: minors never see the card.
  const minor = !!me?.birthDate && ageOn(me.birthDate, now) < MIN_AGE
  return { ready, likes, waiting, nearby, minor }
}

/** Stamp readyAt the first time a profile becomes complete (for "nuovi su Scopri"). */
export async function markReadyIfComplete(playerId: string, now: Date = new Date()): Promise<boolean> {
  const row = await loadCardRow(playerId)
  if (!row || readiness(row, now).length > 0) return false
  if (!row.discoverProfile?.readyAt) {
    await db.discoverProfile.upsert({
      where: { playerId },
      create: { playerId, readyAt: now },
      update: { readyAt: now },
    })
  }
  return true
}
