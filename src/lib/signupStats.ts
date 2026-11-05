import { db } from "@/lib/db"
import { romeDayStart } from "@/lib/romeMonth"

const DAY = 86_400_000

/** Players who signed up through the app (have a login), not organiser-added guests. */
const SIGNED_UP = { userId: { not: null } } as const

/** New sign-ups for /admin/metriche: pace, channels and the latest arrivals. */
export async function getSignupStats(now: Date = new Date()) {
  const since30 = new Date(now.getTime() - 30 * DAY)
  const [today, week, month, total, noProfile, bySource, invited30, google30, latest] = await Promise.all([
    db.player.count({ where: { ...SIGNED_UP, createdAt: { gte: romeDayStart(now) } } }),
    db.player.count({ where: { ...SIGNED_UP, createdAt: { gte: new Date(now.getTime() - 7 * DAY) } } }),
    db.player.count({ where: { ...SIGNED_UP, createdAt: { gte: since30 } } }),
    db.player.count({ where: SIGNED_UP }),
    // Accounts that never finished the profile: the onboarding drop-off.
    db.user.count({ where: { player: null } }),
    db.player.groupBy({
      by: ["signupSource"],
      where: { ...SIGNED_UP, createdAt: { gte: since30 } },
      _count: { _all: true },
    }),
    db.player.count({ where: { createdAt: { gte: since30 }, user: { invitedByPlayerId: { not: null } } } }),
    db.player.count({ where: { createdAt: { gte: since30 }, user: { accounts: { some: { provider: "google" } } } } }),
    db.player.findMany({
      where: SIGNED_UP,
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        name: true,
        homeCity: true,
        createdAt: true,
        signupSource: true,
        user: { select: { invitedByPlayerId: true, accounts: { select: { provider: true } } } },
      },
    }),
  ])

  return {
    today,
    week,
    month,
    total,
    noProfile,
    invited30,
    google30,
    bySource: bySource
      .map((s) => ({ source: s.signupSource, count: s._count._all }))
      .sort((a, b) => b.count - a.count),
    latest: latest.map((p) => ({
      id: p.id,
      name: p.name,
      homeCity: p.homeCity,
      createdAt: p.createdAt,
      source: p.user?.invitedByPlayerId ? "invito" : p.signupSource,
      method: p.user?.accounts.some((a) => a.provider === "google") ? "Google" : "Email",
    })),
  }
}
