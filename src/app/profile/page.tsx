export const dynamic = "force-dynamic"

import type { Metadata } from "next"
import { redirect } from "next/navigation"
import Link from "next/link"
import { FipavProfileCard } from "@/components/fipav/FipavProfileCard"
import { cookies } from "next/headers"
import { ArrowUpRight, MapPin, Calendar, ShieldCheck, Users, Trophy, Pencil, MessageCircle, ChartColumn, Bug, ChevronRight, HeartHandshake, CalendarCheck, Share2, SlidersHorizontal, ClipboardList, ShoppingBag, Settings, Gift, Building2, Smartphone, Star, LogOut } from "lucide-react"
import { getCurrentPlayer, getCurrentSession } from "@/lib/getCurrentPlayer"
import { db } from "@/lib/db"
import { SanderCardFut, playerToCardData } from "@/components/player/SanderCardFut"
import { StatPercentageEditor } from "@/components/player/StatPercentageEditor"
import { ShareCardButton } from "@/components/player/ShareCardButton"
import { shopIsOpen } from "@/lib/shopOrders"
import { ShareStoryButton } from "@/components/share/ShareStoryButton"
import { WrappedShareButton } from "@/components/share/WrappedShareButton"
import { DuoShareButton } from "@/components/share/DuoShareButton"
import { getPlayerRecap } from "@/actions/recap"
import { SignOutButton } from "@/components/auth/SignOutButton"
import { InviteTab } from "@/components/profile/InviteTab"
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
import { RateAppLink, RateAppRow } from "@/components/app/StoreReview"
import { PROFILE_MODE_COOKIE, parseProfileMode } from "@/lib/profileMode"
import { ProfileSwitcher, type SwitcherClub } from "@/components/profile/ProfileSwitcher"
import { SheetButton } from "@/components/profile/SheetButton"
import { BackRow, Eyebrow, ListGroup, ListRow, Segments } from "@/components/profile/ProfileUI"
import { ClubProfile, CLUB_TABS, type ClubTab } from "@/components/profile/ClubProfile"

export const metadata: Metadata = {
  title: "Il tuo profilo | SANDER",
  description:
    "La tua carta giocatore, le statistiche e le partite.",
}

const MONTH_NAMES_IT = [
  "", "Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno",
  "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre",
]

const MONTH_SHORT = ["gen", "feb", "mar", "apr", "mag", "giu", "lug", "ago", "set", "ott", "nov", "dic"]

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

interface Props { searchParams: Promise<{ tab?: string; topup?: string; anno?: string; giorno?: string }> }

/** Player sections, and the pages opened from their lists (with the section they belong to). */
const PLAYER_TABS = ["carta", "attivita", "account"] as const
const SUBVIEWS: Record<string, "attivita" | "account"> = {
  partite: "attivita",
  organizzate: "attivita",
  compagni: "attivita",
  invita: "account",
  app: "account",
  supporter: "account",
  admin: "account",
}
const BACK_LABEL = { attivita: "Attività", account: "Account" } as const
const ROLE_LABEL: Record<string, string> = { BLOCKER: "Muro", DEFENDER: "Difensore" }

export default async function ProfilePage({ searchParams }: Props) {
  const { tab: rawTab, topup, anno, giorno } = await searchParams
  // Old links (?tab=profilo) land on the card.
  const tab = rawTab === "profilo" ? "carta" : rawTab

  const [player, session] = await Promise.all([getCurrentPlayer(), getCurrentSession()])
  if (!player) redirect("/auth/signin?callbackUrl=/profile")
  const isAdmin = isAdminEmail(session?.user?.email)

  // ── Who is using the profile: the player, or one of their clubs ──
  const [memberships, cookieStore] = await Promise.all([
    db.clubMember.findMany({
      where: { playerId: player.id },
      orderBy: { createdAt: "asc" },
      select: { role: true, club: { select: { id: true, slug: true, name: true, city: true, logoUrl: true, status: true, _count: { select: { followers: true } } } } },
    }),
    cookies(),
  ])
  const switcherClubs: SwitcherClub[] = memberships.map((m) => ({
    slug: m.club.slug,
    name: m.club.name,
    city: m.club.city,
    logoUrl: m.club.logoUrl,
    role: m.role,
    approved: m.club.status === "APPROVED",
    followers: m.club._count.followers,
  }))
  const modeSlug = parseProfileMode(cookieStore.get(PROFILE_MODE_COOKIE)?.value)
  const modeClub = memberships.find((m) => m.club.slug === modeSlug && m.club.status === "APPROVED")?.club ?? null
  // Club mode answers the bare /profile and the club's own sections; any
  // other link (an old "?tab=invita" in a notification) still opens the player page.
  const clubView = modeClub && (!tab || (CLUB_TABS as string[]).includes(tab)) ? modeClub : null

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
  const firstName = fullPlayer.firstName ?? fullPlayer.name.split(" ")[0]

  const header = (
    <div className="flex items-center justify-between gap-2 pb-1" style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 0.75rem)" }}>
      <ProfileSwitcher
        me={{
          name: firstName,
          subtitle: [fullPlayer.homeCity, ROLE_LABEL[fullPlayer.preferredRole]].filter(Boolean).join(" · ") || "La tua carta",
          avatarUrl: fullPlayer.avatarUrl,
        }}
        clubs={switcherClubs}
        active={clubView?.slug ?? null}
        staleMode={!!modeSlug && !modeClub}
      />
      {clubView ? (
        <Link href="/profile?tab=gestione" aria-label="Gestione del club" className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[var(--surface-2)] text-white">
          <Settings className="h-5 w-5" aria-hidden="true" />
        </Link>
      ) : (
        <Link href="/onboarding/profile" aria-label="Modifica profilo" className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[var(--surface-2)] text-white">
          <Pencil className="h-5 w-5" aria-hidden="true" />
        </Link>
      )}
    </div>
  )

  if (clubView) {
    return (
      <div className="flex min-h-dvh flex-col">
        <h1 className="sr-only">{clubView.name}: gestione club</h1>
        <ClubProfile clubId={clubView.id} tab={(tab as ClubTab | undefined) ?? "plancia"} year={Number(anno) || undefined} day={giorno} header={header} />
      </div>
    )
  }

  const known = (PLAYER_TABS as readonly string[]).includes(tab ?? "") || (tab ?? "") in SUBVIEWS
  const requested = known ? (tab as string) : "carta"
  // The admin page doesn't exist for everyone else: show the card instead of a blank page.
  const activeTab = requested === "admin" && !isAdmin ? "carta" : requested
  const section = SUBVIEWS[activeTab] ?? activeTab

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

  const now = new Date()
  const startOfToday = new Date(now)
  startOfToday.setHours(0, 0, 0, 0)
  const shopOpen = activeTab === "account" ? await shopIsOpen().catch(() => false) : false
  const needsHistory = activeTab === "carta" || activeTab === "attivita"
  const needsPartners = activeTab === "carta" || activeTab === "attivita" || activeTab === "compagni"
  const [matchHistory, partnerStats, playerRecap, upcomingSessions, upcomingTournaments] = await Promise.all([
    needsHistory ? getMatchHistory(player.id, activeTab === "attivita" ? 6 : 1) : Promise.resolve([]),
    needsPartners ? getPartnerStats(player.id) : Promise.resolve([]),
    activeTab === "carta" ? getPlayerRecap(player.id, 30) : Promise.resolve(null),
    activeTab === "attivita"
      ? db.sessionParticipant.findMany({
          where: { playerId: player.id, session: { date: { gte: startOfToday }, status: { in: ["OPEN", "FULL"] } } },
          select: { session: { select: { id: true, title: true, date: true, location: true } } },
          orderBy: { session: { date: "asc" } },
          take: 5,
        })
      : Promise.resolve([]),
    activeTab === "attivita"
      ? db.tournamentRegistration.findMany({
          where: {
            playerId: player.id,
            isSpectator: false,
            paymentStatus: { notIn: ["CANCELLED", "FAILED", "REFUNDED"] },
            tournament: { date: { gte: startOfToday }, status: { not: "COMPLETED" } },
          },
          select: { tournament: { select: { id: true, name: true, date: true, location: true } } },
          orderBy: { tournament: { date: "asc" } },
          take: 5,
        })
      : Promise.resolve([]),
  ])
  const upcoming = [
    ...upcomingSessions.map((s) => ({ key: `s-${s.session.id}`, href: `/sessions/${s.session.id}`, title: s.session.title, date: s.session.date, place: s.session.location, kind: "Partita" })),
    ...upcomingTournaments.map((r) => ({ key: `t-${r.tournament.id}`, href: `/tournaments/${r.tournament.id}`, title: r.tournament.name, date: r.tournament.date, place: r.tournament.location, kind: "Torneo" })),
  ]
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(0, 5)

  const achievements = activeTab === "carta"
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

  const cardData = playerToCardData(fullPlayer)
  const topPartner = partnerStats[0]

  return (
    <div className="flex min-h-dvh flex-col pb-6">
      <h1 className="sr-only">Il tuo profilo</h1>
      <div className="flex flex-col gap-3 px-4 pb-3">
        {header}
        <Segments
          active={section}
          items={[
            { id: "carta", label: "Carta", href: "/profile?tab=carta" },
            { id: "attivita", label: "Attività", href: "/profile?tab=attivita" },
            { id: "account", label: "Account", href: "/profile?tab=account" },
          ]}
        />
        {SUBVIEWS[activeTab] && <BackRow href={`/profile?tab=${section}`} label={BACK_LABEL[SUBVIEWS[activeTab]]} />}
      </div>

      {/* Back from the card payment: say what happened, so nobody pays twice. */}
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

      {/* ══ Carta ═════════════════════════════════════════════ */}
      {activeTab === "carta" && (
        <div className="flex flex-col gap-3 px-4">
          {/* The player's card, exactly as before: same template, same layout. */}
          <SanderCardFut playerData={cardData} cutout />

          <div className="flex gap-2">
            <SheetButton
              primary
              label="Condividi"
              title="Condividi la carta"
              description="Storia per Instagram e WhatsApp, oppure l'immagine della carta."
              icon={<Share2 className="h-5 w-5" aria-hidden="true" />}
            >
              <div className="flex flex-col gap-3">
                <ShareStoryButton playerData={cardData} variant="card" lazy />
                <ShareCardButton playerData={cardData} />
                {playerRecap && playerRecap.matches > 0 && <WrappedShareButton playerName={fullPlayer.name} recap={playerRecap} />}
                {topPartner && (
                  <DuoShareButton
                    playerA={fullPlayer.name}
                    playerB={topPartner.player.name}
                    played={topPartner.played}
                    won={topPartner.won}
                    winRate={topPartner.winRate}
                  />
                )}
              </div>
            </SheetButton>
            {!isNewPlayer && (
              <SheetButton
                label="Parametri"
                title="I tuoi parametri"
                description="Scegli in cosa sei più forte: la carta si aggiorna."
                icon={<SlidersHorizontal className="h-5 w-5" aria-hidden="true" />}
              >
                <div className="flex flex-col gap-3">
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
                  <Link href="/stats-guide" className="flex min-h-[3.5rem] items-center justify-center gap-2 rounded-2xl bg-[var(--accent-soft)] font-semibold text-[var(--accent)]">
                    <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                    Come funzionano i parametri?
                  </Link>
                </div>
              </SheetButton>
            )}
          </div>

          {/* The stat sliders mean nothing before a first game: show where to start instead. */}
          {isNewPlayer && (
            <div className="tone-play space-y-3 rounded-2xl bg-[var(--surface-2)] p-5 text-center">
              <ChartColumn className="mx-auto h-8 w-8 text-[var(--tone)]" aria-hidden="true" />
              <p className="text-lg font-black text-white">Gioca la tua prima partita per sbloccare le statistiche</p>
              <p className="text-base text-[var(--muted-text)]">
                Dopo la prima partita potrai scegliere in cosa sei più forte e la tua carta si aggiornerà.
              </p>
              <Link href="/sessions" className="flex min-h-[3.5rem] w-full items-center justify-center rounded-full bg-[var(--accent)] text-base font-black text-black">
                Trova una partita
              </Link>
            </div>
          )}

          {/* SANDER Wrapped — personal 30-day recap (only when there's activity) */}
          {playerRecap && playerRecap.matches > 0 && (
            <section>
              <Eyebrow>Il tuo mese</Eyebrow>
              <div className="grid grid-cols-3 gap-2 rounded-2xl bg-[var(--surface-2)] p-4 text-center">
                <div>
                  <p className="font-display text-2xl font-extrabold text-white">{playerRecap.matches}</p>
                  <p className="text-xs font-bold uppercase tracking-widest text-[var(--muted-text)]">Partite</p>
                </div>
                <div>
                  <p className="font-display text-2xl font-extrabold text-[var(--accent)]">{playerRecap.wins}</p>
                  <p className="text-xs font-bold uppercase tracking-widest text-[var(--muted-text)]">Vittorie</p>
                </div>
                <div>
                  <p className="font-display text-2xl font-extrabold text-white">
                    {playerRecap.ratingDelta >= 0 ? "+" : ""}{playerRecap.ratingDelta}
                  </p>
                  <p className="text-xs font-bold uppercase tracking-widest text-[var(--muted-text)]">Rating</p>
                </div>
              </div>
            </section>
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
          <FipavProfileCard player={fullPlayer} />
          <Achievements achievements={achievements} />
        </div>
      )}

      {/* ══ Attività ══════════════════════════════════════════ */}
      {activeTab === "attivita" && (
        <div className="flex flex-col px-4">
          <Eyebrow className="pt-0">Prossime</Eyebrow>
          {upcoming.length === 0 ? (
            <div className="flex items-center justify-between gap-3 rounded-[1.25rem] bg-[var(--surface-2)] p-4">
              <p className="text-base text-[var(--muted-text)]">Niente in programma.</p>
              <Link href="/sessions" className="btn btn-primary min-h-[3rem] px-5 text-sm">Trova una partita</Link>
            </div>
          ) : (
            <div className="divide-y divide-[var(--border)] overflow-hidden rounded-[1.25rem] bg-[var(--surface-2)]">
              {upcoming.map((u) => (
                <Link key={u.key} href={u.href} className="flex min-h-[3.75rem] items-center gap-3 px-4 py-2.5 active:bg-[var(--surface-3)]">
                  <span className="w-11 shrink-0 text-center">
                    <span className="block font-display text-xl font-extrabold leading-none text-[var(--accent)]">{u.date.getDate()}</span>
                    <span className="block text-xs font-bold uppercase text-[var(--muted-text)]">{MONTH_SHORT[u.date.getMonth()]}</span>
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-base font-bold text-white">{u.title}</span>
                    <span className="block truncate text-sm text-[var(--muted-text)]">{u.place}</span>
                  </span>
                  <span className="shrink-0 rounded-full bg-[var(--surface-3)] px-2.5 py-1 text-xs font-extrabold text-[var(--social)]">{u.kind}</span>
                </Link>
              ))}
            </div>
          )}

          {matchHistory.length > 0 && (
            <div className="pt-3">
              <MatchHistory entries={matchHistory} />
            </div>
          )}

          <Eyebrow>Il tuo gioco</Eyebrow>
          <ListGroup>
            <ListRow
              href="/profile?tab=compagni"
              icon={<Users className="h-5 w-5 text-[var(--social)]" />}
              title="Compagni"
              subtitle={topPartner ? `Coppia migliore: ${topPartner.player.firstName ?? topPartner.player.name.split(" ")[0]} · ${topPartner.winRate}%` : "Con chi giochi meglio"}
            />
            <ListRow href="/profile/presenze" icon={<CalendarCheck className="h-5 w-5 text-[var(--social)]" />} title="Presenze" subtitle="Quando hai giocato" />
            <ListRow href="/profile?tab=partite" icon={<Calendar className="h-5 w-5 text-[var(--accent)]" />} title="Le tue partite" subtitle="Tutte quelle a cui ti sei unito" />
            <ListRow
              href="/profile?tab=organizzate"
              icon={<ClipboardList className="h-5 w-5 text-[var(--compete)]" />}
              title="Partite organizzate"
              subtitle={fullPlayer._count.organizedSessions > 0 ? `${fullPlayer._count.organizedSessions} da te` : "Creane una e invita gli amici"}
            />
            <ListRow href="/messaggi" icon={<MessageCircle className="h-5 w-5 text-[var(--accent)]" />} title="Messaggi" subtitle="Chat con giocatori e gruppi" />
          </ListGroup>
        </div>
      )}

      {/* ══ Compagni (from Attività) ══════════════════════════ */}
      {activeTab === "compagni" && (
        <div className="flex flex-col gap-3 px-4">
          {topPartner && (
            <div className="space-y-3 rounded-2xl bg-[var(--surface-2)] p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-[var(--muted-text)]">La tua coppia migliore</p>
              <div className="flex items-center justify-between">
                <p className="font-black text-white">
                  {firstName} &amp; {topPartner.player.firstName ?? topPartner.player.name.split(" ")[0]}
                </p>
                <p className="text-lg font-black text-[var(--accent)]">{topPartner.winRate}%</p>
              </div>
              <p className="text-sm text-[var(--muted-text)]">
                {topPartner.played} partite insieme · {topPartner.won} vinte
              </p>
              <DuoShareButton playerA={fullPlayer.name} playerB={topPartner.player.name} played={topPartner.played} won={topPartner.won} winRate={topPartner.winRate} />
            </div>
          )}
          {partnerStats.length === 0 ? (
            <p className="rounded-2xl bg-[var(--surface-2)] p-4 text-base text-[var(--muted-text)]">Gioca qualche partita in coppia: qui vedrai con chi vinci di più.</p>
          ) : (
            <PartnerStats stats={partnerStats} />
          )}
        </div>
      )}

      {/* ══ Account ═══════════════════════════════════════════ */}
      {activeTab === "account" && (
        <div className="flex flex-col px-4">
          <WalletCard credits={fullPlayer.sanderCredits} playerName={firstName} />
          <div className="pt-3">
            <ListGroup>
              {shopOpen && <ListRow href="/shop" icon={<ShoppingBag className="h-5 w-5 text-[var(--accent)]" />} title="Shop" subtitle="Merch ufficiale · I miei ordini" />}
              <ListRow href="/profile?tab=invita" icon={<Gift className="h-5 w-5 text-[var(--accent)]" />} title="Invita amici" subtitle="Crediti per te e per chi entra" />
            </ListGroup>
          </div>

          <Eyebrow>Tu</Eyebrow>
          <ListGroup>
            <ListRow href="/onboarding/profile" icon={<Pencil className="h-5 w-5" />} title="Modifica profilo" subtitle="Foto, nome, ruolo, comune" />
            <ListRow href="/scopri/profilo" icon={<HeartHandshake className="h-5 w-5 text-[var(--love)]" />} title="Profilo Scopri" subtitle="Foto e presentazione · 18+" />
            <ListRow
              href="/club"
              icon={<Building2 className="h-5 w-5 text-[var(--compete)]" />}
              title={switcherClubs.length > 0 ? "I tuoi club" : "Porta il tuo club"}
              subtitle={switcherClubs.length > 0 ? "Passa al club dal tuo nome in alto" : "Società, circoli e bagni: gratis"}
            />
          </ListGroup>
          <div className="pt-3">
            <NotifyPermission />
          </div>

          <Eyebrow>SANDER</Eyebrow>
          <ListGroup>
            <ListRow href="/profile?tab=app" icon={<Smartphone className="h-5 w-5" />} title="App e aiuto" subtitle="Notifiche, assistenza, privacy" />
            <RateAppRow />
            <ListRow href="/profile?tab=supporter" icon={<Star className="h-5 w-5 text-[var(--gold)]" />} title="Supporter" subtitle="Chi ci sostiene" />
            {isAdmin && <ListRow href="/profile?tab=admin" icon={<ShieldCheck className="h-5 w-5 text-[var(--danger)]" />} title="Admin" subtitle="Gestione di SANDER" />}
          </ListGroup>
          <SignOutButton className="mt-3 flex min-h-[3.5rem] w-full items-center justify-center gap-2 rounded-[1.25rem] bg-[var(--surface-2)] text-base font-bold text-[var(--danger)]">
            <LogOut className="h-5 w-5" aria-hidden="true" /> Esci dall&apos;account
          </SignOutButton>
          <p className="px-1 pt-3 text-xs text-[var(--muted-text)]">Versione app {APP_VERSION_DISPLAY}</p>
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

          <RateAppLink className="flex min-h-[3.5rem] items-center justify-between border-b border-[var(--border)] px-2 py-4 text-base font-semibold text-[var(--accent)] transition-opacity active:opacity-60" />
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
              style={{ background: "rgb(255 77 109 / 0.13)", color: "var(--danger)" }}>
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
