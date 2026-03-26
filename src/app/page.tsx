export const dynamic = "force-dynamic"

import Image from "next/image"
import Link from "next/link"
import { ChevronRight, Instagram } from "lucide-react"
import { getCurrentPlayer } from "@/lib/getCurrentPlayer"
import { db } from "@/lib/db"

export default async function Home() {
  const player = await getCurrentPlayer()

  let fullPlayer = null
  if (player) {
    fullPlayer = await db.player.findUnique({
      where: { id: player.id },
      include: { _count: { select: { organizedSessions: true } } },
    })
  }

  const avgDisplay =
    fullPlayer && fullPlayer.avgRating > 0
      ? (fullPlayer.avgRating / 10).toFixed(2)
      : "0.00"
  const xpCurrent = fullPlayer ? fullPlayer.xp % 100 : 0
  const xpToNext = 100 - xpCurrent
  const xpPct = fullPlayer ? Math.round((xpCurrent / 100) * 100) : 0
  const nextLevel = fullPlayer ? fullPlayer.level + 1 : 2
  const totalMatches = fullPlayer
    ? fullPlayer.matchesWon + fullPlayer.matchesLost
    : 0
  const streakPct =
    totalMatches > 0
      ? Math.round((fullPlayer!.matchesWon / totalMatches) * 100)
      : 0

  return (
    <div
      className="relative min-h-dvh overflow-x-hidden"
      style={{ backgroundColor: "#0b0f0b" }}
    >
      {/* Sander logo background watermark */}
      <div
        className="pointer-events-none fixed inset-0 flex items-center justify-center"
        aria-hidden="true"
      >
        <Image
          src="/sander-logo.png"
          alt=""
          width={520}
          height={520}
          className="object-contain opacity-[0.04]"
          priority
        />
      </div>

      <div
        className="relative z-10 flex flex-col gap-4 px-4 pb-6"
        style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 3rem)" }}
      >
        {/* ── Header ──────────────────────────────────────────── */}
        <div className="flex items-center gap-3 mb-1">
          <Image
            src="/sander-logo.png"
            alt="Sander"
            width={42}
            height={42}
            className="object-contain"
          />
          <span className="text-base font-semibold tracking-wide text-white/80">
            Get in the game.
          </span>
        </div>

        {fullPlayer ? (
          <>
            {/* ── Profile Card ──────────────────────────────────── */}
            <div className="flex items-center gap-4 rounded-2xl bg-[var(--surface-2)] p-5">
              {/* Avatar */}
              <div className="h-[4.5rem] w-[4.5rem] flex-shrink-0 overflow-hidden rounded-full bg-[var(--accent)] flex items-center justify-center">
                {fullPlayer.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={fullPlayer.avatarUrl}
                    alt={fullPlayer.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <svg viewBox="0 0 100 100" className="h-14 w-14" fill="none">
                    <circle cx="50" cy="38" r="18" fill="rgba(0,0,0,0.3)" />
                    <ellipse cx="50" cy="80" rx="28" ry="18" fill="rgba(0,0,0,0.3)" />
                  </svg>
                )}
              </div>
              {/* Name */}
              <div className="min-w-0 flex-1">
                <p className="text-2xl font-black leading-tight text-white">
                  {fullPlayer.firstName ?? fullPlayer.name.split(" ")[0]}
                </p>
                <p className="text-2xl font-black leading-tight text-white">
                  {fullPlayer.lastName ??
                    fullPlayer.name.split(" ").slice(1).join(" ")}
                </p>
              </div>
              {/* Level badge */}
              <div className="flex flex-shrink-0 flex-col items-center justify-center rounded-xl bg-[var(--surface-3)] px-4 py-2">
                <span className="text-[0.6rem] font-bold uppercase tracking-widest text-[var(--muted-text)]">
                  LIVELLO
                </span>
                <span className="text-3xl font-black leading-tight text-white">
                  {fullPlayer.level}
                </span>
              </div>
            </div>

            {/* ── XP Progress Card ──────────────────────────────── */}
            <div className="rounded-2xl bg-[var(--surface-2)] p-5">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-wider text-[var(--muted-text)]">
                  PROSSIMO LIVELLO{" "}
                  <span className="text-white">{nextLevel}</span>
                </p>
                <p className="text-sm font-black">
                  <span className="text-[var(--accent)]">{xpCurrent}</span>
                  <span className="text-[var(--muted-text)]">/100</span>
                </p>
              </div>
              <div className="mb-3 h-1 overflow-hidden rounded-full bg-[var(--surface-3)]">
                <div
                  className="h-full rounded-full bg-[var(--accent)]"
                  style={{ width: `${Math.max(2, xpPct)}%` }}
                />
              </div>
              <Link href="/players" className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-[var(--accent)] px-2.5 py-0.5 text-xs font-black text-black">
                    -{xpToNext} punti
                  </span>
                  <span className="text-sm text-[var(--muted-text)]">
                    al prossimo livello 🚀
                  </span>
                </div>
                <ChevronRight className="h-4 w-4 flex-shrink-0 text-[var(--accent)]" />
              </Link>
            </div>

            {/* ── Stats Card ────────────────────────────────────── */}
            <div className="overflow-hidden rounded-2xl bg-[var(--surface-2)]">
              {/* Top stats row */}
              <div className="grid grid-cols-5 divide-x divide-[var(--border)] pb-3 pt-5">
                {[
                  { label: "MV", value: avgDisplay },
                  { label: "MVP", value: fullPlayer.superVotes },
                  { label: "PLA", value: fullPlayer.sessionsPlayed },
                  { label: "ORG", value: fullPlayer._count.organizedSessions },
                  { label: "PEN", value: fullPlayer.flopVotes },
                ].map(({ label, value }) => (
                  <div key={label} className="flex flex-col items-center gap-1 py-1">
                    <span className="text-[0.65rem] font-bold uppercase tracking-wider text-[var(--muted-text)]">
                      {label}
                    </span>
                    <span className="text-xl font-black text-white">{value}</span>
                  </div>
                ))}
              </div>

              <div className="mx-4 border-t border-[var(--border)]" />

              {/* Streak row */}
              <div className="px-5 py-4">
                <div className="flex items-center gap-3">
                  <span className="flex-shrink-0 text-xs font-bold uppercase tracking-wider text-[var(--muted-text)]">
                    STREAK
                  </span>
                  {/* Colour bar */}
                  <div className="relative h-2 flex-1 overflow-hidden rounded-full">
                    <div
                      className="absolute inset-0 rounded-full"
                      style={{
                        background:
                          "linear-gradient(to right, #ef4444 0%, #f97316 33%, #eab308 66%, #22c55e 100%)",
                      }}
                    />
                    {streakPct < 100 && (
                      <div
                        className="absolute inset-y-0 right-0 bg-[var(--surface-2)]"
                        style={{ left: `${streakPct}%` }}
                      />
                    )}
                    {/* Thumb */}
                    <div
                      className="absolute top-1/2 h-4 w-1.5 -translate-y-1/2 rounded-sm bg-white shadow"
                      style={{ left: `${Math.max(0, Math.min(93, streakPct))}%` }}
                    />
                  </div>
                  <span className="flex-shrink-0 text-xl font-black text-white">
                    {fullPlayer.matchesWon}
                  </span>
                </div>
                <Link
                  href="/sessions"
                  className="mt-3 flex items-center justify-between"
                >
                  <span className="text-sm text-[var(--muted-text)]">
                    Partite nelle ultime 4 settimane
                  </span>
                  <ChevronRight className="h-4 w-4 flex-shrink-0 text-[var(--accent)]" />
                </Link>
              </div>
            </div>

            {/* ── Social section ────────────────────────────────── */}
            <div className="mt-1">
              <p className="mb-3 text-base text-white/70">
                Segui Sander sui social
              </p>
              <a
                href="https://www.instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="relative flex h-44 items-end overflow-hidden rounded-2xl"
                style={{
                  background:
                    "linear-gradient(135deg, #1a0830 0%, #2d1458 50%, #0d1a0d 100%)",
                }}
              >
                {/* Faint logo in social card */}
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-10">
                  <Image
                    src="/sander-logo.png"
                    alt=""
                    width={180}
                    height={180}
                    className="object-contain"
                  />
                </div>
                <div className="relative z-10 flex w-full items-center gap-3 p-4">
                  <div
                    className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl"
                    style={{
                      background:
                        "radial-gradient(circle at 30% 107%, #fdf497 0%, #fd5949 35%, #d6249f 60%, #285AEB 90%)",
                    }}
                  >
                    <Instagram className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-base font-bold text-white">
                    Entra nella community su Instagram
                  </span>
                </div>
              </a>
            </div>
          </>
        ) : (
          /* ── Not logged in ──────────────────────────────────── */
          <div className="flex flex-col items-center gap-6 px-2 py-16">
            <div className="text-center">
              <h1 className="mb-2 text-5xl font-black tracking-tight text-white">
                SANDER
              </h1>
              <p className="text-base text-[var(--muted-text)]">
                Beach Volleyball Tournament Manager
              </p>
            </div>
            <Link
              href="/auth/signin"
              className="flex min-h-[4rem] w-full max-w-sm items-center justify-center rounded-2xl bg-[var(--accent)] text-xl font-black text-black"
            >
              Accedi
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
