import { db } from "@/lib/db"
import { NOT_DELETED_PLAYER } from "@/lib/publicPlayer"
import { PLAY_AGAIN_FLAG_DAYS } from "./playAgain"

/* ────────────────────────────────────────────────────────────────────────── */
/*  "Rigiocheresti?" on the server. Not a "use server" file: callers check    */
/*  who is asking (actions/scopri.ts).                                        */
/* ────────────────────────────────────────────────────────────────────────── */

/** How long after a match we still ask about the people in it. */
const ASK_DAYS = 7

export interface PlayAgainAsk {
  sessionId: string
  title: string
  date: string
  people: { id: string; name: string; photo: string | null; teammate: boolean }[]
}

/**
 * The most recent completed match (last 7 days, or the one given) with people
 * you haven't rated yet, or null. Teammates first.
 */
export async function pendingPlayAgain(meId: string, now: Date = new Date(), sessionId?: string): Promise<PlayAgainAsk | null> {
  const sessions = await db.session.findMany({
    where: {
      status: "COMPLETED",
      ...(sessionId ? { id: sessionId } : { date: { gte: new Date(now.getTime() - ASK_DAYS * 86_400_000), lte: now } }),
      participants: { some: { playerId: meId } },
    },
    orderBy: { date: "desc" },
    take: 3,
    select: {
      id: true,
      title: true,
      date: true,
      participants: {
        where: { playerId: { not: null } },
        select: {
          playerId: true,
          team: true,
          player: {
            select: {
              id: true,
              name: true,
              firstName: true,
              avatarUrl: true,
              userId: true,
              discoverPhotos: { where: { hiddenAt: null }, orderBy: { position: "asc" }, take: 1, select: { url: true } },
            },
          },
        },
      },
    },
  })
  for (const s of sessions) {
    const mine = s.participants.find((p) => p.playerId === meId)
    const others = s.participants.filter((p) => p.playerId !== meId && p.player?.userId)
    if (!others.length) continue
    const voted = await db.playAgainVote.findMany({ where: { voterId: meId, sessionId: s.id }, select: { targetId: true } })
    const done = new Set(voted.map((v) => v.targetId))
    const left = others.filter((p) => !done.has(p.playerId as string))
    if (!left.length) continue
    return {
      sessionId: s.id,
      title: s.title,
      date: s.date.toISOString(),
      people: left
        .map((p) => ({
          id: p.playerId as string,
          name: p.player?.firstName?.trim() || p.player?.name.split(" ")[0] || "Giocatore",
          photo: p.player?.discoverPhotos[0]?.url ?? p.player?.avatarUrl ?? null,
          teammate: mine?.team != null && p.team === mine.team,
        }))
        .sort((a, b) => Number(b.teammate) - Number(a.teammate)),
    }
  }
  return null
}

/** Distinct people who said "non rigiocherei" about `targetId` recently. */
export async function recentNoVoters(targetId: string, now: Date = new Date()): Promise<number> {
  const rows = await db.playAgainVote.findMany({
    where: { targetId, again: false, createdAt: { gte: new Date(now.getTime() - PLAY_AGAIN_FLAG_DAYS * 86_400_000) } },
    distinct: ["voterId"],
    select: { voterId: true },
  })
  return rows.length
}

/** Players with many recent "no" (for the admin review). */
export async function flaggedByVotes(min: number, now: Date = new Date()) {
  const since = new Date(now.getTime() - PLAY_AGAIN_FLAG_DAYS * 86_400_000)
  const rows = await db.playAgainVote.groupBy({
    by: ["targetId"],
    where: { again: false, createdAt: { gte: since }, target: { is: NOT_DELETED_PLAYER } },
    _count: { _all: true },
  })
  const ids = rows.filter((r) => r._count._all >= min).map((r) => r.targetId)
  if (!ids.length) return []
  const players = await db.player.findMany({ where: { id: { in: ids } }, select: { id: true, name: true } })
  const count = new Map(rows.map((r) => [r.targetId, r._count._all]))
  return players.map((p) => ({ ...p, noVotes: count.get(p.id) ?? 0 })).sort((a, b) => b.noVotes - a.noVotes)
}
