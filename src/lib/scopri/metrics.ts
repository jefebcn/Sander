import { db } from "@/lib/db"
import { dayKey } from "@/lib/datetime"
import { PLUS_MONTHLY_CENTS } from "@/lib/pricing"

/* Scopri numbers for /admin/metriche. Not a "use server" file: the page checks the admin. */

const DAY = 86_400_000

export async function getScopriMetrics(now: Date = new Date()) {
  const week = new Date(now.getTime() - 7 * DAY)
  const month = new Date(now.getTime() - 30 * DAY)
  const [
    profiles,
    activeRows,
    likes7,
    skips7,
    matches7,
    matchesAll,
    playedYes,
    votes,
    duosActive,
    challenges7,
    duoMatches,
    duoGames,
    plusActive,
    scSpent,
    openReports,
    suspended,
    freeToday,
  ] = await Promise.all([
    db.discoverProfile.count({ where: { readyAt: { not: null }, paused: false, suspendedAt: null } }),
    db.playerSwipe.findMany({ where: { createdAt: { gte: week } }, distinct: ["fromId"], select: { fromId: true } }),
    db.playerSwipe.count({ where: { liked: true, reply: false, createdAt: { gte: week } } }),
    db.playerSwipe.count({ where: { liked: false, createdAt: { gte: week } } }),
    db.playerMatch.count({ where: { createdAt: { gte: week } } }),
    db.playerMatch.findMany({ where: { threadId: { not: null } }, select: { threadId: true } }),
    db.playerMatch.count({ where: { OR: [{ aPlayed: true }, { bPlayed: true }] } }),
    db.playAgainVote.groupBy({ by: ["again"], _count: { _all: true } }),
    db.duo.count({ where: { status: "ACTIVE" } }),
    db.duoSwipe.count({ where: { liked: true, reply: false, createdAt: { gte: week } } }),
    db.duoMatch.count(),
    db.duoMatch.count({ where: { sessionId: { not: null } } }),
    db.discoverProfile.count({ where: { plusUntil: { gt: now } } }),
    db.creditSpend.aggregate({ where: { createdAt: { gte: month } }, _sum: { credits: true } }),
    db.playerBlock.count({ where: { reported: true, reviewedAt: null } }),
    db.discoverProfile.count({ where: { suspendedAt: { not: null } } }),
    db.discoverProfile.count({ where: { freeDay: dayKey(now) } }),
  ])
  const threadIds = matchesAll.map((m) => m.threadId as string)
  const chatting = threadIds.length
    ? await db.chatThread.count({ where: { id: { in: threadIds }, messages: { some: {} } } })
    : 0
  const yes = votes.find((v) => v.again)?._count._all ?? 0
  const no = votes.find((v) => !v.again)?._count._all ?? 0
  return {
    profiles,
    active7: activeRows.length,
    likes7,
    skips7,
    matches7,
    matchRate7: likes7 > 0 ? matches7 / likes7 : null,
    matchesTotal: matchesAll.length,
    chatRate: matchesAll.length > 0 ? chatting / matchesAll.length : null,
    playedYes,
    againYes: yes,
    againRate: yes + no > 0 ? yes / (yes + no) : null,
    duosActive,
    challenges7,
    duoMatches,
    duoGames,
    plusActive,
    plusMrrCents: plusActive * PLUS_MONTHLY_CENTS,
    scSpent30: scSpent._sum.credits ?? 0,
    openReports,
    suspended,
    freeToday,
  }
}
