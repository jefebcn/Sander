import { db } from "@/lib/db"
import { notifyAdmins } from "@/lib/adminNotify"
import { sendAdminEmail } from "@/lib/email"
import { signupSourceLabel } from "@/lib/signupSource"

/** Tells the admins a new player finished the profile. Never throws. */
export async function notifyNewSignup(playerId: string): Promise<void> {
  try {
    const p = await db.player.findUnique({
      where: { id: playerId },
      select: {
        name: true,
        homeCity: true,
        signupSource: true,
        user: { select: { invitedByPlayerId: true, accounts: { select: { provider: true } } } },
      },
    })
    if (!p) return
    const total = await db.player.count({ where: { userId: { not: null } } })
    const method = p.user?.accounts.some((a) => a.provider === "google") ? "Google" : "email"
    const source = p.user?.invitedByPlayerId ? "Invito" : signupSourceLabel(p.signupSource)
    const where = p.homeCity ? ` · ${p.homeCity}` : ""
    const body = `${p.name}${where} · da ${source} · con ${method}. Iscritti totali: ${total}`
    await Promise.allSettled([
      notifyAdmins({ title: "Nuovo iscritto", body: body.slice(0, 140), url: "/admin/metriche#iscritti" }),
      sendAdminEmail(`Nuovo iscritto su SANDER: ${p.name}`, [
        `Nome: ${p.name}`,
        `Comune: ${p.homeCity ?? "non indicato"}`,
        `Provenienza: ${source}`,
        `Accesso con: ${method}`,
        `Iscritti totali: ${total}`,
      ], "/admin/metriche#iscritti"),
    ])
  } catch (e) {
    console.error("notifyNewSignup failed", e)
  }
}
