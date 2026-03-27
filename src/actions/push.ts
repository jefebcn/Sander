"use server"

import { db } from "@/lib/db"
import { getCurrentPlayer } from "@/lib/getCurrentPlayer"
import { revalidatePath } from "next/cache"

export async function subscribePush(subscription: {
  endpoint: string
  keys: { p256dh: string; auth: string }
}) {
  const player = await getCurrentPlayer()
  if (!player) throw new Error("Non autenticato")

  await db.pushSubscription.upsert({
    where: { endpoint: subscription.endpoint },
    create: {
      playerId: player.id,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
    },
    update: {
      playerId: player.id,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
    },
  })
}

export async function unsubscribePush(endpoint: string) {
  const player = await getCurrentPlayer()
  if (!player) return

  await db.pushSubscription
    .delete({ where: { endpoint } })
    .catch(() => {})

  revalidatePath("/profile")
}

export async function getPushStatus(): Promise<boolean> {
  const player = await getCurrentPlayer()
  if (!player) return false
  const count = await db.pushSubscription.count({ where: { playerId: player.id } })
  return count > 0
}
