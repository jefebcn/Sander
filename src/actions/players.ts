"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { CreatePlayerSchema, UpdatePlayerSchema } from "@/lib/validators/player.schema"
import type { CreatePlayerInput, UpdatePlayerInput } from "@/lib/validators/player.schema"

export async function createPlayer(input: CreatePlayerInput) {
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
  const data = UpdatePlayerSchema.parse(input)

  const player = await db.player.update({
    where: { id },
    data,
  })

  revalidatePath("/players")
  revalidatePath(`/players/${id}`)
  return player
}

export async function getPlayer(id: string) {
  return db.player.findUniqueOrThrow({
    where: { id },
    include: {
      registrations: {
        include: {
          tournament: true,
        },
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

export async function deletePlayer(id: string) {
  await db.player.delete({ where: { id } })
  revalidatePath("/players")
}
