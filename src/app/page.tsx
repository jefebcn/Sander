export const dynamic = "force-dynamic"

import Link from "next/link"
import { redirect } from "next/navigation"
import { TrendingUp, Waves, Activity, Medal, Trophy } from "lucide-react"
import { getCurrentPlayer, getCurrentSession } from "@/lib/getCurrentPlayer"
import { db } from "@/lib/db"
import { getDivision, getNextDivision, pointsToNext, divisionProgress } from "@/lib/divisions"
import { getPersonalizedRecommendations } from "@/actions/recommendations"
import { getCityLeaderboards, type CityLeaderboard } from "@/actions/territories"
import { getUnreadCount } from "@/actions/notifications"
import { getUnreadMessageCount } from "@/actions/messages"
import { getFreshRecap, getMyCityRank, getUnscoredMatch, getWeeklyStreak } from "@/lib/home"
import { TZ } from "@/lib/datetime"
import { parseCity } from "@/lib/cities"
import { playerToCardData } from "@/components/player/SanderCardFut"
import { NotificationBell } from "@/components/push/NotificationBell"
import { MessagesBell } from "@/components/chat/MessagesBell"
import { ClientOnlyHomeWidgets } from "@/components/home/ClientOnlyHomeWidgets"
import { CrestHeading, CrestWordmark } from "@/components/home/Crest"
import { PlayerCrest } from "@/components/home/PlayerCrest"
import { UnscoredMatch, AfterMatchRecap } from "@/components/home/AfterMatch"
import { NextMatchCard, type NextMatch } from "@/components/home/NextMatchCard"
import { OpenMatchesRail } from "@/components/home/OpenMatchesRail"
import { QuickStart } from "@/components/home/QuickStart"
import { YourRace } from "@/components/home/YourRace"
import { WhySander } from "@/components/home/WhySander"
import { FirstSteps } from "@/components/home/FirstSteps"
import { TournamentSpotlight, type SpotlightTournament } from "@/components/home/TournamentSpotlight"
import { InviteCard } from "@/components/home/InviteCard"
import { CommunityStrip } from "@/components/home/CommunityStrip"
import { GuestLanding } from "@/components/home/GuestLanding"
import { ListRow } from "@/components/ui/ListRow"
import { QuickActionsButton } from "@/components/layout/QuickActionsButton"
import { ScopriHomeCard } from "@/components/home/ScopriHomeCard"
import { scopriSummary } from "@/lib/scopri/server"

const NO_STREAK = { weeks: 0, playedThisWeek: false }

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
        <GuestLanding stats={{ players, matches }} tournament={tournament} />
      </HomeShell>
    )
  }

  /* ── Player ──────────────────────────────────────────────────────────── */
  const now = new Date()
  // One scan of the town boards, shared by the rank row and the match recap.
  const boards = getCityLeaderboards().catch(() => [] as CityLeaderboard[])
  const scopriP = scopriSummary(player.id, player.homeCity, now).catch(() => null)
  const [
    fullPlayer, recs, nextMatchRow, tournament, unreadCount, unreadMessages, invited, cityRank,
    recentTournament, unscored, recap, streak,
  ] = await Promise.all([
      db.player.findUnique({
        where: { id: player.id },
        include: { _count: { select: { organizedSessions: true } } },
      }),
      getPersonalizedRecommendations(player.id),
      db.session.findFirst({
        where: {
          // Your own match counts even if you organized it without a seat.
          OR: [{ participants: { some: { playerId: player.id } } }, { organizerId: player.id }],
          status: { in: ["OPEN", "FULL"] },
          // A match that started an hour ago is still "the next one" to open;
          // after that it becomes "Com'è andata?" (getUnscoredMatch).
          date: { gte: new Date(now.getTime() - 3600_000) },
        },
        orderBy: { date: "asc" },
        select: {
          id: true, title: true, location: true, date: true, maxPlayers: true,
          _count: { select: { participants: true } },
          participants: { select: { playerId: true, guestName: true, player: { select: { name: true, avatarUrl: true } } } },
        },
      }),
      getSpotlightTournament(),
      getUnreadCount(),
      getUnreadMessageCount(),
      // Counted once the friend has played a first match (and the reward is paid).
      db.user.count({ where: { invitedByPlayerId: player.id, inviteRewardedAt: { not: null } } }),
      getMyCityRank(player.id, player.homeCity, boards),
      db.tournament.findFirst({
        where: { status: "COMPLETED" },
        orderBy: { updatedAt: "desc" },
        select: {
          id: true,
          name: true,
          standings: { orderBy: { rank: "asc" }, take: 1, select: { player: { select: { name: true } } } },
        },
      }),
      // Extras: a failure here costs a card, never the whole home. Closing a
      // match counts it for everyone in it, so with no games played there is
      // no recap or streak to look up.
      getUnscoredMatch(player.id, now).catch(() => null),
      player.sessionsPlayed > 0 ? getFreshRecap(player, boards, now).catch(() => null) : null,
      player.sessionsPlayed > 0
        ? getWeeklyStreak(player.id, now).catch(() => NO_STREAK)
        : NO_STREAK,
    ])

  if (!fullPlayer) redirect("/onboarding/profile")

  const firstName = fullPlayer.firstName ?? fullPlayer.name.split(" ")[0]
  const lastName = fullPlayer.lastName ?? fullPlayer.name.split(" ").slice(1).join(" ")
  const initials = `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase()
  const xpCurrent = fullPlayer.xp % 100
  const totalMatches = fullPlayer.matchesWon + fullPlayer.matchesLost
  const winPct = totalMatches > 0 ? Math.round((fullPlayer.matchesWon / totalMatches) * 100) : 0
  const glicko = fullPlayer.glickoRating ?? 1500
  const division = getDivision(glicko)

  const nextMatch: NextMatch | null = nextMatchRow
    ? {
        id: nextMatchRow.id, title: nextMatchRow.title, location: nextMatchRow.location, date: nextMatchRow.date,
        players: nextMatchRow._count.participants, maxPlayers: nextMatchRow.maxPlayers,
        faces: nextMatchRow.participants.slice(0, 8).map((p) => ({ name: p.player?.name ?? p.guestName ?? "?", avatarUrl: p.player?.avatarUrl })),
      }
    : null
  // A player with no games yet gets "first steps" instead of a wall of zeros.
  const isNew = fullPlayer.sessionsPlayed === 0 && totalMatches === 0
  const homeCity = fullPlayer.homeCity
  const inHomeCity = (s: { city: string | null; location: string }) =>
    !!homeCity && (s.city ?? parseCity(s.location)) === homeCity
  const firstSteps = [
    { id: "city", title: "Scegli il tuo comune", text: "Partite e classifica di casa tua", href: "/onboarding/profile", done: !!homeCity },
    {
      id: "play", title: "Unisciti alla prima partita", href: "/sessions",
      text: recs.suggestedSessions.length > 0 ? "Basta un tocco su Entra, qui sotto" : "Trova una partita con un posto libero",
      done: fullPlayer.sessionsPlayed > 0 || !!unscored || !!nextMatchRow?.participants.some((p) => p.playerId === player.id),
    },
    { id: "photo", title: "Metti la foto sulla carta", text: "Così ti riconoscono in spiaggia", href: "/onboarding/profile", done: !!fullPlayer.avatarUrl },
    { id: "invite", title: "Porta un amico", text: "+30 crediti quando gioca la prima partita", href: "/profile?tab=invita", done: invited > 0 },
  ]
  const showFirstSteps = fullPlayer.sessionsPlayed < 3 && firstSteps.some((s) => !s.done)

  const suggested = recs.suggestedSessions
    // Your own match (organized without a seat) is already on the card above.
    .filter((s) => s.id !== nextMatchRow?.id)
    // Your comune first; the ranking from recommendations is kept otherwise.
    .sort((a, b) => Number(inHomeCity(b)) - Number(inHomeCity(a)))
  const openMatches = suggested.map((s) => ({
    id: s.id, title: s.title, location: s.location, date: s.date, spotsLeft: s.spotsLeft, familiar: s.familiarity === "known",
    maxPlayers: s.maxPlayers, players: s.players, price: s.price, creditCost: s.creditCost,
  }))
  const local = suggested.filter(inHomeCity).length
  const railTitle =
    local === 0 ? "Partite aperte" : local === suggested.length ? `A ${homeCity}` : `A ${homeCity} e dintorni`

  // Sections rise in one after another, top to bottom.
  let section = 0
  const rise = () => ({ className: "rise-in", style: { "--i": section++ } as React.CSSProperties })

  const nothingNow = !unscored && !recap && !nextMatch
  // "Segna" goes where a score actually gets saved: the match waiting for its
  // result, or the live board of the one being played; else a practice board.
  const scopri = await scopriP
  const score =
    unscored && unscored.entry.kind !== "wait"
      ? { href: unscored.entry.href, sub: "Il risultato" }
      : nextMatchRow && nextMatchRow.date <= now
        ? { href: `/segna?session=${nextMatchRow.id}`, sub: "Dal vivo" }
        : { href: "/segna", sub: "Conta i punti" }

  return (
    <HomeShell>
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <header className="relative z-10 flex items-center gap-3">
        <CrestWordmark />
        <div className="ml-auto flex items-center gap-2">
          <MessagesBell unreadCount={unreadMessages} />
          <NotificationBell unreadCount={unreadCount} />
          <QuickActionsButton />
        </div>
      </header>

      {/* ── You ────────────────────────────────────────────────────────── */}
      <div {...rise()}>
        <PlayerCrest
          p={{
            greeting: greeting(now),
            firstName,
            initials,
            avatarUrl: fullPlayer.avatarUrl,
            title: getMilestoneTitle(fullPlayer.level),
            level: fullPlayer.level,
            xpPct: xpCurrent,
            matchesToLevel: Math.max(1, Math.ceil((100 - xpCurrent) / 10)),
            isNew,
            sessions: fullPlayer.sessionsPlayed,
            winPct,
            rating: Math.round(glicko),
            division: { name: division.name, color: division.color, next: getNextDivision(glicko)?.name ?? null, pointsToNext: pointsToNext(glicko) },
            insight: isNew ? null : recs.performanceInsight?.label ?? null,
          }}
        />
      </div>

      {/* ── Now: right after a match, then the next one ────────────────── */}
      {unscored && (
        <div {...rise()}>
          <UnscoredMatch match={unscored} />
        </div>
      )}
      {recap && (
        <div {...rise()}>
          <AfterMatchRecap recap={recap} cardData={playerToCardData(fullPlayer)} primary={!unscored} />
        </div>
      )}
      {nextMatch && (
        <div {...rise()}>
          <NextMatchCard match={nextMatch} />
        </div>
      )}
      {scopri && !scopri.minor && (
        <div {...rise()}>
          <ScopriHomeCard {...scopri} city={player.homeCity} />
        </div>
      )}

      {isNew ? (
        <>
          {showFirstSteps && (
            <div {...rise()}>
              <FirstSteps steps={firstSteps} />
            </div>
          )}
          {openMatches.length > 0 && (
            <div {...rise()}>
              <OpenMatchesRail
                matches={openMatches}
                title={railTitle}
                eyebrow={nextMatch ? "Posti liberi" : "La tua prima partita"}
              />
            </div>
          )}
          <div {...rise()}>
            <WhySander variant="player" hasOpenMatches={openMatches.length > 0} />
          </div>
          <div {...rise()}>
            <QuickStart score={score} />
          </div>
        </>
      ) : (
        <>
          {/* Nothing booked: the quick actions come first, as "ready to play?". */}
          {nothingNow && (
            <div {...rise()}>
              <QuickStart score={score} eyebrow="Nessuna partita in programma" title="Pronto a giocare?" />
            </div>
          )}
          {openMatches.length > 0 && (
            <div {...rise()}>
              <OpenMatchesRail matches={openMatches} title={railTitle} />
            </div>
          )}
          {showFirstSteps && (
            <div {...rise()}>
              <FirstSteps steps={firstSteps} />
            </div>
          )}
          {!nothingNow && (
            <div {...rise()}>
              <QuickStart score={score} />
            </div>
          )}
        </>
      )}

      {/* ── Why come back ──────────────────────────────────────────────── */}
      <div {...rise()}>
        <YourRace
          city={cityRank}
          division={{
            name: division.name,
            next: getNextDivision(glicko)?.name ?? null,
            pointsToNext: pointsToNext(glicko),
            progress: divisionProgress(glicko),
          }}
          streak={streak}
        />
      </div>

      {tournament && (
        <div {...rise()}>
          <TournamentSpotlight t={tournament} />
        </div>
      )}

      {/* ── Bring friends (unless "Porta un amico" is still a first step) ─ */}
      {!(showFirstSteps && invited === 0) && (
        <div {...rise()}>
          <InviteCard invited={invited} />
        </div>
      )}

      {/* ── Discover ───────────────────────────────────────────────────── */}
      <section {...rise()} aria-labelledby="discover-title">
        <div className="tone-compete flex flex-col gap-3">
          <CrestHeading id="discover-title" eyebrow="Classifiche" title="Esplora" />
          <div className="grid grid-cols-2 gap-2">
            {[
              { href: "/settimana", icon: TrendingUp, label: "La settimana", sub: "Chi ha giocato di più" },
              { href: "/stagione", icon: Waves, label: "Stagione", sub: "Divisioni e promozioni" },
              { href: "/players?tab=podio", icon: Medal, label: "Podio del mese", sub: "I migliori di adesso" },
              { href: "/feed", icon: Activity, label: "Feed", sub: "Cosa succede ora" },
            ].map((d) => (
              <Link
                key={d.href}
                href={d.href}
                className="pressable flex min-h-[5.5rem] flex-col justify-between rounded-[var(--radius-lg)] bg-[var(--surface-2)] p-4 ring-1 ring-[var(--crest-hair)] active:bg-[var(--surface-3)]"
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
 * The home sits on the same Riviera night sky as every page (AppBackground
 * shows through) and adds the crest's white hairlines (.theme-crest).
 */
function HomeShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="theme-crest relative min-h-dvh overflow-x-hidden">
      <div
        className="relative z-10 flex flex-col gap-6 px-4 pb-8"
        style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 1rem)" }}
      >
        {children}
      </div>
    </div>
  )
}
