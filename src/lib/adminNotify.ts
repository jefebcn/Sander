import { db } from "@/lib/db"
import { notifyPlayers, type PushPayload } from "@/lib/push"

/** Admin emails from ADMIN_EMAILS (comma separated), lowercase. */
function adminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? process.env.ADMIN_EMAIL ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
}

/** Push to every admin who has a player profile. Never throws. */
export async function notifyAdmins(payload: PushPayload): Promise<void> {
  try {
    const emails = adminEmails()
    if (!emails.length) return
    const admins = await db.player.findMany({
      where: { user: { email: { in: emails, mode: "insensitive" } } },
      select: { id: true },
    })
    if (admins.length) await notifyPlayers(admins.map((a) => a.id), payload)
  } catch (e) {
    console.error("notifyAdmins failed", e)
  }
}
