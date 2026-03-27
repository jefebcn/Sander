export const dynamic = "force-dynamic"

import { redirect } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Settings, User } from "lucide-react"
import { getCurrentPlayer } from "@/lib/getCurrentPlayer"
import { db } from "@/lib/db"
import { SanderCardFifa } from "@/components/player/SanderCardFifa"
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
        _count: { select: { organizedSessions: true, badgesReceived: true } },
        badgesReceived: {
          where: { badge: "MVP_PARTITA" },
        },
      },
    }),
    getStreak(player.id),
  ])

  return (
    <div
      className="relative min-h-dvh"
      style={{ background: "linear-gradient(170deg, #0a1f05 0%, #0d1a0d 50%, #060e06 100%)" }}
    >
      {/* Faint logo watermark */}
      <div className="pointer-events-none fixed inset-0 flex items-center justify-center" aria-hidden="true">
        <Image
          src="/sander-logo.png"
          alt=""
          width={400}
          height={400}
          className="object-contain opacity-[0.04]"
        />
      </div>

      <div className="relative z-10 px-4 pb-8" style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 2.5rem)" }}>

        {/* ── Header ──────────────────────────────────────── */}
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-4xl font-black leading-tight text-white">
            Scendi in<br />
            <span className="text-[var(--accent)]">campo.</span>
          </h1>
          <div
            className="flex h-10 w-10 items-center justify-center rounded-full"
            style={{ background: "rgba(201,243,29,0.12)", border: "1.5px solid rgba(201,243,29,0.25)" }}
          >
            <User className="h-5 w-5 text-[var(--accent)]" />
          </div>
        </div>

        {/* ── FIFA-style card ──────────────────────────────── */}
        <div className="slide-up">
          <SanderCardFifa
            player={{
              name: fullPlayer.name,
              firstName: fullPlayer.firstName,
              lastName: fullPlayer.lastName,
              avatarUrl: fullPlayer.avatarUrl,
              avgRating: fullPlayer.avgRating,
              glickoRating: fullPlayer.glickoRating,
              level: fullPlayer.level,
              xp: fullPlayer.xp,
              winRatePct: fullPlayer.winRatePct,
              matchesWon: fullPlayer.matchesWon,
              matchesLost: fullPlayer.matchesLost,
              sessionsPlayed: fullPlayer.sessionsPlayed,
              flopVotes: fullPlayer.flopVotes,
              tournamentsWon: fullPlayer.tournamentsWon,
              organizedSessions: fullPlayer._count.organizedSessions,
              streak,
              mvpCount: fullPlayer.badgesReceived.length,
            }}
          />
        </div>

        {/* ── Actions ─────────────────────────────────────── */}
        <div className="mt-4 space-y-3 slide-up stagger-2">
          <Link
            href="/onboarding/profile"
            className="flex min-h-[3.5rem] w-full items-center justify-center gap-2 rounded-2xl bg-[var(--surface-2)] font-semibold text-[var(--foreground)] transition-colors hover:bg-[var(--surface-3)]"
          >
            <Settings className="h-4 w-4 text-[var(--muted-text)]" />
            Modifica profilo
          </Link>

          <SignOutButton className="flex min-h-[3.5rem] w-full items-center justify-center gap-2 rounded-2xl bg-[var(--surface-2)] font-semibold text-[var(--danger)] transition-colors hover:bg-[var(--surface-3)]" />
        </div>
      </div>
    </div>
  )
}
