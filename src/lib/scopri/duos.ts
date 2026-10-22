import { db } from "@/lib/db"
import type { Prisma } from "@/generated/prisma/client"
import { getDivision } from "@/lib/divisions"
import { romeDayStart } from "@/lib/romeMonth"
import { NOT_DELETED_PLAYER } from "@/lib/publicPlayer"
import { swipeHides } from "./rules"
import { duoScore, stableJitter, type DuoSide } from "./score"
import { blockedWith } from "./blocks"
import { dayKey } from "@/lib/datetime"
import { eloUpdate } from "./duoElo"

/* ────────────────────────────────────────────────────────────────────────── */
/*  Coppie: pairs looking for another pair for a 2v2. Same rhythm as Scopri — */
/*  a like, a match when it's mutual — but the match is a group chat of four. */
/*  Not a "use server" file: callers (actions/coppie.ts) check who is asking.  */
/* ────────────────────────────────────────────────────────────────────────── */

const MEMBER_SELECT = {
  id: true,
  name: true,
  firstName: true,
  avatarUrl: true,
  homeCity: true,
  preferredRole: true,
  glickoRating: true,
  discoverPhotos: { orderBy: { position: "asc" }, take: 1, select: { url: true } },
  availability: { select: { weekday: true, slot: true } },
} as const satisfies Prisma.PlayerSelect

type MemberRow = Prisma.PlayerGetPayload<{ select: typeof MEMBER_SELECT }>

export const DUO_SELECT = {
  id: true,
  aId: true,
  bId: true,
  status: true,
  name: true,
  motto: true,
  createdAt: true,
  a: { select: MEMBER_SELECT },
  b: { select: MEMBER_SELECT },
} as const satisfies Prisma.DuoSelect

export type DuoRow = Prisma.DuoGetPayload<{ select: typeof DUO_SELECT }>

export interface DuoMember {
  id: string
  name: string
  photo: string | null
  role: "BLOCKER" | "DEFENDER"
  rating: number
  division: string
  homeCity: string | null
}

export interface DuoCard {
  id: string
  name: string
  motto: string | null
  status: "PENDING" | "ACTIVE" | "ENDED"
  members: [DuoMember, DuoMember]
  rating: number
  score?: number
  reasons?: string[]
}

function memberName(m: { firstName: string | null; name: string }): string {
  return m.firstName?.trim() || m.name.split(" ")[0]
}

function toMember(m: MemberRow): DuoMember {
  return {
    id: m.id,
    name: memberName(m),
    photo: m.discoverPhotos[0]?.url ?? m.avatarUrl ?? null,
    role: m.preferredRole,
    rating: Math.round(m.glickoRating),
    division: getDivision(m.glickoRating).name,
    homeCity: m.homeCity,
  }
}

export function duoName(d: { name: string | null; a: { firstName: string | null; name: string }; b: { firstName: string | null; name: string } }): string {
  return d.name?.trim() || `${memberName(d.a)} & ${memberName(d.b)}`
}

export function toDuoCard(d: DuoRow, score?: { score: number; reasons: string[] }): DuoCard {
  return {
    id: d.id,
    name: duoName(d),
    motto: d.motto,
    status: d.status,
    members: [toMember(d.a), toMember(d.b)],
    rating: Math.round((d.a.glickoRating + d.b.glickoRating) / 2),
    ...(score ? { score: score.score, reasons: score.reasons } : {}),
  }
}

function sideOf(m: MemberRow): DuoSide {
  return { rating: m.glickoRating, homeCity: m.homeCity, slots: m.availability.map((a) => `${a.weekday}:${a.slot}`) }
}

/** The pair `playerId` plays in now, if any. */
export async function activeDuoOf(playerId: string): Promise<DuoRow | null> {
  return db.duo.findFirst({
    where: { status: "ACTIVE", OR: [{ aId: playerId }, { bId: playerId }] },
    select: DUO_SELECT,
  })
}

/** The invite `playerId` sent and is waiting on. */
export async function sentInviteOf(playerId: string): Promise<DuoRow | null> {
  return db.duo.findFirst({ where: { status: "PENDING", aId: playerId }, select: DUO_SELECT, orderBy: { createdAt: "desc" } })
}

export async function invitesFor(playerId: string): Promise<DuoRow[]> {
  return db.duo.findMany({ where: { status: "PENDING", bId: playerId }, select: DUO_SELECT, orderBy: { createdAt: "desc" } })
}

/** Other active pairs for `mine`, best first. */
export async function duoDeck(mine: DuoRow, now: Date = new Date(), limit = 10): Promise<DuoCard[]> {
  const [others, swipes, matches, blockedA, blockedB] = await Promise.all([
    db.duo.findMany({
      where: {
        status: "ACTIVE",
        id: { not: mine.id },
        a: { is: NOT_DELETED_PLAYER },
        b: { is: NOT_DELETED_PLAYER },
        NOT: { OR: [{ aId: { in: [mine.aId, mine.bId] } }, { bId: { in: [mine.aId, mine.bId] } }] },
      },
      select: DUO_SELECT,
      take: 300,
    }),
    db.duoSwipe.findMany({ where: { fromDuoId: mine.id }, select: { toDuoId: true, liked: true, createdAt: true } }),
    db.duoMatch.findMany({ where: { OR: [{ aDuoId: mine.id }, { bDuoId: mine.id }] }, select: { aDuoId: true, bDuoId: true } }),
    blockedWith(mine.aId),
    blockedWith(mine.bId),
  ])
  const hidden = new Set<string>()
  for (const s of swipes) if (swipeHides(s, now)) hidden.add(s.toDuoId)
  for (const m of matches) hidden.add(m.aDuoId === mine.id ? m.bDuoId : m.aDuoId)
  const blocked = new Set([...blockedA, ...blockedB])
  const mySides: [DuoSide, DuoSide] = [sideOf(mine.a), sideOf(mine.b)]
  const day = dayKey(now)
  return others
    .filter((d) => !hidden.has(d.id) && !blocked.has(d.aId) && !blocked.has(d.bId))
    .map((d) => ({ d, s: duoScore(mySides, [sideOf(d.a), sideOf(d.b)]), j: stableJitter(`${day}:${mine.id}:${d.id}`) }))
    .sort((x, y) => y.s.score + y.j - (x.s.score + x.j))
    .slice(0, limit)
    .map(({ d, s }) => toDuoCard(d, s))
}

export async function duoLikesUsedToday(duoId: string, now: Date = new Date()): Promise<number> {
  return db.duoSwipe.count({ where: { fromDuoId: duoId, liked: true, reply: false, createdAt: { gte: romeDayStart(now) } } })
}

/** Group chat of four for two pairs that liked each other. */
export async function createDuoMatch(x: DuoRow, y: DuoRow, opening: { senderId: string; body: string }[]) {
  const [first, second] = x.id < y.id ? [x, y] : [y, x]
  const existing = await db.duoMatch.findUnique({
    where: { aDuoId_bDuoId: { aDuoId: first.id, bDuoId: second.id } },
    select: { id: true, threadId: true },
  })
  if (existing?.threadId) return { duoMatchId: existing.id, threadId: existing.threadId }

  const members = Array.from(new Set([x.aId, x.bId, y.aId, y.bId]))
  const thread = await db.chatThread.create({
    data: {
      kind: "GROUP",
      name: `${duoName(x)} vs ${duoName(y)}`.slice(0, 80),
      createdById: x.aId,
      participants: { create: members.map((playerId) => ({ playerId })) },
    },
    select: { id: true },
  })
  const match = await db.duoMatch.upsert({
    where: { aDuoId_bDuoId: { aDuoId: first.id, bDuoId: second.id } },
    create: { aDuoId: first.id, bDuoId: second.id, threadId: thread.id },
    update: { threadId: thread.id },
    select: { id: true },
  })
  if (opening.length) {
    const now = new Date()
    for (const m of opening) {
      await db.chatMessage.create({ data: { threadId: thread.id, senderId: m.senderId, body: m.body.slice(0, 2000) } })
    }
    await db.chatThread.update({ where: { id: thread.id }, data: { lastMessageAt: now } })
  }
  return { duoMatchId: match.id, threadId: thread.id }
}

export interface DuoMatchRow {
  id: string
  threadId: string | null
  sessionId: string | null
  createdAt: string
  other: DuoCard
}

export async function duoMatchList(mine: DuoRow): Promise<DuoMatchRow[]> {
  const rows = await db.duoMatch.findMany({
    where: { OR: [{ aDuoId: mine.id }, { bDuoId: mine.id }] },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      threadId: true,
      sessionId: true,
      createdAt: true,
      aDuoId: true,
      aDuo: { select: DUO_SELECT },
      bDuo: { select: DUO_SELECT },
    },
  })
  return rows.map((r) => ({
    id: r.id,
    threadId: r.threadId,
    sessionId: r.sessionId,
    createdAt: r.createdAt.toISOString(),
    other: toDuoCard(r.aDuoId === mine.id ? r.bDuo : r.aDuo),
  }))
}

export interface IncomingDuoLike {
  fromDuo: DuoCard
  comment: string | null
  byName: string
  createdAt: string
}

export async function incomingDuoLikes(mine: DuoRow): Promise<IncomingDuoLike[]> {
  const rows = await db.duoSwipe.findMany({
    where: { toDuoId: mine.id, liked: true, status: "PENDING", fromDuo: { status: "ACTIVE" } },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: { comment: true, byId: true, createdAt: true, fromDuo: { select: DUO_SELECT } },
  })
  const blocked = new Set([...(await blockedWith(mine.aId)), ...(await blockedWith(mine.bId))])
  return rows
    .filter((r) => !blocked.has(r.fromDuo.aId) && !blocked.has(r.fromDuo.bId))
    .map((r) => {
      const by = r.fromDuo.aId === r.byId ? r.fromDuo.a : r.fromDuo.b
      return { fromDuo: toDuoCard(r.fromDuo), comment: r.comment, byName: memberName(by), createdAt: r.createdAt.toISOString() }
    })
}

/** People `playerId` could ask to form a pair: matches first, then chat contacts. */
export async function partnerCandidates(playerId: string) {
  const [matches, threads, blocked] = await Promise.all([
    db.playerMatch.findMany({
      where: { OR: [{ aId: playerId }, { bId: playerId }], endedAt: null },
      select: { aId: true, bId: true },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
    db.chatThread.findMany({
      where: { kind: "DM", participants: { some: { playerId } } },
      select: { participants: { select: { playerId: true } } },
      orderBy: { lastMessageAt: "desc" },
      take: 30,
    }),
    blockedWith(playerId),
  ])
  const ids: string[] = []
  const push = (id: string) => {
    if (id !== playerId && !blocked.has(id) && !ids.includes(id)) ids.push(id)
  }
  for (const m of matches) push(m.aId === playerId ? m.bId : m.aId)
  for (const t of threads) for (const p of t.participants) push(p.playerId)
  if (ids.length === 0) return []
  const players = await db.player.findMany({
    where: { id: { in: ids }, ...NOT_DELETED_PLAYER },
    select: MEMBER_SELECT,
  })
  const byId = new Map(players.map((p) => [p.id, p]))
  return ids.map((id) => byId.get(id)).filter((p): p is MemberRow => !!p).map(toMember)
}


/**
 * After a completed 2v2 between two matched pairs: move both pair ratings
 * (Elo) once. Each pair is the side its members played on.
 */
export async function rateDuoMatch(sessionId: string, winningTeam: 0 | 1): Promise<boolean> {
  const m = await db.duoMatch.findFirst({
    where: { sessionId, ratedAt: null },
    select: {
      id: true,
      aDuo: { select: { id: true, aId: true, bId: true, rating: true } },
      bDuo: { select: { id: true, aId: true, bId: true, rating: true } },
    },
  })
  if (!m) return false
  const parts = await db.sessionParticipant.findMany({ where: { sessionId }, select: { playerId: true, team: true } })
  const teamOf = (d: { aId: string; bId: string }) => {
    const t = parts.filter((p) => p.playerId === d.aId || p.playerId === d.bId).map((p) => p.team)
    return t.length === 2 && t[0] === t[1] ? t[0] : null
  }
  const aTeam = teamOf(m.aDuo)
  const bTeam = teamOf(m.bDuo)
  if (aTeam === null || bTeam === null || aTeam === bTeam) return false
  // Claim first: a double completion can't rate twice.
  const claimed = await db.duoMatch.updateMany({ where: { id: m.id, ratedAt: null }, data: { ratedAt: new Date() } })
  if (claimed.count === 0) return false
  const aWon = aTeam === winningTeam
  const [ra, rb] = eloUpdate(m.aDuo.rating, m.bDuo.rating, aWon)
  await db.$transaction([
    db.duo.update({ where: { id: m.aDuo.id }, data: { rating: ra, ...(aWon ? { wins: { increment: 1 } } : { losses: { increment: 1 } }) } }),
    db.duo.update({ where: { id: m.bDuo.id }, data: { rating: rb, ...(aWon ? { losses: { increment: 1 } } : { wins: { increment: 1 } }) } }),
  ])
  return true
}

export interface DuoRankRow {
  id: string
  name: string
  rating: number
  wins: number
  losses: number
  members: [DuoMember, DuoMember]
}

/** Pairs leaderboard: active pairs by rating, those who played first. */
export async function duoLeaderboard(limit = 30): Promise<DuoRankRow[]> {
  const rows = await db.duo.findMany({
    where: { status: "ACTIVE" },
    orderBy: [{ rating: "desc" }, { wins: "desc" }],
    take: 200,
    select: { ...DUO_SELECT, rating: true, wins: true, losses: true },
  })
  return rows
    .sort((x, y) => Number(y.wins + y.losses > 0) - Number(x.wins + x.losses > 0) || y.rating - x.rating)
    .slice(0, limit)
    .map((d) => ({
      id: d.id,
      name: duoName(d),
      rating: Math.round(d.rating),
      wins: d.wins,
      losses: d.losses,
      members: [toMember(d.a), toMember(d.b)],
    }))
}

/**
 * Pairs that want opponents near you (a member plays in your comune), shown
 * to someone without a pair yet: the reason to form one.
 */
export async function pairsNearby(playerId: string, city: string | null, limit = 4): Promise<DuoCard[]> {
  const rows = await db.duo.findMany({
    where: {
      status: "ACTIVE",
      a: { is: NOT_DELETED_PLAYER },
      b: { is: NOT_DELETED_PLAYER },
      NOT: { OR: [{ aId: playerId }, { bId: playerId }] },
      ...(city ? { OR: [{ a: { homeCity: city } }, { b: { homeCity: city } }] } : {}),
    },
    orderBy: { rating: "desc" },
    take: limit,
    select: DUO_SELECT,
  })
  return rows.map((d) => toDuoCard(d))
}
