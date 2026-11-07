import { revalidatePath, revalidateTag } from "next/cache"
import { db } from "@/lib/db"
import { LEADERBOARDS_TAG } from "@/lib/cacheTags"
import { rateDuoMatch } from "@/lib/scopri/duos"
import { updateGlickoAfterSession } from "@/lib/rating"
import { SCORE_CONFIRM_HOURS, resultNotice } from "@/lib/scoreConfirm"
import { SAME_OPPONENT_WINDOW_DAYS, TRUST_MIN_CO_PLAYERS, countedOpponents, isTrustedAccount, opposingPairs, sessionRanking, unrankedLabel } from "@/lib/rankingGuard"
import { notifyPlayer } from "@/lib/push"

/* ────────────────────────────────────────────────────────────────────────── */
/*  What a confirmed score does: wins and losses, pair ratings and Glicko.     */
/*  INTERNAL only (not a "use server" file): called by the confirm action,     */
/*  by completeSession when nobody can object, and by the daily sweep.         */
/* ────────────────────────────────────────────────────────────────────────── */

async function addResult(playerId: string, won: number, lost: number) {
  const cur = await db.player.findUniqueOrThrow({ where: { id: playerId }, select: { matchesWon: true, matchesLost: true } })
  const newWon = cur.matchesWon + won
  const newLost = cur.matchesLost + lost
  const total = newWon + newLost
  await db.player.update({
    where: { id: playerId },
    data: { matchesWon: newWon, matchesLost: newLost, winRatePct: total > 0 ? Math.round((newWon / total) * 100) : 0 },
  })
}

type Side = { teamA: string[]; teamB: string[]; winner: 0 | 1 | null }

/** Each pair of players already on opposite sides of a counted session this week. */
async function recentOpposingPairs(sessionId: string, players: string[]): Promise<Map<string, number>> {
  const since = new Date(Date.now() - SAME_OPPONENT_WINDOW_DAYS * 86_400_000)
  const sessions = await db.session.findMany({
    where: {
      id: { not: sessionId },
      scoreConfirmedAt: { gte: since },
      unrankedReason: null,
      voidedAt: null,
      participants: { some: { playerId: { in: players } } },
    },
    select: {
      matchMode: true,
      participants: { select: { playerId: true, team: true } },
      sessionMatches: { where: { isCompleted: true }, select: { players: { select: { playerId: true, team: true } } } },
    },
    take: 300,
  })
  const counts = new Map<string, number>()
  for (const s of sessions) {
    const groups =
      s.matchMode && s.sessionMatches.length > 0
        ? s.sessionMatches.map((m) => m.players)
        : [s.participants.filter((p): p is { playerId: string; team: number | null } => !!p.playerId)]
    const pairs = new Set<string>()
    for (const g of groups) {
      const a = g.filter((p) => p.team === 0).map((p) => p.playerId)
      const b = g.filter((p) => p.team === 1).map((p) => p.playerId)
      opposingPairs(a, b).forEach((k) => pairs.add(k))
    }
    for (const k of pairs) counts.set(k, (counts.get(k) ?? 0) + 1)
  }
  return counts
}

/** Which of these accounts can move other players' ranking (lib/rankingGuard.ts). */
async function trustOf(players: string[]): Promise<Map<string, boolean>> {
  const rows = await db.player.findMany({ where: { id: { in: players } }, select: { id: true, createdAt: true } })
  const out = new Map<string, boolean>()
  for (const p of rows) {
    const [tournaments, coPlayers] = await Promise.all([
      db.tournamentRegistration.count({ where: { playerId: p.id, isSpectator: false, tournament: { status: "COMPLETED" } } }),
      db.sessionParticipant.findMany({
        where: { playerId: { not: null, notIn: [p.id] }, session: { status: "COMPLETED", participants: { some: { playerId: p.id } } } },
        distinct: ["playerId"],
        select: { playerId: true },
        take: TRUST_MIN_CO_PLAYERS,
      }),
    ])
    out.set(p.id, isTrustedAccount({ createdAt: p.createdAt, coPlayers: coPlayers.length, playedTournament: tournaments > 0 }))
  }
  return out
}

async function applyScoreEffects(sessionId: string) {
  const session = await db.session.findUniqueOrThrow({
    where: { id: sessionId },
    select: {
      matchMode: true,
      participants: { select: { playerId: true, team: true } },
      sets: { select: { teamAScore: true, teamBScore: true } },
      sessionMatches: {
        where: { isCompleted: true },
        select: { teamAScore: true, teamBScore: true, players: { select: { playerId: true, team: true } } },
      },
    },
  })

  // The sides of each decided match, registered players only (guests can't confirm or be rated).
  const sides: Side[] = []
  if (session.matchMode && session.sessionMatches.length > 0) {
    for (const m of session.sessionMatches) {
      if (m.teamAScore == null || m.teamBScore == null) continue
      sides.push({
        teamA: m.players.filter((p) => p.team === 0).map((p) => p.playerId),
        teamB: m.players.filter((p) => p.team === 1).map((p) => p.playerId),
        winner: m.teamAScore > m.teamBScore ? 0 : m.teamBScore > m.teamAScore ? 1 : null,
      })
    }
  } else if (session.sets.length > 0) {
    const aWins = session.sets.filter((s) => s.teamAScore > s.teamBScore).length
    const bWins = session.sets.filter((s) => s.teamBScore > s.teamAScore).length
    const real = session.participants.filter((p): p is { playerId: string; team: number | null } => !!p.playerId)
    sides.push({
      teamA: real.filter((p) => p.team === 0).map((p) => p.playerId),
      teamB: real.filter((p) => p.team === 1).map((p) => p.playerId),
      winner: aWins > bWins ? 0 : bWins > aWins ? 1 : null,
    })
  }
  if (sides.length === 0) return
  const players = [...new Set(sides.flatMap((m) => [...m.teamA, ...m.teamB]))]

  // Fair play: guests only on the other side, or the same opponents again and again.
  const decision = sessionRanking(sides, await recentOpposingPairs(sessionId, players))
  if (!decision.ranked) {
    await db.session.update({ where: { id: sessionId }, data: { unrankedReason: decision.reason } })
    const flagged =
      decision.reason === "SAME_OPPONENTS" && decision.pairs ? [...new Set(decision.pairs.flatMap((k) => k.split("|")))] : players
    if (flagged.length > 0) await db.ratingFlag.createMany({ data: flagged.map((playerId) => ({ playerId, sessionId, kind: decision.reason })) })
    return
  }

  const trust = await trustOf(players)
  const trusted = (id: string) => trust.get(id) ?? false
  const counts = (p: string, o: string) => countedOpponents(trusted(p), [o], trusted).length > 0

  // W/L, match by match: a result against new accounts only doesn't move an established player.
  const tally = new Map<string, { won: number; lost: number }>()
  const newOpponentWins = new Set<string>()
  for (const m of sides) {
    if (m.winner === null || m.teamA.length === 0 || m.teamB.length === 0) continue
    for (const [side, team, opps] of [[0, m.teamA, m.teamB], [1, m.teamB, m.teamA]] as const) {
      for (const p of team) {
        if (countedOpponents(trusted(p), opps, trusted).length === 0) {
          if (side === m.winner) newOpponentWins.add(p)
          continue
        }
        const t = tally.get(p) ?? { won: 0, lost: 0 }
        if (side === m.winner) t.won++
        else t.lost++
        tally.set(p, t)
      }
    }
  }

  const ratings = async () =>
    new Map((await db.player.findMany({ where: { id: { in: players } }, select: { id: true, glickoRating: true } })).map((p) => [p.id, p.glickoRating]))
  const before = await ratings()

  for (const [playerId, t] of tally) await addResult(playerId, t.won, t.lost)

  // A 2v2 between two Scopri pairs also moves the pair ratings (Coppie).
  const plain = sides.length === 1 && !session.matchMode ? sides[0] : null
  if (plain && plain.winner !== null) {
    await rateDuoMatch(sessionId, plain.winner).catch((e) => console.error("duo rating failed", e))
  }

  // Glicko-2 ratings (dampened for friendly sessions), same fair-play filter.
  try {
    await updateGlickoAfterSession(sessionId, counts)
  } catch (e) {
    console.error("Glicko update failed for session", sessionId, e)
  }

  // What this session did, so an admin can take it back exactly.
  const after = await ratings()
  const rows = players
    .map((playerId) => {
      const t = tally.get(playerId) ?? { won: 0, lost: 0 }
      const b = before.get(playerId) ?? null
      const a = after.get(playerId) ?? null
      return { sessionId, playerId, won: t.won, lost: t.lost, ratingBefore: b, ratingAfter: a }
    })
    .filter((r) => r.won || r.lost || r.ratingBefore !== r.ratingAfter)
  if (rows.length > 0) await db.sessionResult.createMany({ data: rows, skipDuplicates: true })
  if (newOpponentWins.size > 0) {
    await db.ratingFlag.createMany({ data: [...newOpponentWins].map((playerId) => ({ playerId, sessionId, kind: "NEW_OPPONENTS" })) })
  }
}

/** Each player hears the result once it counts, with their rating move: the reason to come back. */
async function notifyResult(sessionId: string) {
  const s = await db.session.findUniqueOrThrow({
    where: { id: sessionId },
    select: {
      title: true,
      unrankedReason: true,
      participants: { select: { playerId: true, team: true } },
      sets: { select: { teamAScore: true, teamBScore: true } },
    },
  })
  const unranked = unrankedLabel(s.unrankedReason)
  if (unranked) {
    for (const p of s.participants) {
      if (p.playerId) await notifyPlayer(p.playerId, { title: "Partita registrata", body: `${s.title}. ${unranked}`, url: `/sessions/${sessionId}` })
    }
    return
  }
  const aWins = s.sets.filter((x) => x.teamAScore > x.teamBScore).length
  const bWins = s.sets.filter((x) => x.teamBScore > x.teamAScore).length
  const winningTeam = aWins > bWins ? 0 : bWins > aWins ? 1 : null
  for (const p of s.participants) {
    if (!p.playerId) continue
    const [last, prev] = await db.ratingHistory.findMany({
      where: { playerId: p.playerId },
      orderBy: { createdAt: "desc" },
      take: 2,
      select: { rating: true, sourceId: true },
    })
    // No earlier row: the starting rating may come from the declared level, so no number.
    const delta = last?.sourceId === sessionId && prev ? Math.round(last.rating - prev.rating) : null
    const won = winningTeam === null || p.team === null ? null : p.team === winningTeam
    await notifyPlayer(p.playerId, resultNotice({ won, title: s.title, delta, sessionId }))
  }
}

/**
 * Confirm a submitted score and apply it, exactly once: only the call that
 * claims scoreConfirmedAt goes on, so a double tap, the sweep and a player
 * confirming at the same moment can't count the result twice.
 */
export async function confirmScore(sessionId: string): Promise<boolean> {
  const claimed = await db.session.updateMany({
    where: { id: sessionId, scoreSubmittedAt: { not: null }, scoreConfirmedAt: null, scoreDisputedAt: null },
    data: { scoreConfirmedAt: new Date() },
  })
  if (claimed.count === 0) return false
  await applyScoreEffects(sessionId)
  await notifyResult(sessionId).catch((e) => console.error("result notice failed", e))
  revalidatePath(`/sessions/${sessionId}`)
  revalidatePath("/sessions")
  revalidateTag(LEADERBOARDS_TAG, { expire: 0 })
  return true
}

/** Silence counts as yes: confirm every score left unanswered for 24 hours. */
export async function confirmDueScores(now: Date = new Date()): Promise<number> {
  const due = await db.session.findMany({
    where: {
      scoreSubmittedAt: { lte: new Date(now.getTime() - SCORE_CONFIRM_HOURS * 3_600_000) },
      scoreConfirmedAt: null,
      scoreDisputedAt: null,
    },
    select: { id: true },
    take: 200,
  })
  let n = 0
  for (const s of due) if (await confirmScore(s.id)) n++
  return n
}

/**
 * Admin: take back what a confirmed session did (W/L and rating), from the
 * SessionResult rows written when it counted. Pair (Coppie) ratings stay.
 * Returns false when there is nothing to take back.
 */
export async function voidSessionResults(sessionId: string): Promise<{ ok: true; players: number } | { ok: false; error: string }> {
  const claimed = await db.session.updateMany({ where: { id: sessionId, voidedAt: null }, data: { voidedAt: new Date(), unrankedReason: "VOIDED" } })
  if (claimed.count === 0) return { ok: false, error: "Partita già annullata" }
  const rows = await db.sessionResult.findMany({ where: { sessionId } })
  for (const r of rows) {
    const p = await db.player.findUnique({ where: { id: r.playerId }, select: { matchesWon: true, matchesLost: true, glickoRating: true, glickoRD: true } })
    if (!p) continue
    const won = Math.max(0, p.matchesWon - r.won)
    const lost = Math.max(0, p.matchesLost - r.lost)
    const delta = r.ratingBefore != null && r.ratingAfter != null ? r.ratingAfter - r.ratingBefore : 0
    const rating = p.glickoRating - delta
    await db.player.update({
      where: { id: r.playerId },
      data: { matchesWon: won, matchesLost: lost, winRatePct: won + lost > 0 ? Math.round((won / (won + lost)) * 100) : 0, glickoRating: rating },
    })
    if (delta !== 0) await db.ratingHistory.create({ data: { playerId: r.playerId, rating, rd: p.glickoRD, source: "void", sourceId: sessionId } })
  }
  revalidatePath(`/sessions/${sessionId}`)
  revalidatePath("/players")
  revalidateTag(LEADERBOARDS_TAG, { expire: 0 })
  return { ok: true, players: rows.length }
}
