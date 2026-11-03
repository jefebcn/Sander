import { z } from "zod"

/** Browser push services. Anything else would make the server POST wherever
 *  a caller pointed it. */
const PUSH_HOSTS = [/^fcm\.googleapis\.com$/, /\.push\.services\.mozilla\.com$/, /\.notify\.windows\.com$/, /(^|\.)push\.apple\.com$/]

export function isPushServiceUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return url.protocol === "https:" && PUSH_HOSTS.some((h) => h.test(url.hostname))
  } catch {
    return false
  }
}

export const PushEndpointSchema = z.string().max(1000).refine(isPushServiceUrl, "Servizio di notifica non riconosciuto")

export const PushSubscriptionSchema = z.object({
  endpoint: PushEndpointSchema,
  keys: z.object({
    p256dh: z.string().min(1).max(200),
    auth: z.string().min(1).max(100),
  }),
})

/** Native app token: an APNs device token (hex) on iOS. */
export const NativePushTokenSchema = z.object({
  token: z.string().regex(/^[0-9a-fA-F]{32,200}$/, "Token non valido"),
  platform: z.literal("ios"),
}).strict()
