import { revalidatePath, revalidateTag } from "next/cache"
import { db } from "@/lib/db"
import { LEADERBOARDS_TAG } from "@/lib/cacheTags"
import { rateDuoMatch } from "@/lib/scopri/duos"
import { updateGlickoAfterSession } from "@/lib/rating"
import { applyMatchResult, rankStandings } from "@/lib/tournament/kotb"
import type { StandingEntry } from "@/lib/tournament/types"
import { SCORE_CONFIRM_HOURS } from "@/lib/scoreConfirm"

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

  // Multi-match mode: aggregate win/loss from SessionMatch results
  if (session.matchMode && session.sessionMatches.length > 0) {
    let standings: StandingEntry[] = session.participants
      .filter((p) => p.playerId !== null)
      .map((p) => ({ playerId: p.playerId!, points: 0, matchesWon: 0, matchesLost: 0, pointsFor: 0, pointsAgainst: 0, rank: 0 }))
    for (const m of session.sessionMatches) {
      if (m.teamAScore == null || m.teamBScore == null) continue
      standings = applyMatchResult(standings, {
        teamAPlayerIds: m.players.filter((p) => p.team === 0).map((p) => p.playerId),
        teamBPlayerIds: m.players.filter((p) => p.team === 1).map((p) => p.playerId),
        teamAScore: m.teamAScore,
        teamBScore: m.teamBScore,
      })
    }
    for (const s of rankStandings(standings)) await addResult(s.playerId, s.matchesWon, s.matchesLost)
  }

  // Sets: the team with more sets wins (a draw moves nothing).
  if (session.sets.length > 0) {
    const aWins = session.sets.filter((s) => s.teamAScore > s.teamBScore).length
    const bWins = session.sets.filter((s) => s.teamBScore > s.teamAScore).length
    const winningTeam = aWins > bWins ? 0 : bWins > aWins ? 1 : null
    if (winningTeam !== null) {
      for (const p of session.participants) {
        if (!p.playerId || p.team === null) continue // guests, unassigned
        const won = p.team === winningTeam
        await addResult(p.playerId, won ? 1 : 0, won ? 0 : 1)
      }
      // A 2v2 between two Scopri pairs also moves the pair ratings (Coppie).
      await rateDuoMatch(sessionId, winningTeam).catch((e) => console.error("duo rating failed", e))
    }
  }

  // Glicko-2 ratings (dampened for friendly sessions)
  try {
    await updateGlickoAfterSession(sessionId)
  } catch (e) {
    console.error("Glicko update failed for session", sessionId, e)
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
