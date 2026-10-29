export const dynamic = "force-dynamic"

import type { Metadata } from "next"
import { redirect } from "next/navigation"
import Link from "next/link"
import { ArrowUpRight, MapPin, Calendar, Settings, ShieldCheck, Users, Trophy, Pencil, MessageCircle, ChartColumn, Bug, ChevronRight, HeartHandshake, CalendarCheck } from "lucide-react"
import { getCurrentPlayer, getCurrentSession } from "@/lib/getCurrentPlayer"
import { db } from "@/lib/db"
import { SanderCardFut, playerToCardData } from "@/components/player/SanderCardFut"
import { StatPercentageEditor } from "@/components/player/StatPercentageEditor"
import { ShareCardButton } from "@/components/player/ShareCardButton"
import { ShareStoryButton } from "@/components/share/ShareStoryButton"
import { WrappedShareButton } from "@/components/share/WrappedShareButton"
import { DuoShareButton } from "@/components/share/DuoShareButton"
import { getPlayerRecap } from "@/actions/recap"
import { SignOutButton } from "@/components/auth/SignOutButton"
import { InviteTab } from "@/components/profile/InviteTab"
import { PageHeader } from "@/components/layout/PageHeader"
import { NudgeToggle } from "@/components/profile/NudgeToggle"
import { buildPromoCode } from "@/lib/referral"
import { getReferralLeaderboard } from "@/actions/invite"
import { APP_VERSION_DISPLAY } from "@/lib/appVersion"
import { formatDate } from "@/lib/utils"
import { getStreak } from "@/lib/streak"
import { StatusBadge } from "@/components/tournament/StatusBadge"
import { AdminDeleteSessionButton } from "@/components/profile/AdminDeleteSessionButton"
import { AdminDeleteTournamentButton } from "@/components/profile/AdminDeleteTournamentButton"
import { AdminDeletePlayerButton } from "@/components/profile/AdminDeletePlayerButton"
import { AdminRecalcStatsButton } from "@/components/profile/AdminRecalcStatsButton"
import { AdminSection } from "@/components/profile/AdminSection"
import { AdminSearchList } from "@/components/profile/AdminSearchList"
import { NotifyPermission } from "@/components/push/NotifyPermission"

import { isAdminEmail } from "@/lib/isAdmin"
import { CONTACT_EMAIL } from "@/lib/contact"
import { getTournamentWins, getMatchHistory, getPartnerStats } from "@/actions/players"
import { MatchHistory } from "@/components/player/MatchHistory"
import { PartnerStats } from "@/components/player/PartnerStats"
import { Achievements } from "@/components/player/Achievements"
import { computeAchievements } from "@/lib/achievements"
import { WalletCard } from "@/components/session/WalletCard"
import { AdminCreditsManager } from "@/components/admin/AdminCreditsManager"
import { AdminSeasonManager } from "@/components/admin/AdminSeasonManager"
import { getActiveSeason } from "@/actions/seasons"
import { ContentQueue } from "@/components/admin/ContentQueue"
import { listContent } from "@/actions/content"
import { NOT_DELETED_PLAYER } from "@/lib/publicPlayer"
import { Gabbo } from "@/components/ui/Gabbo"
import { Suspense } from "react"
import { SumUpReturn } from "@/components/payments/SumUpReturn"

export const metadata: Metadata = {
  title: "Il tuo profilo | SANDER",
  description:
    "La tua carta giocatore, le statistiche e le partite.",
}

const MONTH_NAMES_IT = [
  "", "Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno",
  "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre",
]

const AWARD_META: Record<number, { emoji: string; label: string; color: string }> = {
  1: { emoji: "👑", label: "1° Posto", color: "#FFD700" },
  2: { emoji: "🥈", label: "2° Posto", color: "#A8A8A8" },
  3: { emoji: "🥉", label: "3° Posto", color: "#CD7F32" },
}

// ── Supporters ────────────────────────────────────────────────────────
// Add entries here to display a new supporter banner.
// banner: a wide photo for the left panel (the logo then sits next to the name).
// logo: shown whole (never cropped) on the left panel, over logoBg.
// Neither: the initials, once. Remove an entry when its site goes offline.
const SUPPORTERS: { name: string; banner?: string; logo?: string; logoBg?: string; href: string; tagline?: string; accentColor?: string }[] = [
  {
    name: "LilloFind",
    banner: "/sponsors/lillofind-banner.png",
    logo: "/sponsors/lillofind.png",
    href: "https://jefebcn.github.io/lillofind/",
    tagline: "Streetwear & Abbigliamento",
  },
  {
    name: "Fisioganzerli",
    logo: "/sponsors/fisioganzerli.png",
    logoBg: "#ffffff",
    href: "https://fisioterapiaganzerli.com/",
    tagline: "Fisioterapia & Riabilitazione",
  },
  {
    name: "Pepitos Eyewear",
    logo: "/sponsors/pepitos-logo.png",
    logoBg: "#eeeeee", // the logo file's own background
    href: "https://www.pepitoseyewear.com/",
    tagline: "Occhiali da sole",
  },
]

// ── helpers ──────────────────────────────────────────────────────────


// Same wording as SessionStatusBadge: "Completa" next to "Completata" read as
// two ways of saying finished, when one of them means "no seats left".
const STATUS_LABELS: Record<string, string> = {
  OPEN: "Aperta",
  FULL: "Posti esauriti",
  COMPLETED: "Conclusa",
  CANCELLED: "Annullata",
}

const STATUS_COLORS: Record<string, string> = {
  OPEN: "var(--live)",
  FULL: "var(--warning)",
  COMPLETED: "var(--muted-text)",
  CANCELLED: "var(--danger)",
}

// ── page ─────────────────────────────────────────────────────────────

interface Props { searchParams: Promise<{ tab?: string; topup?: string }> }

export default async function ProfilePage({ searchParams }: Props) {
  const { tab, topup } = await searchParams
  const validTabs = ["profilo", "partite", "organizzate", "invita", "app", "supporter", "admin"]
  const requestedTab = validTabs.includes(tab ?? "") ? (tab as string) : "profilo"

  const [player, session] = await Promise.all([getCurrentPlayer(), getCurrentSession()])
  if (!player) redirect("/auth/signin?callbackUrl=/profile")

  const isAdmin = isAdminEmail(session?.user?.email)
  // The admin tab doesn't exist for everyone else: show the profile instead of a blank page.
  const activeTab = requestedTab === "admin" && !isAdmin ? "profilo" : requestedTab

  // Always fetch core player data
  const [fullPlayer, streak, monthlyAwards, tournamentWins] = await Promise.all([
    db.player.findUniqueOrThrow({
      where: { id: player.id },
      include: {
        _count: { select: { organizedSessions: true } },
      },
    }),
    getStreak(player.id),
    db.monthlyAward.findMany({
      where: { playerId: player.id },
      orderBy: [{ year: "desc" }, { month: "desc" }],
    }),
    getTournamentWins(player.id),
  ])

  // Tab-specific data
  const playerSessions = activeTab === "partite"
    ? await db.sessionParticipant.findMany({
        where: { playerId: player.id },
        include: {
          session: { select: { id: true, title: true, date: true, location: true, status: true } },
        },
        orderBy: { session: { date: "desc" } },
      })
    : []

  const organizedSessions = activeTab === "organizzate"
    ? await db.session.findMany({
        where: { organizerId: player.id },
        select: { id: true, title: true, date: true, location: true, status: true },
        orderBy: { date: "desc" },
      })
    : []

  const [matchHistory, partnerStats, playerRecap] = activeTab === "profilo"
    ? await Promise.all([
        getMatchHistory(player.id),
        getPartnerStats(player.id),
        getPlayerRecap(player.id, 30),
      ])
    : [[], [], null]

  const achievements = activeTab === "profilo"
    ? computeAchievements({
        matchesWon: fullPlayer.matchesWon,
        matchesLost: fullPlayer.matchesLost,
        winRatePct: fullPlayer.winRatePct,
        sessionsPlayed: fullPlayer.sessionsPlayed,
        // Same source as the titles listed on the profile, so the two agree.
        tournamentsWon: tournamentWins.length,
        glickoRating: fullPlayer.glickoRating,
        level: fullPlayer.level,
        streak,
        monthlyAwardPositions: monthlyAwards.map((a) => a.position),
      })
    : []

  // No games of any kind yet: the stats panel would be sliders over nothing.
  const isNewPlayer =
    fullPlayer.matchesWon + fullPlayer.matchesLost === 0 &&
    fullPlayer.sessionsPlayed === 0 &&
    matchHistory.length === 0

  const promoCode = buildPromoCode(player.id)

  const [inviteCount, referralLeaderboard] = activeTab === "invita"
    ? await Promise.all([
        db.user.count({ where: { invitedByPlayerId: player.id, inviteRewardedAt: { not: null } } }),
        getReferralLeaderboard(),
      ])
    : [0, []]

  // Admin data (only fetched when admin views the admin tab)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let adminSessions: any[] = []
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let adminTournaments: any[] = []
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let adminPlayers: any[] = []
  let adminActiveSeason: Awaited<ReturnType<typeof getActiveSeason>> = null
  let adminContent: Awaited<ReturnType<typeof listContent>> = []
  let adminError: string | null = null

  if (isAdmin && activeTab === "admin") {
    try {
      ;[adminSessions, adminTournaments, adminPlayers, adminActiveSeason] = await Promise.all([
        db.session.findMany({
          orderBy: { date: "desc" },
          include: {
            organizer: { select: { name: true } },
            _count: { select: { participants: true } },
          },
        }),
        db.tournament.findMany({
          orderBy: { date: "desc" },
          include: { _count: { select: { registrations: true } } },
        }),
        db.player.findMany({
          where: NOT_DELETED_PLAYER,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            name: true,
            firstName: true,
            avatarUrl: true,
            level: true,
            createdAt: true,
            sanderCredits: true,
            user: { select: { email: true } },
          },
        }),
        getActiveSeason(),
      ])
      adminContent = await listContent()
    } catch (e) {
      adminError = e instanceof Error ? e.message : String(e)
    }
  }

  const TABS = [
    { id: "profilo",      label: "Profilo" },
    { id: "partite",      label: "Partite" },
    { id: "organizzate",  label: "Organizzate" },
    { id: "invita",       label: "Invita" },
    { id: "app",          label: "App" },
    { id: "supporter",    label: "Supporter" },
    ...(isAdmin ? [{ id: "admin", label: "Admin" }] : []),
  ]

  return (
    <div className="flex flex-col min-h-dvh pb-6">

      {/* ── Header ──────────────────────────────────────────── */}
      <PageHeader
        eyebrow={fullPlayer.firstName ?? fullPlayer.name.split(" ")[0]}
        tone="social"
        title="Profilo"
        action={
          <div className="flex items-center gap-2">
            <Link
              href="/onboarding/profile"
              aria-label="Modifica profilo"
              className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--surface-2)] text-white"
            >
              <Pencil className="h-5 w-5" aria-hidden="true" />
            </Link>
            <SignOutButton
              className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--surface-2)] text-white"
              iconOnly
            />
          </div>
        }
      />

      {/* Back from Stripe: say what happened, so nobody pays twice. */}
      <Suspense fallback={null}>
        <SumUpReturn />
      </Suspense>
      {topup === "ok" && (
        <p role="status" className="mx-4 mb-3 rounded-[var(--radius-md)] bg-[var(--accent-soft)] px-4 py-3 text-sm font-semibold text-[var(--accent)]">
          Pagamento ricevuto: i crediti compaiono nel saldo entro pochi secondi.
        </p>
      )}
      {topup === "annullata" && (
        <p role="status" className="mx-4 mb-3 rounded-[var(--radius-md)] bg-[var(--surface-2)] px-4 py-3 text-sm text-[var(--muted-text)]">
          Pagamento annullato: non ti è stato addebitato nulla.
        </p>
      )}

      {/* ── Tab bar (horizontal scroll) ───────────────────── */}
      <div className="tone-social relative pb-3">
        <div className="rail px-4">
          {TABS.map(({ id, label }) => (
            <Link
              key={id}
              href={id === "profilo" ? "/profile" : `/profile?tab=${id}`}
              aria-current={activeTab === id ? "page" : undefined}
              className={
                "flex min-h-[2.75rem] shrink-0 items-center whitespace-nowrap rounded-full px-4 text-sm font-bold transition-colors " +
                (activeTab === id ? "sel-on" : "sel-off")
              }
            >
              {label}
            </Link>
          ))}
        </div>
        {/* right-edge fade — hints the tab bar scrolls horizontally */}
        <div
          className="pointer-events-none absolute bottom-3 right-0 top-0 w-12"
          style={{ background: "linear-gradient(to right, transparent, var(--background))" }}
          aria-hidden="true"
        />
      </div>

      {/* ══ Profilo tab ═══════════════════════════════════════ */}
      {activeTab === "profilo" && (
        <div className="px-4 space-y-3">
          <SanderCardFut playerData={playerToCardData(fullPlayer)} cutout />
          <WalletCard
            credits={fullPlayer.sanderCredits}
            playerName={fullPlayer.firstName ?? fullPlayer.name.split(" ")[0]}
          />
          {/* Viral share: Story-format image for Instagram/WhatsApp (primary) */}
          <ShareStoryButton playerData={playerToCardData(fullPlayer)} variant="card" lazy />
          {/* Square card download — kept next to the story share, one sharing block */}
          <ShareCardButton playerData={playerToCardData(fullPlayer)} />

          {/* SANDER Wrapped — personal 30-day recap (only when there's activity) */}
          {playerRecap && playerRecap.matches > 0 && (
            <div className="rounded-2xl bg-[var(--surface-2)] p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-wider text-[var(--muted-text)]">
                  Il tuo mese
                </p>
                <span className="text-xs text-[var(--muted-text)]">ultimi 30 giorni</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-2xl font-black text-white">{playerRecap.matches}</p>
                  <p className="text-xs font-bold uppercase tracking-widest text-[var(--muted-text)]">Partite</p>
                </div>
                <div>
                  <p className="text-2xl font-black text-[var(--accent)]">{playerRecap.wins}</p>
                  <p className="text-xs font-bold uppercase tracking-widest text-[var(--muted-text)]">Vittorie</p>
                </div>
                <div>
                  <p className="text-2xl font-black text-white">
                    {playerRecap.ratingDelta >= 0 ? "+" : ""}{playerRecap.ratingDelta}
                  </p>
                  <p className="text-xs font-bold uppercase tracking-widest text-[var(--muted-text)]">Rating</p>
                </div>
              </div>
              <WrappedShareButton playerName={fullPlayer.name} recap={playerRecap} />
            </div>
          )}

          {/* The stat sliders and their formula mean nothing before a first game:
              show newcomers where to start instead. */}
          {isNewPlayer ? (
            <div className="tone-play space-y-3 rounded-2xl bg-[var(--surface-2)] p-5 text-center">
              <ChartColumn className="mx-auto h-8 w-8 text-[var(--tone)]" aria-hidden="true" />
              <p className="text-lg font-black text-white">
                Gioca la tua prima partita per sbloccare le statistiche
              </p>
              <p className="text-base text-[var(--muted-text)]">
                Dopo la prima partita potrai scegliere in cosa sei più forte e la tua carta si aggiornerà.
              </p>
              <Link
                href="/sessions"
                className="flex min-h-[3.5rem] w-full items-center justify-center rounded-full bg-[var(--accent)] text-base font-black text-black"
              >
                Trova una partita
              </Link>
            </div>
          ) : (
          <StatPercentageEditor
            glickoRating={fullPlayer.glickoRating}
            initial={{
              attPct: fullPlayer.attPct,
              difPct: fullPlayer.difPct,
              murPct: fullPlayer.murPct,
              alzPct: fullPlayer.alzPct,
              ricPct: fullPlayer.ricPct,
              staPct: fullPlayer.staPct,
            }}
          />
          )}
          {(tournamentWins.length > 0 || monthlyAwards.length > 0) && (
            <div className="rounded-2xl bg-[var(--surface-2)] p-5 flex flex-col gap-3">
              <p className="text-xs font-bold uppercase tracking-wider text-[var(--muted-text)]">
                Titoli
              </p>
              <div className="flex flex-wrap gap-2">
                {tournamentWins.map((win) => {
                  const d = new Date(win.date)
                  return (
                    <div
                      key={win.tournamentId}
                      className="flex items-center gap-2 rounded-xl px-3 py-2"
                      style={{ background: "var(--surface-3)", border: "1px solid #FFD70030" }}
                    >
                      <span className="text-xl leading-none">🏆</span>
                      <div className="flex flex-col">
                        <span className="text-xs font-black leading-tight" style={{ color: "#FFD700" }}>
                          {win.tournamentName}
                        </span>
                        <span className="text-xs text-white/60 leading-tight">
                          {MONTH_NAMES_IT[d.getMonth() + 1]} {d.getFullYear()}
                        </span>
                      </div>
                    </div>
                  )
                })}
                {monthlyAwards.map((award) => {
                  const meta = AWARD_META[award.position]
                  return (
                    <div
                      key={award.id}
                      className="flex items-center gap-2 rounded-xl px-3 py-2"
                      style={{ background: "var(--surface-3)", border: `1px solid ${meta.color}30` }}
                    >
                      <span className="text-xl leading-none">{meta.emoji}</span>
                      <div className="flex flex-col">
                        <span className="text-xs font-black leading-tight" style={{ color: meta.color }}>
                          {meta.label}
                        </span>
                        <span className="text-xs text-white/60 leading-tight">
                          {MONTH_NAMES_IT[award.month]} {award.year}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
          {/* ── Achievements ───────────────────────────────────── */}
          <Achievements achievements={achievements} />

          {/* ── Duo card — shareable pair chemistry (top partner) ─ */}
          {partnerStats.length > 0 && (
            <div className="rounded-2xl bg-[var(--surface-2)] p-4 space-y-3">
              <p className="text-xs font-bold uppercase tracking-wider text-[var(--muted-text)]">
                La tua coppia migliore
              </p>
              <div className="flex items-center justify-between">
                <p className="font-black text-white">
                  {fullPlayer.firstName ?? fullPlayer.name.split(" ")[0]} &amp;{" "}
                  {partnerStats[0].player.firstName ?? partnerStats[0].player.name.split(" ")[0]}
                </p>
                <p className="text-lg font-black text-[var(--accent)]">{partnerStats[0].winRate}%</p>
              </div>
              <p className="text-xs text-[var(--muted-text)]">
                {partnerStats[0].played} partite insieme · {partnerStats[0].won} vinte
              </p>
              <DuoShareButton
                playerA={fullPlayer.name}
                playerB={partnerStats[0].player.name}
                played={partnerStats[0].played}
                won={partnerStats[0].won}
                winRate={partnerStats[0].winRate}
              />
            </div>
          )}

          {/* ── Statistiche avanzate + cronologia (collassabile) ── */}
          <details className="group">
            <summary className="flex min-h-[3.25rem] cursor-pointer list-none items-center justify-between rounded-2xl bg-[var(--surface-2)] px-4 font-black text-white [&::-webkit-details-marker]:hidden">
              <span className="text-sm">Compagni e cronologia partite</span>
              <span className="text-lg text-[var(--accent)] transition-transform duration-200 group-open:rotate-90">
                ›
              </span>
            </summary>
            <div className="mt-2 space-y-3">
              <PartnerStats stats={partnerStats} />
              <MatchHistory entries={matchHistory} />
            </div>
          </details>

          <Link
            href="/stats-guide"
            className="flex min-h-[3.5rem] w-full items-center justify-center gap-2 rounded-2xl font-semibold text-[var(--accent)]"
            style={{ background: "rgba(198,247,54,0.07)", border: "1px solid rgba(198,247,54,0.2)" }}
          >
            <ArrowUpRight className="h-4 w-4" />
            Come funzionano i parametri?
          </Link>
          <Link
            href="/scopri/profilo"
            className="flex min-h-[3.5rem] w-full items-center justify-center gap-2 rounded-full bg-[var(--accent)] font-extrabold text-black"
          >
            <HeartHandshake className="h-4 w-4" />
            Il tuo profilo Scopri
          </Link>
          <Link
            href="/profile/presenze"
            className="flex min-h-[3.5rem] w-full items-center justify-center gap-2 rounded-2xl bg-[var(--surface-2)] font-semibold text-[var(--foreground)]"
          >
            <CalendarCheck className="h-4 w-4 text-[var(--social)]" />
            Le tue presenze
          </Link>
          {/* Messages were reachable only from the Home bell, so reading a reply
              meant going back Home from wherever you were. */}
          <Link
            href="/messaggi"
            className="flex min-h-[3.5rem] w-full items-center justify-center gap-2 rounded-2xl bg-[var(--surface-2)] font-semibold text-[var(--foreground)]"
          >
            <MessageCircle className="h-4 w-4 text-[var(--accent)]" />
            Messaggi
          </Link>
          <Link
            href="/onboarding/profile"
            className="flex min-h-[3.5rem] w-full items-center justify-center gap-2 rounded-2xl bg-[var(--surface-2)] font-semibold text-[var(--foreground)]"
          >
            <Settings className="h-4 w-4 text-[var(--muted-text)]" />
            Modifica profilo
          </Link>

          <NotifyPermission />
        </div>
      )}

      {/* ══ Partite tab ═══════════════════════════════════════ */}
      {activeTab === "partite" && (
        <div className="px-4 space-y-2">
          {playerSessions.length === 0 ? (
            <div className="flex flex-col items-center gap-3 pt-12 text-center">
              <Gabbo pose="attesa" size={120} />
              <p className="text-[var(--muted-text)]">Nessuna sessione ancora</p>
              <Link
                href="/sessions"
                className="flex min-h-[3.5rem] items-center rounded-xl bg-[var(--accent)] px-6 text-base font-black text-black"
              >
                Trova una partita
              </Link>
            </div>
          ) : (
            playerSessions.map((sp) => (
              <Link
                key={sp.id}
                href={`/sessions/${sp.session.id}`}
                className="flex items-center gap-3 rounded-2xl bg-[var(--surface-2)] p-4 active:opacity-80"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-white truncate">{sp.session.title}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-[var(--muted-text)]">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(sp.session.date)}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {sp.session.location}
                    </span>
                  </div>
                </div>
                <span
                  className="shrink-0 text-xs font-bold"
                  style={{ color: STATUS_COLORS[sp.session.status] ?? "var(--muted-text)" }}
                >
                  {STATUS_LABELS[sp.session.status] ?? sp.session.status}
                </span>
              </Link>
            ))
          )}
        </div>
      )}

      {/* ══ Organizzate tab ═══════════════════════════════════ */}
      {activeTab === "organizzate" && (
        <div className="px-4 space-y-2">
          {organizedSessions.length === 0 ? (
            <div className="flex flex-col items-center gap-3 pt-16 text-center">
              <p className="text-[var(--muted-text)]">Non hai ancora organizzato sessioni</p>
              <Link
                href="/sessions/new"
                className="flex min-h-[3.5rem] items-center rounded-xl bg-[var(--accent)] px-6 text-base font-black text-black"
              >
                Crea una partita
              </Link>
            </div>
          ) : (
            organizedSessions.map((s) => (
              <Link
                key={s.id}
                href={`/sessions/${s.id}`}
                className="flex items-center gap-3 rounded-2xl bg-[var(--surface-2)] p-4 active:opacity-80"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-white truncate">{s.title}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-[var(--muted-text)]">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(s.date)}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {s.location}
                    </span>
                  </div>
                </div>
                <span
                  className="shrink-0 text-xs font-bold"
                  style={{ color: STATUS_COLORS[s.status] ?? "var(--muted-text)" }}
                >
                  {STATUS_LABELS[s.status] ?? s.status}
                </span>
              </Link>
            ))
          )}
        </div>
      )}

      {/* ══ Invita tab ════════════════════════════════════════ */}
      {activeTab === "invita" && (
        <InviteTab promoCode={promoCode} playerName={fullPlayer.name} inviteCount={inviteCount} leaderboard={referralLeaderboard} />
      )}

      {/* ══ App tab ═══════════════════════════════════════════ */}
      {activeTab === "app" && (
        <div className="px-4 space-y-1 pt-2">
          <div className="pb-3">
            <NudgeToggle initialOptOut={fullPlayer.nudgesOptOut} />
          </div>
          {[
            { label: "Chiedi aiuto o segnala un problema", href: `mailto:${CONTACT_EMAIL}` },
            { label: "Termini del servizio", href: "/terms" },
            { label: "Privacy policy", href: "/privacy" },
            { label: "Valuta l'app", href: "https://www.instagram.com" },
            { label: "Elimina account", href: "/delete-account" },
          ].map(({ label, href }) => (
            <a
              key={label}
              href={href}
              target={href.startsWith("http") || href.startsWith("mailto") ? "_blank" : undefined}
              rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
              className="flex min-h-[3.5rem] items-center justify-between px-2 py-4 text-base font-semibold text-[var(--accent)] transition-opacity active:opacity-60"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
            >
              {label}
              <ArrowUpRight className="h-4 w-4 shrink-0" aria-hidden="true" />
            </a>
          ))}

          <p className="pt-4 text-xs text-[var(--muted-text)] px-2">
            Versione app {APP_VERSION_DISPLAY}
          </p>
        </div>
      )}

      {/* ══ Supporter tab ════════════════════════════════════ */}
      {activeTab === "supporter" && (
        <div className="px-4 space-y-4 pt-2">
          <div>
            <h2 className="text-lg font-black text-white">I nostri Supporter</h2>
            <p className="mt-1 text-sm text-[var(--muted-text)]">
              Attività e persone che rendono possibile Sander. Grazie! 🙏
            </p>
          </div>

          <div className="space-y-3">
            {SUPPORTERS.map((s) => (
              <a
                key={s.name}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-20 overflow-hidden rounded-2xl bg-[var(--surface-2)] active:opacity-75 transition-opacity"
              >
                {/* Left panel: the banner photo, else the whole logo, else initials */}
                <div
                  className="relative flex h-full w-32 shrink-0 items-center justify-center overflow-hidden"
                  style={{ background: s.banner ? "var(--surface-1)" : s.logoBg ?? (s.accentColor ? `linear-gradient(135deg, ${s.accentColor}33, ${s.accentColor}99)` : "var(--surface-3)") }}
                >
                  {s.banner ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={s.banner} alt={s.name} className="h-full w-full object-cover object-top" />
                  ) : s.logo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={s.logo} alt={s.name} className="h-full w-full object-contain p-2" />
                  ) : (
                    <span className="text-xl font-black text-white opacity-90">{s.name.slice(0, 2).toUpperCase()}</span>
                  )}
                </div>
                {/* Info — right portion (the logo again only next to a banner) */}
                <div className="flex min-w-0 flex-1 items-center gap-3 px-4">
                  {s.banner && s.logo && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={s.logo} alt="" className="h-10 w-10 shrink-0 rounded-xl object-cover" />
                  )}
                  <div className="min-w-0">
                    <p className="font-black text-base text-white truncate">{s.name}</p>
                    {s.tagline && (
                      <p className="text-xs text-[var(--muted-text)] truncate">{s.tagline}</p>
                    )}
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* ══ Admin tab ═════════════════════════════════════════ */}
      {activeTab === "admin" && isAdmin && (
        <div className="px-4 space-y-3">

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "Sessioni", value: adminSessions.length, icon: Users },
              { label: "Tornei",   value: adminTournaments.length, icon: Trophy },
              { label: "Giocatori", value: adminPlayers.length, icon: ShieldCheck },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="flex flex-col items-center gap-1 rounded-2xl bg-[var(--surface-2)] py-4">
                <Icon className="h-5 w-5 text-[var(--accent)]" />
                <span className="text-2xl font-black text-white">{value}</span>
                <span className="text-xs text-[var(--muted-text)]">{label}</span>
              </div>
            ))}
          </div>

          {/* Business metrics */}
          <Link
            href="/admin/metriche"
            className="flex min-h-[3.5rem] items-center gap-3 rounded-2xl bg-[var(--surface-2)] px-4 py-3 active:bg-[var(--surface-3)]"
          >
            <ChartColumn className="h-5 w-5 shrink-0 text-[var(--accent)]" />
            <span className="flex-1">
              <span className="block text-base font-bold text-white">Metriche</span>
              <span className="block text-sm text-[var(--muted-text)]">Incassi, valori medi, chi torna a giocare</span>
            </span>
            <ChevronRight className="h-5 w-5 text-[var(--muted-text)]" />
          </Link>

          {/* Scopri reports */}
          <Link
            href="/admin/segnalazioni"
            className="flex min-h-[3.5rem] items-center gap-3 rounded-2xl bg-[var(--surface-2)] px-4 py-3 active:bg-[var(--surface-3)]"
          >
            <ShieldCheck className="h-5 w-5 shrink-0 text-[var(--danger)]" />
            <span className="flex-1">
              <span className="block text-base font-bold text-white">Moderazione Scopri</span>
              <span className="block text-sm text-[var(--muted-text)]">Segnalazioni, foto, sospensioni</span>
            </span>
            <ChevronRight className="h-5 w-5 text-[var(--muted-text)]" />
          </Link>

          {/* Errors and maintenance */}
          <Link
            href="/admin/sistema"
            className="flex min-h-[3.5rem] items-center gap-3 rounded-2xl bg-[var(--surface-2)] px-4 py-3 active:bg-[var(--surface-3)]"
          >
            <Bug className="h-5 w-5 shrink-0 text-[var(--accent)]" />
            <span className="flex-1">
              <span className="block text-base font-bold text-white">Sistema</span>
              <span className="block text-sm text-[var(--muted-text)]">Errori dell'app, pulizia foto</span>
            </span>
            <ChevronRight className="h-5 w-5 text-[var(--muted-text)]" />
          </Link>

          {/* Recalc button */}
          <AdminRecalcStatsButton />

          {/* DB error display */}
          {adminError && (
            <div className="rounded-2xl px-4 py-3 text-xs font-mono break-all"
              style={{ background: "color-mix(in srgb, var(--danger) 13%, transparent)", color: "var(--danger)" }}>
              {adminError}
            </div>
          )}

          {/* Everything below folds into labelled sections: the tab used to be
              one ~12,000px scroll with the credits manager at the very bottom. */}
          <AdminSection title="SanderCredits" hint="Ricariche e omaggi" defaultOpen>
            <AdminCreditsManager players={adminPlayers} />
          </AdminSection>

          <AdminSection title="Sessioni" count={adminSessions.length}>
            <AdminSearchList
              label="Cerca tra le sessioni"
              placeholder="Cerca per titolo, luogo, organizzatore…"
              items={adminSessions.map((s) => ({
                id: s.id,
                text: `${s.title} ${s.location ?? ""} ${s.organizer?.name ?? ""}`.toLowerCase(),
                node: (
                  <div className="flex items-center gap-2 rounded-2xl bg-[var(--surface-2)] p-3">
                    <Link
                      href={`/sessions/${s.id}`}
                      className="flex min-h-[2.75rem] min-w-0 flex-1 flex-col justify-center active:opacity-80"
                    >
                      <p className="truncate text-base font-bold text-white">{s.title}</p>
                      <p className="text-sm text-[var(--muted-text)]">
                        {s.organizer.name} · {formatDate(s.date)} · {s._count.participants} partecipanti
                      </p>
                    </Link>
                    <span
                      className="shrink-0 text-sm font-bold"
                      style={{ color: STATUS_COLORS[s.status] ?? "var(--muted-text)" }}
                    >
                      {STATUS_LABELS[s.status] ?? s.status}
                    </span>
                    <AdminDeleteSessionButton id={s.id} />
                  </div>
                ),
              }))}
            />
          </AdminSection>

          <AdminSection title="Tornei" count={adminTournaments.length}>
            {adminTournaments.map((t) => (
              <div
                key={t.id}
                className="flex items-center gap-2 rounded-2xl bg-[var(--surface-2)] p-3"
              >
                <Link
                  href={`/tournaments/${t.id}`}
                  className="flex min-h-[2.75rem] min-w-0 flex-1 items-center gap-3 active:opacity-80"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-base font-bold text-white">{t.name}</p>
                    <p className="text-sm text-[var(--muted-text)]">
                      {formatDate(t.date)} · {t._count.registrations} iscritti
                    </p>
                  </div>
                  <StatusBadge status={t.status as "DRAFT" | "LIVE" | "COMPLETED"} />
                </Link>
                <AdminDeleteTournamentButton id={t.id} />
              </div>
            ))}
          </AdminSection>

          <AdminSection title="Account giocatori" count={adminPlayers.length}>
            <AdminSearchList
              label="Cerca tra i giocatori"
              placeholder="Cerca per nome o email…"
              items={adminPlayers.map((p: { id: string; name: string; level: number; createdAt: Date; avatarUrl?: string | null; user?: { email?: string } }) => ({
                id: p.id,
                text: `${p.name} ${p.user?.email ?? ""}`.toLowerCase(),
                node: (
                  <div className="flex items-center gap-2 rounded-2xl bg-[var(--surface-2)] p-3">
                    <Link
                      href={`/players/${p.id}`}
                      className="flex min-h-[2.75rem] min-w-0 flex-1 flex-col justify-center active:opacity-80"
                    >
                      <div className="flex items-center gap-2">
                        <p className="truncate text-base font-bold text-white">{p.name}</p>
                        {!p.avatarUrl && (
                          <span className="rounded bg-[var(--muted-text)]/20 px-1.5 py-0.5 text-xs font-bold uppercase tracking-wider text-[var(--muted-text)]">
                            no foto
                          </span>
                        )}
                      </div>
                      <p className="truncate text-sm text-[var(--muted-text)]">
                        {p.user?.email ?? "—"} · Lv.{p.level} · {formatDate(p.createdAt)}
                      </p>
                    </Link>
                    <AdminDeletePlayerButton id={p.id} />
                  </div>
                ),
              }))}
            />
          </AdminSection>

          <AdminSection title="Contenuti social" count={adminContent.length} hint="Coda dei post generati">
            <ContentQueue initial={adminContent} />
          </AdminSection>

          <AdminSection title="Stagione" hint={adminActiveSeason ? "Stagione attiva" : "Nessuna stagione attiva"}>
            <AdminSeasonManager activeSeason={adminActiveSeason} />
          </AdminSection>

        </div>
      )}
    </div>
  )
}
