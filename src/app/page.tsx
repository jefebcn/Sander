export const dynamic = "force-dynamic"

import Image from "next/image"
import Link from "next/link"
import { redirect } from "next/navigation"
import { Plus, Search, TrendingUp, Waves, Activity, Medal, ChevronRight, Trophy } from "lucide-react"
import { getCurrentPlayer, getCurrentSession } from "@/lib/getCurrentPlayer"
import { db } from "@/lib/db"
import { ratingToDisplayLevel } from "@/lib/tournament/glicko2"
import { getPersonalizedRecommendations } from "@/actions/recommendations"
import { getCityLeaderboards } from "@/actions/territories"
import { getUnreadCount } from "@/actions/notifications"
import { getUnreadMessageCount } from "@/actions/messages"
import { TZ } from "@/lib/datetime"
import { playerToCardData } from "@/components/player/SanderCardFut"
import { NotificationBell } from "@/components/push/NotificationBell"
import { MessagesBell } from "@/components/chat/MessagesBell"
import { StatsInfoSheet } from "@/components/home/StatsInfoSheet"
import { ClientOnlyHomeWidgets } from "@/components/home/ClientOnlyHomeWidgets"
import { LevelRing } from "@/components/home/LevelRing"
import { NextMatchCard, type NextMatch } from "@/components/home/NextMatchCard"
import { OpenMatchesRail } from "@/components/home/OpenMatchesRail"
import { CityRankCard, type CityRank } from "@/components/home/CityRankCard"
import { TournamentSpotlight, type SpotlightTournament } from "@/components/home/TournamentSpotlight"
import { InviteCard } from "@/components/home/InviteCard"
import { CommunityStrip } from "@/components/home/CommunityStrip"
import { GuestLanding } from "@/components/home/GuestLanding"
import { CountUp } from "@/components/ui/CountUp"
import { SectionHeader } from "@/components/ui/SectionHeader"
import { ListRow } from "@/components/ui/ListRow"

function getMilestoneTitle(level: number): string {
  if (level >= 50) return "Sand King"
  if (level >= 20) return "Ace"
  if (level >= 10) return "Spiker"
  if (level >= 5)  return "Setter"
  if (level >= 2)  return "Sand Digger"
  return "Drop-In"
}

/** "Buongiorno" / "Buon pomeriggio" / "Buonasera", by Riviera clock. */
function greeting(now = new Date()): string {
  const h = Number(new Intl.DateTimeFormat("en-GB", { timeZone: TZ, hour: "2-digit", hourCycle: "h23" }).format(now))
  if (h < 5) return "Buonanotte"
  if (h < 13) return "Buongiorno"
  if (h < 18) return "Buon pomeriggio"
  return "Buonasera"
}

/** The tournament worth putting on the poster: the next one, open ones first. */
async function getSpotlightTournament(): Promise<SpotlightTournament | null> {
  const t = await db.tournament.findFirst({
    where: { status: { in: ["DRAFT", "LIVE"] }, date: { gte: new Date(Date.now() - 6 * 3600_000) } },
    orderBy: [{ isOpenForRegistration: "desc" }, { date: "asc" }],
    select: {
      id: true, name: true, date: true, location: true, priceCents: true, prizePool: true,
      maxTeams: true, isOpenForRegistration: true,
      _count: { select: { registrations: { where: { isSpectator: false, paymentStatus: { in: ["FREE", "PAID", "PENDING"] } } } } },
    },
  })
  if (!t) return null
  return {
    id: t.id, name: t.name, date: t.date, location: t.location, priceCents: t.priceCents,
    prizePool: t.prizePool, maxTeams: t.maxTeams, open: t.isOpenForRegistration,
    registered: t._count.registrations,
  }
}

/** Where the player stands in the comune they play in most. */
async function getMyCityRank(playerId: string): Promise<CityRank | null> {
  try {
    const boards = await getCityLeaderboards()
    let best: CityRank | null = null
    let bestMatches = 0
    for (const b of boards) {
      const i = b.standings.findIndex((p) => p.id === playerId)
      if (i === -1) continue
      const me = b.standings[i]
      if (me.matches <= bestMatches) continue
      bestMatches = me.matches
      const third = b.standings[2]
      best = {
        city: b.city,
        rank: i + 1,
        total: b.standings.length,
        wins: me.wins,
        winsToPodium: i < 3 || !third ? 0 : Math.max(1, third.wins - me.wins + 1),
        king: b.king && b.king.id !== playerId ? b.king.name : null,
      }
    }
    return best
  } catch {
    return null
  }
}

export default async function Home() {
  const session = await getCurrentSession()
  const player = await getCurrentPlayer()

  // Logged in but no player profile yet → complete profile setup
  if (session?.user && !player) {
    redirect("/onboarding/profile")
  }

  /* ── Visitor ─────────────────────────────────────────────────────────── */
  if (!player) {
    const [players, matches, tournament] = await Promise.all([
      db.player.count(),
      db.session.count({ where: { status: "COMPLETED" } }),
      getSpotlightTournament(),
    ])
    return (
      <HomeShell>
        <GuestHeader />
        <GuestLanding stats={{ players, matches }} tournament={tournament} />
      </HomeShell>
    )
  }

  /* ── Player ──────────────────────────────────────────────────────────── */
  const now = new Date()
  const [fullPlayer, recs, nextMatchRow, tournament, unreadCount, unreadMessages, invited, cityRank, recentTournament] =
    await Promise.all([
      db.player.findUnique({
        where: { id: player.id },
        include: { _count: { select: { organizedSessions: true } } },
      }),
      getPersonalizedRecommendations(player.id),
      db.session.findFirst({
        where: {
          participants: { some: { playerId: player.id } },
          status: { in: ["OPEN", "FULL"] },
          // A match that started an hour ago is still "the next one" to open.
          date: { gte: new Date(now.getTime() - 3600_000) },
        },
        orderBy: { date: "asc" },
        select: {
          id: true, title: true, location: true, date: true, maxPlayers: true,
          _count: { select: { participants: true } },
          participants: { take: 8, select: { guestName: true, player: { select: { name: true, avatarUrl: true } } } },
        },
      }),
      getSpotlightTournament(),
      getUnreadCount(),
      getUnreadMessageCount(),
      db.user.count({ where: { invitedByPlayerId: player.id } }),
      getMyCityRank(player.id),
      db.tournament.findFirst({
        where: { status: "COMPLETED" },
        orderBy: { updatedAt: "desc" },
        select: {
          id: true,
          name: true,
          standings: { orderBy: { rank: "asc" }, take: 1, select: { player: { select: { name: true } } } },
        },
      }),
    ])

  if (!fullPlayer) redirect("/onboarding/profile")

  const firstName = fullPlayer.firstName ?? fullPlayer.name.split(" ")[0]
  const lastName = fullPlayer.lastName ?? fullPlayer.name.split(" ").slice(1).join(" ")
  const initials = `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase()
  const xpCurrent = fullPlayer.xp % 100
  const xpToNext = 100 - xpCurrent
  const totalMatches = fullPlayer.matchesWon + fullPlayer.matchesLost
  const winPct = totalMatches > 0 ? Math.round((fullPlayer.matchesWon / totalMatches) * 100) : 0
  const rating = ratingToDisplayLevel(fullPlayer.glickoRating ?? 1500)

  const nextMatch: NextMatch | null = nextMatchRow
    ? {
        id: nextMatchRow.id, title: nextMatchRow.title, location: nextMatchRow.location, date: nextMatchRow.date,
        players: nextMatchRow._count.participants, maxPlayers: nextMatchRow.maxPlayers,
        faces: nextMatchRow.participants.map((p) => ({ name: p.player?.name ?? p.guestName ?? "?", avatarUrl: p.player?.avatarUrl })),
      }
    : null
  const openMatches = recs.suggestedSessions.map((s) => ({
    id: s.id, title: s.title, location: s.location, date: s.date, spotsLeft: s.spotsLeft, familiar: s.familiarity === "known",
    maxPlayers: s.maxPlayers, players: s.players,
  }))

  // Sections rise in one after another, top to bottom.
  let section = 0
  const rise = () => ({ className: "rise-in", style: { "--i": section++ } as React.CSSProperties })

  return (
    <HomeShell>
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <header className="flex items-center gap-3">
        <Image src="/sander-logo.png" alt="SANDER" width={40} height={40} className="object-contain" priority />
        <span className="font-display text-xl font-extrabold uppercase tracking-wide text-white">Sander</span>
        <div className="ml-auto flex items-center gap-2">
          <MessagesBell unreadCount={unreadMessages} />
          <NotificationBell unreadCount={unreadCount} />
        </div>
      </header>

      {/* ── You ────────────────────────────────────────────────────────── */}
      <section {...rise()}>
        <div className={`relative overflow-hidden rounded-[var(--radius-lg)] p-5 ${HOME_HERO_PHOTO ? "glass" : "bg-[var(--surface-2)] shadow-[var(--shadow-card)]"}`}>
          <div
            aria-hidden="true"
            className="sun-drift pointer-events-none absolute -right-24 -top-28 h-72 w-72 rounded-full"
            style={{ background: "radial-gradient(circle, color-mix(in srgb, var(--accent) 22%, transparent) 0%, transparent 62%)" }}
          />
          <Link href="/profile" className="relative flex items-center gap-4">
            <LevelRing level={fullPlayer.level} pct={xpCurrent} avatarUrl={fullPlayer.avatarUrl} initials={initials} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-[var(--muted-text)]">{greeting(now)},</p>
              <p className="truncate font-display text-[2.1rem] font-extrabold uppercase leading-[0.95] text-white">{firstName}</p>
              <span className="mt-1.5 inline-block rounded-full bg-[var(--accent-soft)] px-2.5 py-0.5 text-xs font-extrabold uppercase tracking-wider text-[var(--accent)]">
                {getMilestoneTitle(fullPlayer.level)}
              </span>
            </div>
          </Link>

          <div className="relative mt-5 grid grid-cols-3 divide-x divide-[var(--border)] rounded-[var(--radius-md)] bg-black/25 py-3">
            <div className="text-center">
              <CountUp value={fullPlayer.sessionsPlayed} className="num block text-3xl leading-none text-white" />
              <p className="mt-1 text-xs font-bold uppercase tracking-wider text-[var(--muted-text)]">Partite</p>
            </div>
            <div className="text-center">
              <p className="num text-3xl leading-none text-white">
                <CountUp value={winPct} />%
              </p>
              <p className="mt-1 text-xs font-bold uppercase tracking-wider text-[var(--muted-text)]">Vinte</p>
            </div>
            <div className="text-center">
              <p className="num text-3xl leading-none text-[var(--accent)]">{rating}</p>
              <p className="mt-1 text-xs font-bold uppercase tracking-wider text-[var(--muted-text)]">Rating</p>
            </div>
          </div>

          <div className="relative mt-4 flex items-center gap-3">
            <Link href="/level-info" className="flex min-h-[2.75rem] flex-1 items-center gap-3">
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-[var(--surface-4)]" aria-hidden="true">
                <div className="xp-bar-fill h-full rounded-full bg-[var(--accent)]" style={{ width: `${Math.max(3, xpCurrent)}%` }} />
              </div>
              <span className="shrink-0 text-sm font-bold text-white">
                {xpToNext} punti al <span className="text-[var(--accent)]">liv {fullPlayer.level + 1}</span>
              </span>
            </Link>
            <StatsInfoSheet />
          </div>
          {recs.performanceInsight && (
            <p className="relative mt-3 rounded-[var(--radius-sm)] bg-[var(--accent-soft)] px-3 py-2 text-sm font-semibold text-[var(--accent)]">
              {recs.performanceInsight.label}
            </p>
          )}
        </div>
      </section>

      {/* ── Play ───────────────────────────────────────────────────────── */}
      <div {...rise()}>
        {nextMatch ? (
          <NextMatchCard match={nextMatch} />
        ) : (
          <div className="tone-play rounded-[var(--radius-lg)] bg-[var(--surface-2)] p-5">
            <p className="eyebrow text-[var(--accent)]">Nessuna partita in programma</p>
            <p className="mt-1 font-display text-3xl font-extrabold uppercase leading-none text-white">Pronto a giocare?</p>
            <div className="mt-4 flex gap-2">
              <Link
                href="/sessions/new"
                className="pressable flex min-h-[3.5rem] flex-[1.3] items-center justify-center gap-2 rounded-[var(--radius-md)] bg-[var(--accent)] text-base font-extrabold text-black shadow-[var(--shadow-glow)]"
              >
                <Plus className="h-5 w-5" aria-hidden="true" /> Crea partita
              </Link>
              <Link
                href="/sessions"
                className="pressable flex min-h-[3.5rem] flex-1 items-center justify-center gap-2 rounded-[var(--radius-md)] bg-[var(--surface-3)] text-base font-extrabold text-white"
              >
                <Search className="h-5 w-5 text-[var(--accent)]" aria-hidden="true" /> Trova
              </Link>
            </div>
          </div>
        )}
      </div>

      {openMatches.length > 0 && (
        <div {...rise()}>
          <OpenMatchesRail matches={openMatches} />
        </div>
      )}

      {/* ── Compete ────────────────────────────────────────────────────── */}
      <div {...rise()}>
        <CityRankCard data={cityRank} />
      </div>

      {tournament && (
        <div {...rise()}>
          <TournamentSpotlight t={tournament} />
        </div>
      )}

      {/* ── Bring friends ──────────────────────────────────────────────── */}
      <div {...rise()}>
        <InviteCard invited={invited} />
      </div>

      {/* ── Discover ───────────────────────────────────────────────────── */}
      <section {...rise()}>
        <div className="flex flex-col gap-3">
          <SectionHeader eyebrow="Classifiche" title="Scopri" tone="compete" />
          <div className="grid grid-cols-2 gap-2">
            {[
              { href: "/settimana", icon: TrendingUp, label: "La settimana", sub: "Chi ha giocato di più", tone: "tone-compete" },
              { href: "/stagione", icon: Waves, label: "Stagione", sub: "Divisioni e promozioni", tone: "tone-compete" },
              { href: "/players?tab=podio", icon: Medal, label: "Podio del mese", sub: "I migliori di adesso", tone: "tone-compete" },
              { href: "/feed", icon: Activity, label: "Feed", sub: "Cosa succede ora", tone: "tone-social" },
            ].map((d) => (
              <Link
                key={d.href}
                href={d.href}
                className={`pressable ${d.tone} flex min-h-[5.5rem] flex-col justify-between rounded-[var(--radius-lg)] bg-[var(--surface-2)] p-4 active:bg-[var(--surface-3)]`}
              >
                <d.icon className="h-6 w-6 text-[var(--tone)]" aria-hidden="true" />
                <span>
                  <span className="block text-base font-extrabold leading-tight text-white">{d.label}</span>
                  <span className="block text-xs text-[var(--muted-text)]">{d.sub}</span>
                </span>
              </Link>
            ))}
          </div>
          {recentTournament && recentTournament.standings[0] && (
            <ListRow
              href={`/tournaments/${recentTournament.id}`}
              tone="compete"
              icon={Trophy}
              title={recentTournament.name}
              subtitle={`Vinto da ${recentTournament.standings[0].player.name}`}
            />
          )}
        </div>
      </section>

      <div {...rise()}>
        <CommunityStrip />
      </div>

      <ClientOnlyHomeWidgets
        currentLevel={fullPlayer.level}
        playerName={fullPlayer.name}
        cardData={playerToCardData(fullPlayer)}
      />
    </HomeShell>
  )
}

/**
 * Hero photo behind the top of the home: an empty court at sunset, the moment
 * people actually play. It fades into the page so cards stay readable.
 */
const HOME_HERO_PHOTO = true

function HomeShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-dvh overflow-x-hidden">
      {HOME_HERO_PHOTO && (
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-[30rem] overflow-hidden">
          <Image
            src="/shea-rouda-YCJoGdoQTgQ-unsplash.jpg"
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover object-[50%_62%] opacity-80"
          />
          {/* Darken the top for the header, fade the bottom into the page. */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(180deg, color-mix(in srgb, var(--background) 55%, transparent) 0%, color-mix(in srgb, var(--background) 15%, transparent) 35%, color-mix(in srgb, var(--background) 70%, transparent) 75%, var(--background) 100%)",
            }}
          />
        </div>
      )}
      <div
        className="relative z-10 flex flex-col gap-5 px-4 pb-8"
        style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 1.25rem)" }}
      >
        {children}
      </div>
    </div>
  )
}

function GuestHeader() {
  return (
    <header className="flex items-center gap-3">
      <Image src="/sander-logo.png" alt="SANDER" width={40} height={40} className="object-contain" priority />
      <span className="font-display text-xl font-extrabold uppercase tracking-wide text-white">Sander</span>
      <Link
        href="/auth/signin"
        className="ml-auto flex min-h-[2.75rem] items-center gap-1 rounded-full bg-[var(--surface-2)] px-4 text-sm font-bold text-white"
      >
        Accedi <ChevronRight className="h-4 w-4 text-[var(--accent)]" aria-hidden="true" />
      </Link>
    </header>
  )
}
