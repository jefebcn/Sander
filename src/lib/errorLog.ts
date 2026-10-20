import { db } from "@/lib/db"
import { notifyAdmins } from "@/lib/adminNotify"
import { errorFingerprint } from "@/lib/errorFingerprint"

/* ────────────────────────────────────────────────────────────────────────── */
/*  Error log: what went wrong for players, without an external service.       */
/*                                                                             */
/*  Server errors arrive from instrumentation.ts, browser errors from          */
/*  /api/errors. The same error on the same page is one row whose counter      */
/*  goes up, so a crash hit by a hundred people is one line in /admin/sistema. */
/*  A brand-new error also pings the admins (a few per hour at most).          */
/* ────────────────────────────────────────────────────────────────────────── */

export type ErrorSource = "client" | "server"

export interface ErrorReport {
  source: ErrorSource
  message: string
  path?: string | null
  stack?: string | null
  digest?: string | null
  userAgent?: string | null
}

const MAX_MESSAGE = 500
const MAX_STACK = 4000
/** New distinct errors per hour beyond which reports are dropped (flood guard). */
const MAX_NEW_PER_HOUR = 200
/** Push alerts to admins per hour, for new errors only. */
const MAX_ALERTS_PER_HOUR = 5

const clip = (s: string | null | undefined, n: number) => (s ? s.slice(0, n) : null)

/** Never throws: a broken error log must not break the page that reported. */
export async function recordError(r: ErrorReport): Promise<void> {
  try {
    const message = clip(r.message, MAX_MESSAGE) || "(senza messaggio)"
    const fingerprint = errorFingerprint({ ...r, message })
    const now = new Date()
    const existing = await db.appError.findUnique({ where: { fingerprint }, select: { id: true } })
    if (existing) {
      await db.appError.update({
        where: { id: existing.id },
        data: { count: { increment: 1 }, lastSeenAt: now, digest: clip(r.digest, 64) ?? undefined },
      })
      return
    }
    const hourAgo = new Date(now.getTime() - 3600_000)
    const newThisHour = await db.appError.count({ where: { firstSeenAt: { gte: hourAgo } } })
    if (newThisHour >= MAX_NEW_PER_HOUR) return
    await db.appError.create({
      data: {
        fingerprint,
        source: r.source,
        message,
        path: clip(r.path, 300),
        stack: clip(r.stack, MAX_STACK),
        digest: clip(r.digest, 64),
        userAgent: clip(r.userAgent, 300),
      },
    })
    if (newThisHour < MAX_ALERTS_PER_HOUR) await alertAdmins(r.source, message, r.path)
  } catch (e) {
    console.error("recordError failed", e)
  }
}

async function alertAdmins(source: ErrorSource, message: string, path?: string | null) {
  await notifyAdmins({
    title: source === "server" ? "Nuovo errore del server" : "Nuovo errore in app",
    body: `${path ? `${path.split("?")[0]}: ` : ""}${message}`.slice(0, 140),
    url: "/admin/sistema",
  })
}
