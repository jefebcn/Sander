/**
 * Vercel Cron sends `Authorization: Bearer $CRON_SECRET` when that variable is
 * set on the project. Without a secret anyone could trigger the jobs (mass push
 * notifications), so in production a missing secret means "closed", not "open".
 */
export function cronAuthorized(authorization: string | null): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      console.error("[cron] CRON_SECRET is not set: refusing to run")
      return false
    }
    return true
  }
  return authorization === `Bearer ${secret}`
}
