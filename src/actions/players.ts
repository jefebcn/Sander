"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { getCurrentPlayer, getCurrentSession } from "@/lib/getCurrentPlayer"
import { CreatePlayerSchema, UpdateStatPctSchema, AdminAddCreditsSchema } from "@/lib/validators/player.schema"
import type { CreatePlayerInput, UpdateStatPctInput } from "@/lib/validators/player.schema"
import { isAdminEmail } from "@/lib/isAdmin"
import { PUBLIC_PLAYER_SELECT, DELETED_PLAYER_NAME, NOT_DELETED_PLAYER, type PublicPlayer } from "@/lib/publicPlayer"
import { romeMonthRange } from "@/lib/romeMonth"
import { z } from "zod"
import { refundSessionCredits } from "@/lib/sessionRefunds"
import { cancelPlusNow } from "@/lib/scopri/plus"

const PlayerIdSchema = z.string().trim().min(1).max(64)

export async function createPlayer(input: CreatePlayerInput) {
  // Must be authenticated to create a player profile
  const session = await getCurrentSession()
  if (!session?.user?.id) throw new Error("Non autenticato")

  const data = CreatePlayerSchema.parse(input)

  const player = await db.player.create({
    data: {
      name: data.name,
      preferredRole: data.preferredRole,
      avatarUrl: data.avatarUrl || null,
    },
  })

  revalidatePath("/players")
  return player
}

/**
 * A player's public profile. Anyone can call this (it is an RPC endpoint), so
 * it returns only the public fields — never birth date, gender, credits or the
 * auth user id.
 */
export async function getPlayer(id: string): Promise<PublicPlayer> {
  const playerId = PlayerIdSchema.parse(id)
  return db.player.findUniqueOrThrow({
    where: { id: playerId },
    select: PUBLIC_PLAYER_SELECT,
  })
}

/** Every active player, public fields only (pickers, lists, leaderboards). */
export async function listPlayers(): Promise<PublicPlayer[]> {
  return db.player.findMany({
    where: NOT_DELETED_PLAYER,
    select: PUBLIC_PLAYER_SELECT,
    orderBy: [{ matchesWon: "desc" }, { name: "asc" }],
  })
}

export async function checkHasPlayerProfile(): Promise<boolean> {
  const session = await getCurrentSession()
  if (!session?.user?.id) return false
  const player = await db.player.findUnique({
    where: { userId: session.user.id },
    select: { firstName: true },
  })
  // Onboarding is done once the profile has a first name: it is the only name
  // the form requires (the surname is optional), so also asking for lastName
  // sent everyone without a surname back to /onboarding/profile at every login.
  return !!player?.firstName?.trim()
}

export async function listUsersWithoutProfile() {
  // Admin-only data, but the add-player sheet every organiser opens asks for
  // it too: answer non-admins with an empty list instead of throwing, so the
  // caller can never break on it.
  const session = await getCurrentSession()
  if (!session?.user?.id || !isAdminEmail(session.user.email)) return []

  return db.user.findMany({
    where: { player: null },
    select: { id: true, name: true, email: true },
    orderBy: { name: "asc" },
  })
}

export async function createMinimalPlayerForUser(userId: string) {
  const session = await getCurrentSession()
  if (!session?.user?.id) throw new Error("Non autenticato")
  if (session.user.id !== userId && !isAdminEmail(session.user.email)) {
    throw new Error("Non autorizzato")
  }

  const user = await db.user.findUniqueOrThrow({
    where: { id: userId },
    select: { id: true, name: true, email: true, player: { select: { id: true } } },
  })

  if (user.player) return user.player

  const playerName =
    user.name?.trim() ||
    (user.email ? user.email.split("@")[0] : "Giocatore")

  const player = await db.player.create({
    data: { name: playerName, userId: user.id },
  })

  revalidatePath("/players")
  return player
}

export async function adminAddCredits(input: unknown) {
  const session = await getCurrentSession()
  if (!isAdminEmail(session?.user?.email)) throw new Error("Non autorizzato")
  const data = AdminAddCreditsSchema.parse(input)

  // Balance and ledger row move together: a credit without its euros (or the
  // reverse) would make the revenue figures wrong with no way to notice.
  await db.$transaction([
    db.player.update({
      where: { id: data.playerId },
      data: { sanderCredits: { increment: data.credits } },
    }),
    db.creditTopUp.create({
      data: {
        playerId: data.playerId,
        credits: data.credits,
        amountCents: data.amountCents,
        method: data.method,
        note: data.note || null,
        createdByEmail: session?.user?.email ?? null,
      },
    }),
  ])

  revalidatePath("/profile")
  revalidatePath("/admin/metriche")
}

export async function getHeadToHeadStats(playerAId: string, playerBId: string) {
  const [tournamentMatches, sessionMatches, nonMatchModeSessions] = await Promise.all([
    db.match.findMany({
      where: {
        isCompleted: true,
        isBye: false,
        AND: [
          { players: { some: { playerId: playerAId } } },
          { players: { some: { playerId: playerBId } } },
        ],
      },
      include: { players: { select: { playerId: true, team: true } } },
    }),
    db.sessionMatch.findMany({
      where: {
        isCompleted: true,
        AND: [
          { players: { some: { playerId: playerAId } } },
          { players: { some: { playerId: playerBId } } },
        ],
      },
      include: { players: { select: { playerId: true, team: true } } },
    }),
    db.session.findMany({
      where: {
        status: "COMPLETED",
        matchMode: false,
        sets: { some: {} },
        AND: [
          { participants: { some: { playerId: playerAId } } },
          { participants: { some: { playerId: playerBId } } },
        ],
      },
      include: {
        participants: { select: { playerId: true, team: true } },
        sets: { select: { teamAScore: true, teamBScore: true } },
      },
    }),
  ])

  const together = { played: 0, won: 0, lost: 0, setsWon: 0, setsLost: 0 }
  const versus   = { played: 0, won: 0, lost: 0, setsWon: 0, setsLost: 0 }

  function processMatch(
    players: { playerId: string; team: number }[],
    aScore: number,
    bScore: number,
    isSetScore = false,
  ) {
    if (aScore === bScore) return
    const pA = players.find((p) => p.playerId === playerAId)
    const pB = players.find((p) => p.playerId === playerBId)
    if (!pA || !pB) return

    const aWon = aScore > bScore
    const aWins = pA.team === 0 ? aWon : !aWon

    // For multi-set matches the scores ARE the set counts; for single-set matches
    // (tournament points, session match points) count 1 set for winner, 0 for loser.
    const mySetScore  = isSetScore ? (pA.team === 0 ? aScore : bScore) : (aWins ? 1 : 0)
    const oppSetScore = isSetScore ? (pA.team === 0 ? bScore : aScore) : (aWins ? 0 : 1)

    if (pA.team === pB.team) {
      together.played++
      if (aWins) together.won++; else together.lost++
      together.setsWon  += mySetScore
      together.setsLost += oppSetScore
    } else {
      versus.played++
      if (aWins) versus.won++; else versus.lost++
      versus.setsWon  += mySetScore
      versus.setsLost += oppSetScore
    }
  }

  for (const m of tournamentMatches) {
    processMatch(m.players, m.teamAScore ?? 0, m.teamBScore ?? 0)
  }
  for (const m of sessionMatches) {
    processMatch(m.players, m.teamAScore ?? 0, m.teamBScore ?? 0)
  }
  for (const s of nonMatchModeSessions) {
    const aSetWins = s.sets.filter((set) => set.teamAScore > set.teamBScore).length
    const bSetWins = s.sets.filter((set) => set.teamBScore > set.teamAScore).length
    processMatch(s.participants.filter((p) => p.team !== null) as { playerId: string; team: number }[], aSetWins, bSetWins, true)
  }

  return { together, versus }
}

export async function getH2HMatchHistory(playerAId: string, playerBId: string): Promise<MatchHistoryEntry[]> {
  const [tournamentMatches, sessionMatches, nonMatchModeSessions] = await Promise.all([
    db.match.findMany({
      where: {
        isCompleted: true,
        isBye: false,
        AND: [
          { players: { some: { playerId: playerAId } } },
          { players: { some: { playerId: playerBId } } },
        ],
      },
      include: {
        players: { include: { player: { select: { id: true, name: true, firstName: true } } } },
        tournament: { select: { id: true, name: true, date: true } },
      },
    }),
    db.sessionMatch.findMany({
      where: {
        isCompleted: true,
        AND: [
          { players: { some: { playerId: playerAId } } },
          { players: { some: { playerId: playerBId } } },
        ],
      },
      include: {
        players: { include: { player: { select: { id: true, name: true, firstName: true } } } },
        session: { select: { id: true, title: true, date: true } },
      },
    }),
    db.session.findMany({
      where: {
        status: "COMPLETED",
        matchMode: false,
        sets: { some: {} },
        AND: [
          { participants: { some: { playerId: playerAId } } },
          { participants: { some: { playerId: playerBId } } },
        ],
      },
      include: {
        participants: { include: { player: { select: { id: true, name: true, firstName: true } } } },
        sets: true,
      },
    }),
  ])

  const entries: MatchHistoryEntry[] = []

  for (const m of tournamentMatches) {
    const aScore = m.teamAScore ?? 0
    const bScore = m.teamBScore ?? 0
    if (aScore === bScore) continue
    const me = m.players.find((p) => p.playerId === playerAId)
    if (!me) continue
    const myTeam = me.team as 0 | 1
    const aWon = aScore > bScore
    const won = (myTeam === 0 && aWon) || (myTeam === 1 && !aWon)
    entries.push({
      id: `h2h-tm-${m.id}`,
      date: m.tournament.date,
      type: "tournament",
      sourceName: m.tournament.name,
      sourceId: m.tournament.id,
      result: won ? "won" : "lost",
      scoreA: aScore,
      scoreB: bScore,
      myTeam,
      partners: m.players.filter((p) => p.playerId !== playerAId && p.team === myTeam).map((p) => p.player),
      opponents: m.players.filter((p) => p.team !== myTeam).map((p) => p.player),
      isSetScore: false,
    })
  }

  for (const m of sessionMatches) {
    const aScore = m.teamAScore ?? 0
    const bScore = m.teamBScore ?? 0
    if (aScore === bScore) continue
    const me = m.players.find((p) => p.playerId === playerAId)
    if (!me) continue
    const myTeam = me.team as 0 | 1
    const aWon = aScore > bScore
    const won = (myTeam === 0 && aWon) || (myTeam === 1 && !aWon)
    entries.push({
      id: `h2h-sm-${m.id}`,
      date: m.session.date,
      type: "session",
      sourceName: m.session.title,
      sourceId: m.session.id,
      result: won ? "won" : "lost",
      scoreA: aScore,
      scoreB: bScore,
      myTeam,
      partners: m.players.filter((p) => p.playerId !== playerAId && p.team === myTeam).map((p) => p.player),
      opponents: m.players.filter((p) => p.team !== myTeam).map((p) => p.player),
      isSetScore: false,
    })
  }

  for (const s of nonMatchModeSessions) {
    const aSetWins = s.sets.filter((set) => set.teamAScore > set.teamBScore).length
    const bSetWins = s.sets.filter((set) => set.teamBScore > set.teamAScore).length
    if (aSetWins === bSetWins) continue
    const me = s.participants.find((p) => p.playerId === playerAId)
    if (!me || me.team === null) continue
    const myTeam = me.team as 0 | 1
    const aWon = aSetWins > bSetWins
    const won = (myTeam === 0 && aWon) || (myTeam === 1 && !aWon)
    entries.push({
      id: `h2h-s-${s.id}`,
      date: s.date,
      type: "session",
      sourceName: s.title,
      sourceId: s.id,
      result: won ? "won" : "lost",
      scoreA: aSetWins,
      scoreB: bSetWins,
      myTeam,
      partners: s.participants.filter((p) => p.playerId !== playerAId && p.team === myTeam && p.player).map((p) => p.player!),
      opponents: s.participants.filter((p) => p.team !== null && p.team !== myTeam && p.player).map((p) => p.player!),
      isSetScore: true,
    })
  }

  return entries.sort((a, b) => b.date.getTime() - a.date.getTime())
}

export async function updateStatPercentages(input: UpdateStatPctInput) {
  const player = await getCurrentPlayer()
  if (!player) throw new Error("Non autenticato")

  const data = UpdateStatPctSchema.parse(input)
  await db.player.update({ where: { id: player.id }, data })

  revalidatePath("/profile")
  revalidatePath(`/players/${player.id}`)
}

export async function deletePlayer(id: string) {
  const session = await getCurrentSession()
  if (!session?.user?.id) throw new Error("Non autenticato")
  if (!isAdminEmail(session.user.email)) throw new Error("Solo l'amministratore può eliminare i giocatori")

  const playerId = PlayerIdSchema.parse(id)

  const player = await db.player.findUnique({ where: { id: playerId }, select: { userId: true } })
  if (!player) throw new Error("Giocatore non trovato")

  // SANDER+ is stopped on Stripe first: never a deleted account still paying.
  await cancelPlusNow(playerId)

  // Deleting the Player row is not an option: sessions they organised point at
  // it with no cascade (the delete failed for any organiser), and the cascade on
  // match/standing rows would rewrite other people's tournament history. So the
  // row stays as an anonymous placeholder, stripped of every personal field,
  // and only the login (User + its Account/AuthSession rows) is deleted.
  // All in one transaction: never a half-deleted account.
  await db.$transaction(async (tx) => {
    // Matches they were organising can't go ahead with a ghost organiser:
    // cancel them and give the other players their credits back.
    const organised = await tx.session.findMany({
      where: { organizerId: playerId, status: { in: ["OPEN", "FULL"] } },
      select: { id: true },
    })
    for (const s of organised) {
      await tx.session.update({ where: { id: s.id }, data: { status: "CANCELLED" } })
      await refundSessionCredits(tx, s.id)
    }
    // Free the seats they held in other people's upcoming matches.
    const seats = await tx.sessionParticipant.findMany({
      where: { playerId, session: { status: { in: ["OPEN", "FULL"] } } },
      select: { id: true, sessionId: true },
    })
    for (const seat of seats) {
      await tx.sessionParticipant.delete({ where: { id: seat.id } })
      await tx.session.updateMany({ where: { id: seat.sessionId, status: "FULL" }, data: { status: "OPEN" } })
    }

    // Rows that only ever concerned this person.
    await tx.pushSubscription.deleteMany({ where: { playerId } })
    await tx.notification.deleteMany({ where: { playerId } })
    await tx.playerAvailability.deleteMany({ where: { playerId } })
    await tx.sessionWaitlist.deleteMany({ where: { playerId } })
    await tx.sessionNudge.deleteMany({ where: { playerId } })
    // Scopri: photos, prompts, likes and pairs are personal, not history.
    await tx.playerPhoto.deleteMany({ where: { playerId } })
    await tx.playerPrompt.deleteMany({ where: { playerId } })
    await tx.discoverProfile.deleteMany({ where: { playerId } })
    await tx.playerSwipe.deleteMany({ where: { OR: [{ fromId: playerId }, { toId: playerId }] } })
    await tx.dailyPick.deleteMany({ where: { OR: [{ playerId }, { pickId: playerId }] } })
    await tx.playerMatch.updateMany({ where: { OR: [{ aId: playerId }, { bId: playerId }], endedAt: null }, data: { endedAt: new Date() } })
    await tx.duo.updateMany({ where: { OR: [{ aId: playerId }, { bId: playerId }], status: { not: "ENDED" } }, data: { status: "ENDED", endedAt: new Date() } })
    await tx.playAgainVote.deleteMany({ where: { OR: [{ voterId: playerId }, { targetId: playerId }] } })
    await tx.attendanceEvent.deleteMany({ where: { playerId } })
    // Blocks they made go; reports others made about them stay for safety.
    await tx.playerBlock.deleteMany({ where: { blockerId: playerId } })

    await tx.player.update({
      where: { id: playerId },
      data: {
        name: DELETED_PLAYER_NAME,
        firstName: null,
        lastName: null,
        birthDate: null,
        gender: null,
        nationality: null,
        avatarUrl: null,
        userId: null,
        homeCity: null,
        startLevel: null,
        nudgesOptOut: true,
        sanderCredits: 0,
        // Zero games: off every leaderboard (see lib/rankingEligibility).
        matchesWon: 0,
        matchesLost: 0,
        winRatePct: 0,
        tournamentsWon: 0,
        sessionsPlayed: 0,
        xp: 0,
        level: 1,
      },
    })

    // Cascades to Account + AuthSession rows.
    if (player.userId) {
      await tx.user.delete({ where: { id: player.userId } })
    }
  })

  revalidatePath("/players")
  revalidatePath("/profile")
  revalidatePath("/")
}

// ── Advanced stats for player profile ─────────────────────────────────────────

export async function getPlayerAdvancedStats(playerId: string) {
  // 1. Tournaments by type
  const registrations = await db.tournamentRegistration.findMany({
    where: { playerId },
    include: { tournament: { select: { type: true, status: true } } },
  })

  const tournamentsByType: Record<string, number> = {}
  for (const r of registrations) {
    if (r.tournament.status === "COMPLETED") {
      const t = r.tournament.type
      tournamentsByType[t] = (tournamentsByType[t] ?? 0) + 1
    }
  }

  // 2. Community averages for stat percentages
  const allPlayers = await db.player.findMany({
    select: { attPct: true, difPct: true, murPct: true, alzPct: true, ricPct: true, staPct: true },
  })

  const count = allPlayers.length || 1
  const communityAvg = {
    attPct: Math.round(allPlayers.reduce((s, p) => s + p.attPct, 0) / count),
    difPct: Math.round(allPlayers.reduce((s, p) => s + p.difPct, 0) / count),
    murPct: Math.round(allPlayers.reduce((s, p) => s + p.murPct, 0) / count),
    alzPct: Math.round(allPlayers.reduce((s, p) => s + p.alzPct, 0) / count),
    ricPct: Math.round(allPlayers.reduce((s, p) => s + p.ricPct, 0) / count),
    staPct: Math.round(allPlayers.reduce((s, p) => s + p.staPct, 0) / count),
  }

  return { tournamentsByType, communityAvg }
}


export async function getMonthlyTopPlayers() {
  // The month on the Riviera calendar: the server clock is UTC, where the 1st
  // starts one or two hours late.
  const { start: startOfMonth } = romeMonthRange()

  // Tournament match wins this month
  const tourneyMatches = await db.match.findMany({
    where: { isCompleted: true, updatedAt: { gte: startOfMonth } },
    select: {
      teamAScore: true,
      teamBScore: true,
      players: { select: { playerId: true, team: true } },
    },
  })

  // MatchMode session: individual match wins (SessionMatchPlayer exists)
  const sessionMatches = await db.sessionMatch.findMany({
    where: { isCompleted: true, updatedAt: { gte: startOfMonth } },
    select: {
      teamAScore: true,
      teamBScore: true,
      players: { select: { playerId: true, team: true } },
    },
  })

  // Regular (non-matchMode) sessions completed this month: 1 win per session for winning team
  // Glicko updates from SessionSet, so we must use the same data source here
  const completedSessions = await db.session.findMany({
    where: { matchMode: false, status: "COMPLETED", updatedAt: { gte: startOfMonth }, sets: { some: {} } },
    select: {
      sets: { select: { teamAScore: true, teamBScore: true } },
      participants: { select: { playerId: true, team: true } },
    },
  })

  // Count wins per player
  const winMap: Record<string, number> = {}

  // Tournament + matchMode session matches
  for (const m of [...tourneyMatches, ...sessionMatches]) {
    if (m.teamAScore == null || m.teamBScore == null || m.teamAScore === m.teamBScore) continue
    const winningTeam = m.teamAScore > m.teamBScore ? 0 : 1
    for (const mp of m.players) {
      if (mp.team === winningTeam) {
        winMap[mp.playerId] = (winMap[mp.playerId] ?? 0) + 1
      }
    }
  }

  // Regular sessions (majority of sets)
  for (const s of completedSessions) {
    const teamASetWins = s.sets.filter((set) => set.teamAScore > set.teamBScore).length
    const teamBSetWins = s.sets.filter((set) => set.teamBScore > set.teamAScore).length
    if (teamASetWins === teamBSetWins) continue
    const winningTeam = teamASetWins > teamBSetWins ? 0 : 1
    for (const p of s.participants) {
      if (!p.playerId || p.team !== winningTeam) continue
      winMap[p.playerId] = (winMap[p.playerId] ?? 0) + 1
    }
  }

  if (Object.keys(winMap).length === 0) return []

  // Fetch up to top 10 candidates, then sort with glicko tiebreaker
  const topIds = Object.entries(winMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([id]) => id)

  const players = await db.player.findMany({
    where: { id: { in: topIds }, ...NOT_DELETED_PLAYER },
    select: {
      id: true,
      name: true,
      glickoRating: true,
      nationality: true,
      preferredRole: true,
      avatarUrl: true,
      attPct: true,
      difPct: true,
      ricPct: true,
      murPct: true,
      alzPct: true,
      staPct: true,
    },
  })

  return players
    .map((p) => ({ player: p, wins: winMap[p.id] ?? 0 }))
    .sort((a, b) => b.wins - a.wins || b.player.glickoRating - a.player.glickoRating)
    .slice(0, 3)
}

// ─── Monthly Awards ───────────────────────────────────────────────────────────

/** Same win-counting logic as getMonthlyTopPlayers but for the previous month */
async function getLastMonthTopPlayers() {
  const { start: startOfLastMonth, end: endOfLastMonth, year, month } = romeMonthRange(new Date(), -1)

  const tourneyMatches = await db.match.findMany({
    where: { isCompleted: true, updatedAt: { gte: startOfLastMonth, lt: endOfLastMonth } },
    select: { teamAScore: true, teamBScore: true, players: { select: { playerId: true, team: true } } },
  })
  const sessionMatches = await db.sessionMatch.findMany({
    where: { isCompleted: true, updatedAt: { gte: startOfLastMonth, lt: endOfLastMonth } },
    select: { teamAScore: true, teamBScore: true, players: { select: { playerId: true, team: true } } },
  })
  const completedSessions = await db.session.findMany({
    where: { matchMode: false, status: "COMPLETED", updatedAt: { gte: startOfLastMonth, lt: endOfLastMonth }, sets: { some: {} } },
    select: {
      sets: { select: { teamAScore: true, teamBScore: true } },
      participants: { select: { playerId: true, team: true } },
    },
  })

  const winMap: Record<string, number> = {}
  for (const m of [...tourneyMatches, ...sessionMatches]) {
    if (m.teamAScore == null || m.teamBScore == null || m.teamAScore === m.teamBScore) continue
    const winningTeam = m.teamAScore > m.teamBScore ? 0 : 1
    for (const mp of m.players) {
      if (mp.team === winningTeam) winMap[mp.playerId] = (winMap[mp.playerId] ?? 0) + 1
    }
  }
  for (const s of completedSessions) {
    const teamASetWins = s.sets.filter((set) => set.teamAScore > set.teamBScore).length
    const teamBSetWins = s.sets.filter((set) => set.teamBScore > set.teamAScore).length
    if (teamASetWins === teamBSetWins) continue
    const winningTeam = teamASetWins > teamBSetWins ? 0 : 1
    for (const p of s.participants) {
      if (!p.playerId || p.team !== winningTeam) continue
      winMap[p.playerId] = (winMap[p.playerId] ?? 0) + 1
    }
  }

  if (Object.keys(winMap).length === 0) return { top3: [], month, year }

  const topIds = Object.entries(winMap).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([id]) => id)
  const players = await db.player.findMany({
    where: { id: { in: topIds } },
    select: { id: true, glickoRating: true },
  })

  const top3 = players
    .map((p) => ({ id: p.id, wins: winMap[p.id] ?? 0, glicko: p.glickoRating }))
    .sort((a, b) => b.wins - a.wins || b.glicko - a.glicko)
    .slice(0, 3)

  return { top3, month, year }
}

export interface TournamentWin {
  tournamentId: string
  tournamentName: string
  date: Date
}

/**
 * Returns all tournaments that the given player won.
 * For non-Chicece: rank=1 in TournamentStanding.
 * For Chicece: player was on the winning team of the FINAL match.
 */
export async function getTournamentWins(playerId: string): Promise<TournamentWin[]> {
  const [standingWins, chiceceMatches] = await Promise.all([
    db.tournamentStanding.findMany({
      where: {
        playerId,
        rank: 1,
        tournament: { type: { not: "CHICECE" }, status: "COMPLETED" },
      },
      include: { tournament: { select: { id: true, name: true, date: true } } },
    }),
    db.match.findMany({
      where: {
        bracketSection: "FINAL",
        isCompleted: true,
        tournament: { type: "CHICECE", status: "COMPLETED" },
        players: { some: { playerId } },
      },
      include: {
        tournament: { select: { id: true, name: true, date: true } },
        players: { select: { playerId: true, team: true } },
      },
    }),
  ])

  const wins: TournamentWin[] = standingWins.map((s) => ({
    tournamentId: s.tournamentId,
    tournamentName: s.tournament.name,
    date: s.tournament.date,
  }))

  for (const m of chiceceMatches) {
    const teamAWon = (m.teamAScore ?? 0) > (m.teamBScore ?? 0)
    const winnerTeam = teamAWon ? 0 : 1
    if (m.players.some((p) => p.playerId === playerId && p.team === winnerTeam)) {
      wins.push({
        tournamentId: m.tournament.id,
        tournamentName: m.tournament.name,
        date: m.tournament.date,
      })
    }
  }

  return wins.sort((a, b) => b.date.getTime() - a.date.getTime())
}

/** Awards MonthlyAward records for the previous month's top 3. Idempotent. */
export async function awardMonthlyPodium() {
  // Cheap guard: once last month's podium is stored, skip the heavy recompute.
  // (This action was running getLastMonthTopPlayers on every /players?tab=podio view.)
  const { month: gMonth, year: gYear } = romeMonthRange(new Date(), -1)
  const already = await db.monthlyAward.findFirst({
    where: { month: gMonth, year: gYear },
    select: { id: true },
  })
  if (already) return

  const { top3, month, year } = await getLastMonthTopPlayers()
  if (top3.length === 0) return

  await Promise.all(
    top3.map((p, i) =>
      db.monthlyAward.upsert({
        where: { position_month_year: { position: i + 1, month, year } },
        create: { playerId: p.id, position: i + 1, month, year },
        update: {},
      }),
    ),
  )
}

// ── Match history ─────────────────────────────────────────────────────

export interface MatchHistoryEntry {
  id: string
  date: Date
  type: "tournament" | "session"
  sourceName: string
  sourceId: string
  result: "won" | "lost"
  scoreA: number
  scoreB: number
  myTeam: 0 | 1
  partners: { id: string; name: string; firstName: string | null }[]
  opponents: { id: string; name: string; firstName: string | null }[]
  isSetScore: boolean
}

export async function getMatchHistory(playerId: string, limit = 20): Promise<MatchHistoryEntry[]> {
  const [tournamentMatches, sessionMatches, nonMatchModeSessions] = await Promise.all([
    db.match.findMany({
      where: { players: { some: { playerId } }, isCompleted: true, isBye: false },
      include: {
        players: { include: { player: { select: { id: true, name: true, firstName: true } } } },
        tournament: { select: { id: true, name: true, date: true } },
      },
      orderBy: { tournament: { date: "desc" } },
      take: limit * 3,
    }),
    db.sessionMatch.findMany({
      where: { players: { some: { playerId } }, isCompleted: true },
      include: {
        players: { include: { player: { select: { id: true, name: true, firstName: true } } } },
        session: { select: { id: true, title: true, date: true } },
      },
      orderBy: { session: { date: "desc" } },
      take: limit * 3,
    }),
    db.session.findMany({
      where: {
        participants: { some: { playerId } },
        status: "COMPLETED",
        matchMode: false,
        sets: { some: {} },
      },
      include: {
        participants: { include: { player: { select: { id: true, name: true, firstName: true } } } },
        sets: true,
      },
      orderBy: { date: "desc" },
      take: limit * 3,
    }),
  ])

  const entries: MatchHistoryEntry[] = []

  for (const m of tournamentMatches) {
    const aScore = m.teamAScore ?? 0
    const bScore = m.teamBScore ?? 0
    if (aScore === bScore) continue
    const me = m.players.find((p) => p.playerId === playerId)
    if (!me) continue
    const myTeam = me.team as 0 | 1
    const aWon = aScore > bScore
    const won = (myTeam === 0 && aWon) || (myTeam === 1 && !aWon)
    entries.push({
      id: `tm-${m.id}`,
      date: m.tournament.date,
      type: "tournament",
      sourceName: m.tournament.name,
      sourceId: m.tournament.id,
      result: won ? "won" : "lost",
      scoreA: aScore,
      scoreB: bScore,
      myTeam,
      partners: m.players.filter((p) => p.playerId !== playerId && p.team === myTeam).map((p) => p.player),
      opponents: m.players.filter((p) => p.team !== myTeam).map((p) => p.player),
      isSetScore: false,
    })
  }

  for (const m of sessionMatches) {
    const aScore = m.teamAScore ?? 0
    const bScore = m.teamBScore ?? 0
    if (aScore === bScore) continue
    const me = m.players.find((p) => p.playerId === playerId)
    if (!me) continue
    const myTeam = me.team as 0 | 1
    const aWon = aScore > bScore
    const won = (myTeam === 0 && aWon) || (myTeam === 1 && !aWon)
    entries.push({
      id: `sm-${m.id}`,
      date: m.session.date,
      type: "session",
      sourceName: m.session.title,
      sourceId: m.session.id,
      result: won ? "won" : "lost",
      scoreA: aScore,
      scoreB: bScore,
      myTeam,
      partners: m.players.filter((p) => p.playerId !== playerId && p.team === myTeam).map((p) => p.player),
      opponents: m.players.filter((p) => p.team !== myTeam).map((p) => p.player),
      isSetScore: false,
    })
  }

  for (const s of nonMatchModeSessions) {
    const aSetWins = s.sets.filter((set) => set.teamAScore > set.teamBScore).length
    const bSetWins = s.sets.filter((set) => set.teamBScore > set.teamAScore).length
    if (aSetWins === bSetWins) continue
    const me = s.participants.find((p) => p.playerId === playerId)
    if (!me || me.team === null) continue
    const myTeam = me.team as 0 | 1
    const aWon = aSetWins > bSetWins
    const won = (myTeam === 0 && aWon) || (myTeam === 1 && !aWon)
    entries.push({
      id: `s-${s.id}`,
      date: s.date,
      type: "session",
      sourceName: s.title,
      sourceId: s.id,
      result: won ? "won" : "lost",
      scoreA: aSetWins,
      scoreB: bSetWins,
      myTeam,
      partners: s.participants.filter((p) => p.playerId !== playerId && p.team === myTeam && p.player).map((p) => p.player!),
      opponents: s.participants.filter((p) => p.team !== null && p.team !== myTeam && p.player).map((p) => p.player!),
      isSetScore: true,
    })
  }

  return entries
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, limit)
}

// ── Partner stats ─────────────────────────────────────────────────────

export interface PartnerStat {
  playerId: string
  player: { id: string; name: string; firstName: string | null }
  played: number
  won: number
  winRate: number
}

export async function getPartnerStats(playerId: string): Promise<PartnerStat[]> {
  const [tournamentMatches, sessionMatches] = await Promise.all([
    db.match.findMany({
      where: { players: { some: { playerId } }, isCompleted: true, isBye: false },
      include: { players: { select: { playerId: true, team: true } } },
    }),
    db.sessionMatch.findMany({
      where: { players: { some: { playerId } }, isCompleted: true },
      include: { players: { select: { playerId: true, team: true } } },
    }),
  ])

  const stats = new Map<string, { played: number; won: number }>()

  function processMatch(
    players: { playerId: string; team: number }[],
    teamAScore: number | null,
    teamBScore: number | null,
  ) {
    if (teamAScore == null || teamBScore == null || teamAScore === teamBScore) return
    const me = players.find((p) => p.playerId === playerId)
    if (!me) return
    const aWon = teamAScore > teamBScore
    const won = (me.team === 0 && aWon) || (me.team === 1 && !aWon)
    for (const partner of players.filter((p) => p.playerId !== playerId && p.team === me.team)) {
      const s = stats.get(partner.playerId) ?? { played: 0, won: 0 }
      stats.set(partner.playerId, { played: s.played + 1, won: s.won + (won ? 1 : 0) })
    }
  }

  for (const m of tournamentMatches) processMatch(m.players, m.teamAScore, m.teamBScore)
  for (const m of sessionMatches) processMatch(m.players, m.teamAScore, m.teamBScore)

  const partnerIds = [...stats.keys()]
  if (partnerIds.length === 0) return []

  const players = await db.player.findMany({
    where: { id: { in: partnerIds } },
    select: { id: true, name: true, firstName: true },
  })
  const playerMap = new Map(players.map((p) => [p.id, p]))

  return [...stats.entries()]
    .map(([id, s]) => ({
      playerId: id,
      player: playerMap.get(id)!,
      played: s.played,
      won: s.won,
      winRate: Math.round((s.won / s.played) * 100),
    }))
    .filter((s) => s.played >= 2 && s.player)
    .sort((a, b) => b.played - a.played)
}
