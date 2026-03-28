import { db } from "@/lib/db"

const VAPID_PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? ""
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY ?? ""

export interface PushPayload {
  title: string
  body: string
  url?: string
}

/** Send a push notification to all subscriptions of a given player. */
export async function notifyPlayer(playerId: string, payload: PushPayload) {
  if (!VAPID_PUBLIC || !VAPID_PRIVATE) return

  // Lazy-require web-push so it's never bundled into the client/SSR graph
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const webpush = require("web-push") as typeof import("web-push")
  webpush.setVapidDetails("mailto:support@sander.app", VAPID_PUBLIC, VAPID_PRIVATE)

  const subs = await db.pushSubscription.findMany({ where: { playerId } })
  await Promise.allSettled(
    subs.map((sub) =>
      webpush
        .sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify(payload),
        )
        .catch(async (err) => {
          // Remove expired / invalid subscriptions (HTTP 410 Gone)
          if (err?.statusCode === 410 || err?.statusCode === 404) {
            await db.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {})
          }
        }),
    ),
  )
}

/** Send push notifications to multiple players at once. */
export async function notifyPlayers(playerIds: string[], payload: PushPayload) {
  await Promise.allSettled(playerIds.map((id) => notifyPlayer(id, payload)))
}
