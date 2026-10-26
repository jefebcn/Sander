"use server"

import { db } from "@/lib/db"
import { getCurrentPlayer } from "@/lib/getCurrentPlayer"
import { revalidatePath } from "next/cache"
import { PushEndpointSchema, PushSubscriptionSchema } from "@/lib/validators/push.schema"

export async function subscribePush(input: unknown) {
  const subscription = PushSubscriptionSchema.parse(input)
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

export async function unsubscribePush(input: unknown) {
  const endpoint = PushEndpointSchema.parse(input)
  const player = await getCurrentPlayer()
  if (!player) return

  // Only your own: someone else's endpoint stays subscribed.
  await db.pushSubscription.deleteMany({ where: { endpoint, playerId: player.id } })

  revalidatePath("/profile")
}

export async function getPushStatus(): Promise<boolean> {
  const player = await getCurrentPlayer()
  if (!player) return false
  const count = await db.pushSubscription.count({ where: { playerId: player.id } })
  return count > 0
}
