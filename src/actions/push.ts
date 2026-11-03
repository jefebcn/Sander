"use server"

import { db } from "@/lib/db"
import { getCurrentPlayer } from "@/lib/getCurrentPlayer"
import { revalidatePath } from "next/cache"
import { NativePushTokenSchema, PushEndpointSchema, PushSubscriptionSchema } from "@/lib/validators/push.schema"

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
  const [web, native] = await Promise.all([
    db.pushSubscription.count({ where: { playerId: player.id } }),
    db.nativePushToken.count({ where: { playerId: player.id } }),
  ])
  return web + native > 0
}

/** The iPhone app's APNs token: moves to whoever is signed in on that phone now. */
export async function registerNativePush(input: unknown) {
  const { token, platform } = NativePushTokenSchema.parse(input)
  const player = await getCurrentPlayer()
  if (!player) return
  const t = token.toLowerCase()
  await db.nativePushToken.upsert({
    where: { token: t },
    create: { playerId: player.id, token: t, platform },
    update: { playerId: player.id, platform },
  })
}

export async function unregisterNativePush(input: unknown) {
  const { token } = NativePushTokenSchema.parse(input)
  const player = await getCurrentPlayer()
  if (!player) return
  await db.nativePushToken.deleteMany({ where: { token: token.toLowerCase(), playerId: player.id } })
  revalidatePath("/profile")
}
