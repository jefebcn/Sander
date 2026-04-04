"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { getCurrentPlayer, getCurrentSession } from "@/lib/getCurrentPlayer"
import { CreatePlayerSchema, UpdatePlayerSchema, UpdateStatPctSchema } from "@/lib/validators/player.schema"
import type { CreatePlayerInput, UpdatePlayerInput, UpdateStatPctInput } from "@/lib/validators/player.schema"
import { isAdminEmail } from "@/lib/isAdmin"

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

export async function updatePlayer(id: string, input: UpdatePlayerInput) {
  const session = await getCurrentSession()
  if (!session?.user?.id) throw new Error("Non autenticato")

  // Verify the player belongs to the current user (or caller is admin)
  const target = await db.player.findUnique({ where: { id }, select: { userId: true } })
  if (!target) throw new Error("Giocatore non trovato")

  const isAdmin = isAdminEmail(session.user.email)
  if (!isAdmin && target.userId !== session.user.id) {
    throw new Error("Non autorizzato")
  }

  const data = UpdatePlayerSchema.parse(input)
  const player = await db.player.update({ where: { id }, data })

  revalidatePath("/players")
  revalidatePath(`/players/${id}`)
  return player
}

export async function getPlayer(id: string) {
  return db.player.findUniqueOrThrow({
    where: { id },
    include: {
      registrations: {
        include: { tournament: true },
        orderBy: { tournament: { date: "desc" } },
        take: 5,
      },
      _count: { select: { organizedSessions: true } },
      badgesReceived: { where: { badge: "MVP_PARTITA" } },
    },
  })
}

export async function listPlayers() {
  return db.player.findMany({
    orderBy: [{ matchesWon: "desc" }, { name: "asc" }],
  })
}

export async function checkHasPlayerProfile(): Promise<boolean> {
  const session = await getCurrentSession()
  if (!session?.user?.id) return false
  const player = await db.player.findUnique({
    where: { userId: session.user.id },
    select: { firstName: true, lastName: true },
  })
  // Profile must exist AND have first+last name filled in (i.e. onboarding completed)
  return !!(player?.firstName && player?.lastName)
}

export async function listUsersWithoutProfile() {
  const session = await getCurrentSession()
  if (!session?.user?.id) throw new Error("Non autenticato")

  return db.user.findMany({
    where: { player: null },
    select: { id: true, name: true, email: true },
    orderBy: { name: "asc" },
  })
}

export async function createMinimalPlayerForUser(userId: string) {
  const session = await getCurrentSession()
  if (!session?.user?.id) throw new Error("Non autenticato")

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

export async function getHeadToHeadStats(playerAId: string, playerBId: string) {
  // Find all completed tournament matches where BOTH players participated
  const matches = await db.match.findMany({
    where: {
      isCompleted: true,
      AND: [
        { players: { some: { playerId: playerAId } } },
        { players: { some: { playerId: playerBId } } },
      ],
    },
    include: { players: true },
  })

  const together = { played: 0, won: 0, lost: 0 }
  const versus   = { played: 0, won: 0, lost: 0 }

  for (const match of matches) {
    const mpA = match.players.find((p) => p.playerId === playerAId)
    const mpB = match.players.find((p) => p.playerId === playerBId)
    if (!mpA || !mpB) continue

    const teamAWon =
      match.teamAScore !== null &&
      match.teamBScore !== null &&
      match.teamAScore > match.teamBScore

    const aWon = mpA.team === 0 ? teamAWon : !teamAWon

    if (mpA.team === mpB.team) {
      // Same team — together
      together.played++
      if (aWon) together.won++
      else together.lost++
    } else {
      // Different teams — versus
      versus.played++
      if (aWon) versus.won++
      else versus.lost++
    }
  }

  return { together, versus }
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

  // Grab userId before deletion so we can remove the auth account too
  const player = await db.player.findUnique({ where: { id }, select: { userId: true } })

  await db.player.delete({ where: { id } })

  // Delete the linked User — cascades to Account + AuthSession rows
  if (player?.userId) {
    await db.user.delete({ where: { id: player.userId } })
  }

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
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  // Tournament match wins this month
  const tourneyMatches = await db.match.findMany({
    where: { isCompleted: true, updatedAt: { gte: startOfMonth } },
    select: {
      teamAScore: true,
      teamBScore: true,
      players: { select: { playerId: true, team: true } },
    },
  })

  // Session match wins this month
  const sessionMatches = await db.sessionMatch.findMany({
    where: { isCompleted: true, session: { date: { gte: startOfMonth } } },
    select: {
      teamAScore: true,
      teamBScore: true,
      players: { select: { playerId: true, team: true } },
    },
  })

  // Count wins per player
  const winMap: Record<string, number> = {}
  for (const m of [...tourneyMatches, ...sessionMatches]) {
    if (m.teamAScore == null || m.teamBScore == null || m.teamAScore === m.teamBScore) continue
    const winningTeam = m.teamAScore > m.teamBScore ? 0 : 1
    for (const mp of m.players) {
      if (mp.team === winningTeam) {
        winMap[mp.playerId] = (winMap[mp.playerId] ?? 0) + 1
      }
    }
  }

  if (Object.keys(winMap).length === 0) return []

  // Fetch up to top 10 candidates, then sort with glicko tiebreaker
  const topIds = Object.entries(winMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([id]) => id)

  const players = await db.player.findMany({
    where: { id: { in: topIds } },
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
