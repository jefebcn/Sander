"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { getCurrentPlayer, getCurrentSession } from "@/lib/getCurrentPlayer"
import { CreatePlayerSchema, UpdatePlayerSchema } from "@/lib/validators/player.schema"
import type { CreatePlayerInput, UpdatePlayerInput } from "@/lib/validators/player.schema"

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? ""

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

  const isAdmin = ADMIN_EMAIL && session.user.email === ADMIN_EMAIL
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
    },
  })
}

export async function listPlayers() {
  return db.player.findMany({
    orderBy: [{ matchesWon: "desc" }, { name: "asc" }],
  })
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

export async function deletePlayer(id: string) {
  const session = await getCurrentSession()
  if (!session?.user?.id) throw new Error("Non autenticato")

  // Only admin can delete players
  const isAdmin = ADMIN_EMAIL && session.user.email === ADMIN_EMAIL
  if (!isAdmin) throw new Error("Solo l'amministratore può eliminare i giocatori")

  await db.player.delete({ where: { id } })
  revalidatePath("/players")
}
