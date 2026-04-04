import { db } from "@/lib/db"

const VAPID_PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? ""
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY ?? ""

export interface PushPayload {
  title: string
  body: string
  url?: string
}

/** Send a push notification to all subscriptions of a given player.
 *  Also persists the notification to the DB for in-app history. */
export async function notifyPlayer(playerId: string, payload: PushPayload) {
  // Always persist to DB so in-app history works even without push subscription
  await db.notification
    .create({ data: { playerId, title: payload.title, body: payload.body, url: payload.url ?? null } })
    .catch(() => {}) // non-fatal

  // Trim to last 50 notifications for this player
  const totalCount = await db.notification.count({ where: { playerId } })
  if (totalCount > 50) {
    const toDelete = await db.notification.findMany({
      where: { playerId },
      orderBy: { createdAt: "asc" },
      take: totalCount - 50,
      select: { id: true },
    })
    await db.notification
      .deleteMany({ where: { id: { in: toDelete.map((n) => n.id) } } })
      .catch(() => {})
  }

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
