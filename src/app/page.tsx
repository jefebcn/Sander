export const dynamic = "force-dynamic"

import Link from "next/link"
import { redirect } from "next/navigation"
import { Plus, Search } from "lucide-react"
import { getCurrentPlayer, getCurrentSession } from "@/lib/getCurrentPlayer"
import { db } from "@/lib/db"
import { getCityLeaderboards } from "@/actions/territories"
import { getUnreadCount } from "@/actions/notifications"
import { getUnreadMessageCount } from "@/actions/messages"
import { TZ } from "@/lib/datetime"
import { romeWeekStart } from "@/lib/romeMonth"
import { JOIN_GRACE_MS } from "@/lib/sessionRules"
import { pickHomeMatches, weekResults } from "@/lib/homeMatches"
import { INVITER_SC } from "@/lib/referral"
import { parseCity } from "@/lib/cities"
import { seatLimit } from "@/lib/tournament/capacity"
import { playerToCardData } from "@/components/player/SanderCardFut"
import { NotificationBell } from "@/components/push/NotificationBell"
import { MessagesBell } from "@/components/chat/MessagesBell"
import { ClientOnlyHomeWidgets } from "@/components/home/ClientOnlyHomeWidgets"
import { NextMatchCard, type NextMatch } from "@/components/home/NextMatchCard"
import { MissingPlayerCard } from "@/components/home/MissingPlayerCard"
import { OpenMatchList } from "@/components/home/OpenMatchList"
import { WeekStats } from "@/components/home/WeekStats"
import { FirstMatchHero } from "@/components/home/FirstMatchHero"
import { FirstSteps, type FirstStep } from "@/components/home/FirstSteps"
import { TournamentSpotlight, type SpotlightTournament } from "@/components/home/TournamentSpotlight"
import { InviteCard } from "@/components/home/InviteCard"
import { GuestLanding } from "@/components/home/GuestLanding"

const START_LEVEL_LABEL: Record<string, string> = {
  PRINCIPIANTE: "Principiante",
  INTERMEDIO: "Intermedio",
  ESPERTO: "Esperto",
}

/** "Giovedì 16 ottobre", Riviera calendar. */
function longDate(d: Date): string {
  const s = new Intl.DateTimeFormat("it-IT", { timeZone: TZ, weekday: "long", day: "numeric", month: "long" }).format(d)
  return s.charAt(0).toUpperCase() + s.slice(1)
}

/** The tournament worth putting on the poster: the next one, open ones first. */
async function getSpotlightTournament(): Promise<SpotlightTournament | null> {
  const t = await db.tournament.findFirst({
    where: { status: { in: ["DRAFT", "LIVE"] }, date: { gte: new Date(Date.now() - 6 * 3600_000) } },
    orderBy: [{ isOpenForRegistration: "desc" }, { date: "asc" }],
    select: {
      id: true, name: true, date: true, location: true, priceCents: true, prizePool: true,
      maxTeams: true, isOpenForRegistration: true, type: true,
      _count: { select: { registrations: { where: { isSpectator: false, paymentStatus: { in: ["FREE", "PAID", "PENDING"] } } } } },
    },
  })
  if (!t) return null
  return {
    id: t.id, name: t.name, date: t.date, location: t.location, priceCents: t.priceCents,
    prizePool: t.prizePool, maxTeams: seatLimit(t.type, t.maxTeams), open: t.isOpenForRegistration,
    registered: t._count.registrations,
  }
}

/** Where the player stands in the comune they play in most, if anywhere yet. */
async function getMyCityRank(playerId: string): Promise<{ rank: number; city: string } | null> {
  try {
    const boards = await getCityLeaderboards()
    let best: { rank: number; city: string } | null = null
    let bestMatches = 0
    for (const b of boards) {
      const i = b.standings.findIndex((p) => p.id === playerId)
      if (i === -1) continue
      const me = b.standings[i]
      if (me.matches <= bestMatches) continue
      bestMatches = me.matches
      best = { rank: i + 1, city: b.city }
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

  const now = new Date()

  /* ── Visitor ─────────────────────────────────────────────────────────── */
  if (!player) {
    const [todayOpen, tournament] = await Promise.all([
      db.session.count({
        where: { status: "OPEN", date: { gte: now, lte: new Date(now.getTime() + 24 * 3600_000) } },
      }),
      getSpotlightTournament(),
    ])
    return (
      <HomeShell>
        <GuestLanding todayOpen={todayOpen} tournament={tournament} />
      </HomeShell>
    )
  }

  /* ── Player ──────────────────────────────────────────────────────────── */
  const [fullPlayer, nextMatchRow, openRows, weekSeats, tournament, unreadCount, unreadMessages, invited, cityRank] =
    await Promise.all([
      db.player.findUnique({ where: { id: player.id } }),
      db.session.findFirst({
        where: {
          participants: { some: { playerId: player.id } },
          status: { in: ["OPEN", "FULL"] },
          // A match that started an hour ago is still "the next one" to open.
          date: { gte: new Date(now.getTime() - 3600_000) },
        },
        orderBy: { date: "asc" },
        select: {
          id: true, title: true, location: true, city: true, date: true, maxPlayers: true,
          _count: { select: { participants: true } },
          participants: { take: 8, select: { guestName: true, player: { select: { name: true, avatarUrl: true } } } },
        },
      }),
      // Matches this player could still join in the coming week.
      db.session.findMany({
        where: {
          status: "OPEN",
          date: { gte: new Date(now.getTime() - JOIN_GRACE_MS), lte: new Date(now.getTime() + 7 * 24 * 3600_000) },
          organizerId: { not: player.id },
          participants: { none: { playerId: player.id } },
        },
        orderBy: { date: "asc" },
        take: 40,
        select: {
          id: true, title: true, location: true, city: true, date: true, format: true, maxPlayers: true,
          paymentType: true, quotaAmount: true,
          _count: { select: { participants: true } },
        },
      }),
      db.sessionParticipant.findMany({
        where: { playerId: player.id, session: { status: "COMPLETED", date: { gte: romeWeekStart(now) } } },
        select: { team: true, session: { select: { sets: { select: { teamAScore: true, teamBScore: true } } } } },
      }),
      getSpotlightTournament(),
      getUnreadCount(),
      getUnreadMessageCount(),
      db.user.count({ where: { invitedByPlayerId: player.id, inviteRewardedAt: { not: null } } }),
      getMyCityRank(player.id),
    ])

  if (!fullPlayer) redirect("/onboarding/profile")

  const firstName = fullPlayer.firstName ?? fullPlayer.name.split(" ")[0]
  const lastName = fullPlayer.lastName ?? fullPlayer.name.split(" ").slice(1).join(" ")
  const initials = `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase()
  const totalMatches = fullPlayer.matchesWon + fullPlayer.matchesLost
  // A player with no games yet gets "your first match" instead of a wall of zeros.
  const isNew = fullPlayer.sessionsPlayed === 0 && totalMatches === 0
  const homeCity = fullPlayer.homeCity

  const nextMatch: NextMatch | null = nextMatchRow
    ? {
        id: nextMatchRow.id, title: nextMatchRow.title, location: nextMatchRow.location,
        city: nextMatchRow.city ?? parseCity(nextMatchRow.location), date: nextMatchRow.date,
        players: nextMatchRow._count.participants, maxPlayers: nextMatchRow.maxPlayers,
        faces: nextMatchRow.participants.map((p) => ({ name: p.player?.name ?? p.guestName ?? "?", avatarUrl: p.player?.avatarUrl })),
      }
    : null

  const picks = pickHomeMatches(
    openRows.map((r) => ({ ...r, players: r._count.participants })),
    homeCity,
    now,
  )
  const listTitle = picks.listCity ? `Aperte a ${picks.listCity}` : "Partite aperte"
  const week = weekResults(weekSeats.map((s) => ({ team: s.team, sets: s.session.sets })))

  const firstSteps: FirstStep[] = [
    { id: "profile", title: "Profilo pronto", href: "/onboarding/profile", done: !!homeCity },
    {
      id: "play", title: "Gioca la prima partita", href: "/sessions", reward: "+XP",
      done: !!nextMatchRow || fullPlayer.sessionsPlayed > 0,
    },
    {
      id: "invite", title: "Invita un amico", href: "/profile?tab=invita",
      reward: `+${INVITER_SC} crediti`, rewardTone: "social", done: invited > 0,
    },
  ]
  const showFirstSteps = fullPlayer.sessionsPlayed < 3 && firstSteps.some((s) => !s.done)

  const subtitle = isNew
    ? [homeCity, fullPlayer.startLevel ? START_LEVEL_LABEL[fullPlayer.startLevel] : null].filter(Boolean).join(" · ") ||
      "Benvenuto su SANDER"
    : longDate(now)

  // Sections rise in one after another, top to bottom.
  let section = 0
  const rise = () => ({ className: "rise-in", style: { "--i": section++ } as React.CSSProperties })

  return (
    <HomeShell>
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <header className="flex min-h-[3.5rem] items-center gap-2">
        <div className="min-w-0 flex-1">
          <p className="truncate text-base text-[var(--muted-text)]">{subtitle}</p>
          <h1 className="truncate font-display text-[2rem] font-extrabold uppercase leading-[1.05] text-white">
            Ciao {firstName}
          </h1>
        </div>
        <MessagesBell unreadCount={unreadMessages} />
        <NotificationBell unreadCount={unreadCount} />
        <Link
          href="/profile"
          aria-label="Il tuo profilo"
          className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--surface-4)] text-base font-extrabold text-white ring-2 ring-[var(--social)]"
        >
          {fullPlayer.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={fullPlayer.avatarUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            initials
          )}
        </Link>
      </header>

      {/* ── Your next match, or the first one to find ─────────────────── */}
      {nextMatch ? (
        <div {...rise()}>
          <NextMatchCard match={nextMatch} />
        </div>
      ) : isNew ? (
        <div {...rise()}>
          <FirstMatchHero todayCount={picks.todayCount} weekCount={picks.weekCount} city={picks.listCity} />
        </div>
      ) : (
        <section {...rise()}>
          <div className="tone-play flex flex-col gap-2.5 rounded-[var(--radius-lg)] bg-[var(--surface-2)] p-5">
            <p className="eyebrow text-[var(--accent)]">Nessuna partita in programma</p>
            <h2 className="font-display text-3xl font-extrabold uppercase leading-none text-white">Pronto a giocare?</h2>
            <div className="mt-1.5 grid grid-cols-2 gap-2">
              <Link
                href="/sessions"
                className="pressable flex min-h-[3.5rem] items-center justify-center gap-2 rounded-[var(--radius-md)] bg-[var(--accent)] text-base font-extrabold text-black"
              >
                <Search className="h-5 w-5" aria-hidden="true" /> Trova
              </Link>
              <Link
                href="/sessions/new"
                className="pressable flex min-h-[3.5rem] items-center justify-center gap-2 rounded-[var(--radius-md)] bg-[var(--surface-4)] text-base font-extrabold text-white"
              >
                <Plus className="h-5 w-5 text-[var(--accent)]" aria-hidden="true" /> Crea
              </Link>
            </div>
          </div>
        </section>
      )}

      {picks.missing && (
        <div {...rise()}>
          <MissingPlayerCard match={picks.missing} />
        </div>
      )}

      {isNew && showFirstSteps && (
        <div {...rise()}>
          <FirstSteps steps={firstSteps} />
        </div>
      )}

      {!isNew && (
        <div {...rise()}>
          <WeekStats data={{ played: week.played, won: week.won, cityRank }} />
        </div>
      )}

      {picks.list.length > 0 && (
        <div {...rise()}>
          <OpenMatchList title={listTitle} matches={picks.list} />
        </div>
      )}

      {!isNew && showFirstSteps && (
        <div {...rise()}>
          <FirstSteps steps={firstSteps} />
        </div>
      )}

      {tournament && (
        <div {...rise()}>
          <TournamentSpotlight t={tournament} />
        </div>
      )}

      {/* New players already see "invite a friend" in their first steps. */}
      {!(isNew && showFirstSteps) && (
        <div {...rise()}>
          <InviteCard />
        </div>
      )}

      <ClientOnlyHomeWidgets
        currentLevel={fullPlayer.level}
        playerName={fullPlayer.name}
        cardData={playerToCardData(fullPlayer)}
      />
    </HomeShell>
  )
}

function HomeShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-dvh overflow-x-hidden">
      <div
        className="relative flex flex-col gap-5 px-4 pb-8"
        style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 1rem)" }}
      >
        {children}
      </div>
    </div>
  )
}
