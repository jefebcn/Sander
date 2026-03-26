export const dynamic = "force-dynamic"

import { redirect } from "next/navigation"
import Link from "next/link"
import { Settings } from "lucide-react"
import { getCurrentPlayer } from "@/lib/getCurrentPlayer"
import { db } from "@/lib/db"
import { SanderCard } from "@/components/player/SanderCard"
import { PageHeader } from "@/components/layout/PageHeader"
import { SignOutButton } from "@/components/auth/SignOutButton"

async function getStreak(playerId: string): Promise<number> {
  const since = new Date(Date.now() - 28 * 24 * 60 * 60 * 1000)
  const count = await db.sessionParticipant.count({
    where: {
      playerId,
      session: { status: "COMPLETED", date: { gte: since } },
    },
  })
  return Math.min(count, 10)
}

export default async function ProfilePage() {
  const player = await getCurrentPlayer()

  if (!player) {
    redirect("/auth/signin?callbackUrl=/profile")
  }

  const [fullPlayer, streak] = await Promise.all([
    db.player.findUniqueOrThrow({
      where: { id: player.id },
      include: {
        registrations: {
          include: { tournament: true },
          orderBy: { tournament: { date: "desc" } },
          take: 5,
        },
        badgesReceived: { orderBy: { createdAt: "desc" } },
      },
    }),
    getStreak(player.id),
  ])

  return (
    <div className="pb-6">
      <PageHeader title="Profilo" subtitle={fullPlayer.name} />

      <div className="px-4 space-y-4">
        <div className="slide-up">
          <SanderCard player={{ ...fullPlayer, streak }} />
        </div>

        {/* Edit profile */}
        <div className="slide-up stagger-2">
          <Link
            href="/onboarding/profile"
            className="flex min-h-[3.5rem] w-full items-center justify-center gap-2 rounded-2xl bg-[var(--surface-2)] font-semibold text-[var(--foreground)] transition-colors hover:bg-[var(--surface-3)]"
          >
            <Settings className="h-4 w-4 text-[var(--muted-text)]" />
            Modifica profilo
          </Link>
        </div>

        {/* Sign out */}
        <div className="slide-up stagger-3">
          <SignOutButton className="flex min-h-[3.5rem] w-full items-center justify-center gap-2 rounded-2xl bg-[var(--surface-2)] font-semibold text-[var(--danger)] transition-colors hover:bg-[var(--surface-3)]" />
        </div>
      </div>
    </div>
  )
}
