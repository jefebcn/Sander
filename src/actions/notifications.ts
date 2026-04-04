"use server"

import { db } from "@/lib/db"
import { getCurrentPlayer } from "@/lib/getCurrentPlayer"
import { revalidatePath } from "next/cache"

export async function getNotifications() {
  const player = await getCurrentPlayer()
  if (!player) return []

  return db.notification.findMany({
    where: { playerId: player.id },
    orderBy: { createdAt: "desc" },
    take: 30,
    select: { id: true, createdAt: true, title: true, body: true, url: true, readAt: true },
  })
}

export async function getUnreadCount(): Promise<number> {
  const player = await getCurrentPlayer()
  if (!player) return 0

  return db.notification.count({ where: { playerId: player.id, readAt: null } })
}

export async function markAllRead() {
  const player = await getCurrentPlayer()
  if (!player) return

  await db.notification.updateMany({
    where: { playerId: player.id, readAt: null },
    data: { readAt: new Date() },
  })

  revalidatePath("/")
}

export async function markRead(id: string) {
  const player = await getCurrentPlayer()
  if (!player) return

  await db.notification.updateMany({
    where: { id, playerId: player.id, readAt: null },
    data: { readAt: new Date() },
  })
}
