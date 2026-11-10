import http2 from "node:http2"
import { importPKCS8, SignJWT } from "jose"
import type { PushPayload } from "@/lib/push"

/* ────────────────────────────────────────────────────────────────────────── */
/*  Apple Push Notification service, straight over HTTP/2 (no SDK).            */
/*                                                                             */
/*  Env: APNS_KEY_ID, APNS_TEAM_ID, APNS_PRIVATE_KEY (the .p8 contents, "\n"   */
/*  escapes allowed), APNS_BUNDLE_ID (default com.sanderbv.app) and            */
/*  APNS_SANDBOX=true for builds run from Xcode; TestFlight and App Store use  */
/*  the production host.                                                       */
/* ────────────────────────────────────────────────────────────────────────── */

export function apnsConfigured(): boolean {
  return Boolean(process.env.APNS_KEY_ID && process.env.APNS_TEAM_ID && process.env.APNS_PRIVATE_KEY)
}

/**
 * The .p8 as a clean PEM, whatever the paste into Vercel did to it: surrounding
 * quotes, "\n" escapes, line breaks turned into spaces, or BEGIN/END lines
 * missing. Only the base64 body matters; it is re-wrapped at 64 characters.
 */
export function normalizeP8(raw: string): string {
  const body = raw
    .replace(/\\n/g, "\n")
    .replace(/-----(BEGIN|END)[^-]*-----/g, "")
    .replace(/["'\s]/g, "")
  const lines = body.match(/.{1,64}/g) ?? []
  return `-----BEGIN PRIVATE KEY-----\n${lines.join("\n")}\n-----END PRIVATE KEY-----\n`
}

// Apple wants a fresh provider token at most every 60 minutes and no more than every 20.
let cached: { jwt: string; at: number } | null = null

async function providerToken(): Promise<string> {
  if (cached && Date.now() - cached.at < 40 * 60_000) return cached.jwt
  const key = await importPKCS8(normalizeP8(process.env.APNS_PRIVATE_KEY!), "ES256")
  const jwt = await new SignJWT({})
    .setProtectedHeader({ alg: "ES256", kid: process.env.APNS_KEY_ID! })
    .setIssuer(process.env.APNS_TEAM_ID!)
    .setIssuedAt()
    .sign(key)
  cached = { jwt, at: Date.now() }
  return jwt
}

/** The APNs JSON body: alert + sound, plus the url the app opens on tap. */
export function apnsBody(payload: PushPayload): string {
  return JSON.stringify({
    aps: { alert: { title: payload.title, body: payload.body }, sound: "default" },
    ...(payload.url ? { url: payload.url } : {}),
  })
}

export type ApnsResult = "sent" | "gone" | "failed"

/** Sends to each token over one connection. "gone" = the token is dead, delete it. */
export async function sendApns(tokens: string[], payload: PushPayload): Promise<Map<string, ApnsResult>> {
  const results = new Map<string, ApnsResult>()
  if (!tokens.length || !apnsConfigured()) return results
  const host = process.env.APNS_SANDBOX === "true" ? "https://api.sandbox.push.apple.com" : "https://api.push.apple.com"
  const jwt = await providerToken()
  const body = apnsBody(payload)
  const client = http2.connect(host)
  client.on("error", () => {})
  try {
    await Promise.all(
      tokens.map(
        (token) =>
          new Promise<void>((resolve) => {
            const req = client.request({
              ":method": "POST",
              ":path": `/3/device/${token}`,
              authorization: `bearer ${jwt}`,
              "apns-topic": process.env.APNS_BUNDLE_ID ?? "com.sanderbv.app",
              "apns-push-type": "alert",
              "content-type": "application/json",
            })
            let status = 0
            let reply = ""
            req.setTimeout(10_000, () => req.close())
            req.on("response", (h) => (status = Number(h[":status"])))
            req.on("data", (c) => (reply += c))
            req.on("close", () => {
              // 410 = uninstalled; 400 BadDeviceToken = token from the other environment or garbage.
              const dead = status === 410 || (status === 400 && /BadDeviceToken|DeviceTokenNotForTopic/.test(reply))
              results.set(token, status === 200 ? "sent" : dead ? "gone" : "failed")
              if (status !== 200 && !dead) console.error("APNs push failed", status, reply.slice(0, 200))
              resolve()
            })
            req.on("error", () => resolve())
            req.end(body)
          }),
      ),
    )
  } finally {
    client.close()
  }
  return results
}
