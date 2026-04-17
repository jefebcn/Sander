export const dynamic = "force-dynamic"

import { redirect } from "next/navigation"
import Link from "next/link"
import { ArrowUpRight, MapPin, Calendar, Settings, ShieldCheck, Users, Trophy } from "lucide-react"
import { getCurrentPlayer, getCurrentSession } from "@/lib/getCurrentPlayer"
import { db } from "@/lib/db"
import { SanderCardFut, playerToCardData } from "@/components/player/SanderCardFut"
import { StatPercentageEditor } from "@/components/player/StatPercentageEditor"
import { ShareCardButton } from "@/components/player/ShareCardButton"
import { SignOutButton } from "@/components/auth/SignOutButton"
import { InviteTab } from "@/components/profile/InviteTab"
import { APP_VERSION_DISPLAY } from "@/lib/appVersion"
import { formatDate } from "@/lib/utils"
import { getStreak } from "@/lib/streak"
import { StatusBadge } from "@/components/tournament/StatusBadge"
import { AdminDeleteSessionButton } from "@/components/profile/AdminDeleteSessionButton"
import { AdminDeleteTournamentButton } from "@/components/profile/AdminDeleteTournamentButton"
import { AdminDeletePlayerButton } from "@/components/profile/AdminDeletePlayerButton"
import { AdminRecalcStatsButton } from "@/components/profile/AdminRecalcStatsButton"
import { NotifyPermission } from "@/components/push/NotifyPermission"

import { isAdminEmail } from "@/lib/isAdmin"

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
// image/icon are optional — if absent a gradient placeholder is shown.
const SUPPORTERS: { name: string; image?: string; icon?: string; href: string; tagline?: string; accentColor?: string }[] = [
  {
    name: "LilloFind",
    image: "/sponsors/lillofind-banner.png",
    icon: "/sponsors/lillofind.png",
    href: "https://jefebcn.github.io/lillofind/",
    tagline: "Streetwear & Abbigliamento",
  },
  {
    name: "Fisioganzerli",
    href: "https://fisioterapiaganzerli.com/",
    tagline: "Fisioterapia & Riabilitazione",
    accentColor: "#22c55e",
  },
  {
    name: "WanderQuest",
    href: "https://wanderquest-jade.vercel.app/",
    tagline: "Esplora il mondo",
    accentColor: "#3b82f6",
  },
  {
    name: "Flexeno",
    image: "/sponsors/flexeno.png",
    icon: "/sponsors/flexeno.png",
    href: "https://flexenofitness.com/",
    tagline: "Fitness & Performance",
  },
]

// ── helpers ──────────────────────────────────────────────────────────

function buildPromoCode(id: string): string {
  const clean = id.replace(/[^a-z0-9]/gi, "").toUpperCase()
  return `${clean.slice(2, 6)}-${clean.slice(6, 10)}`
}

const STATUS_LABELS: Record<string, string> = {
  OPEN: "Aperta",
  FULL: "Completa",
  COMPLETED: "Completata",
  CANCELLED: "Annullata",
}

const STATUS_COLORS: Record<string, string> = {
  OPEN: "var(--live)",
  FULL: "var(--warning)",
  COMPLETED: "var(--muted-text)",
  CANCELLED: "var(--danger)",
}

// ── page ─────────────────────────────────────────────────────────────

interface Props { searchParams: Promise<{ tab?: string }> }

export default async function ProfilePage({ searchParams }: Props) {
  const { tab } = await searchParams
  const validTabs = ["profilo", "partite", "organizzate", "invita", "app", "supporter", "admin"]
  const activeTab = validTabs.includes(tab ?? "") ? (tab as string) : "profilo"

  const [player, session] = await Promise.all([getCurrentPlayer(), getCurrentSession()])
  if (!player) redirect("/auth/signin?callbackUrl=/profile")

  const isAdmin = isAdminEmail(session?.user?.email)

  // Always fetch core player data
  const [fullPlayer, streak, monthlyAwards] = await Promise.all([
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

  const promoCode = buildPromoCode(player.id)

  const inviteCount = activeTab === "invita"
    ? await db.user.count({ where: { invitedByPlayerId: player.id } })
    : 0

  // Admin data (only fetched when admin views the admin tab)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let adminSessions: any[] = []
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let adminTournaments: any[] = []
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let adminPlayers: any[] = []
  let adminError: string | null = null

  if (isAdmin && activeTab === "admin") {
    try {
      ;[adminSessions, adminTournaments, adminPlayers] = await Promise.all([
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
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            level: true,
            createdAt: true,
            user: { select: { email: true } },
          },
        }),
      ])
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
    ...(isAdmin ? [{ id: "admin", label: "⚙ Admin" }] : []),
  ]

  return (
    <div className="flex flex-col min-h-dvh pb-6">

      {/* ── Header ──────────────────────────────────────────── */}
      <div
        className="flex items-center justify-between px-4 pt-5 pb-3"
        style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 1.25rem)" }}
      >
        <h1 className="text-2xl font-black text-white">Profilo</h1>
        <SignOutButton
          className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--surface-2)] text-[var(--muted-text)] transition-colors hover:text-[var(--foreground)]"
          iconOnly
        />
      </div>

      {/* ── Tab bar (horizontal scroll) ───────────────────── */}
      <div className="flex gap-2 overflow-x-auto px-4 pb-3 scrollbar-none"
        style={{ scrollbarWidth: "none" }}>
        {TABS.map(({ id, label }) => (
          <Link
            key={id}
            href={id === "profilo" ? "/profile" : `/profile?tab=${id}`}
            className="shrink-0 rounded-xl px-4 py-2 text-sm font-bold transition-colors whitespace-nowrap"
            style={
              activeTab === id
                ? { background: "var(--accent)", color: "#000" }
                : { background: "var(--surface-2)", color: "var(--muted-text)", border: "1px solid rgba(255,255,255,0.08)" }
            }
          >
            {label}
          </Link>
        ))}
      </div>

      {/* ══ Profilo tab ═══════════════════════════════════════ */}
      {activeTab === "profilo" && (
        <div className="px-4 space-y-3">
          <SanderCardFut playerData={playerToCardData(fullPlayer)} />
          <ShareCardButton playerData={playerToCardData(fullPlayer)} />
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
          {monthlyAwards.length > 0 && (
            <div className="rounded-2xl bg-[var(--surface-2)] p-5 flex flex-col gap-3">
              <p className="text-xs font-bold uppercase tracking-wider text-[var(--muted-text)]">
                Titoli
              </p>
              <div className="flex flex-wrap gap-2">
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
                        <span className="text-[0.65rem] text-white/40 leading-tight">
                          {MONTH_NAMES_IT[award.month]} {award.year}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
          <Link
            href="/stats-guide"
            className="flex min-h-[3.5rem] w-full items-center justify-center gap-2 rounded-2xl font-semibold text-[var(--accent)]"
            style={{ background: "rgba(201,243,29,0.07)", border: "1px solid rgba(201,243,29,0.2)" }}
          >
            <ArrowUpRight className="h-4 w-4" />
            Come funzionano i parametri?
          </Link>
          <Link
            href="/onboarding/profile"
            className="flex min-h-[3.5rem] w-full items-center justify-center gap-2 rounded-2xl bg-[var(--surface-2)] font-semibold text-[var(--foreground)]"
          >
            <Settings className="h-4 w-4 text-[var(--muted-text)]" />
            Modifica profilo
          </Link>

          <NotifyPermission />

          {/* Support banner */}
          <a
            href="https://ko-fi.com/sanderbv"
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full flex-col gap-2 rounded-2xl p-4 active:opacity-80"
            style={{ background: "var(--surface-2)", border: "1px solid rgba(201,243,29,0.15)" }}
          >
            <div className="flex items-center gap-2">
              <span className="text-xl">☕</span>
              <span className="font-bold text-white">Supporta il Progetto</span>
            </div>
            <p className="text-sm text-[var(--muted-text)]">
              Aiuta a mantenere l&apos;app attiva e a finanziare nuovi tornei e aggiornamenti.
            </p>
            <div
              className="flex min-h-[2.5rem] w-full items-center justify-center rounded-xl font-bold text-sm text-black"
              style={{ background: "var(--accent)" }}
            >
              Dona su Ko-fi →
            </div>
          </a>

        </div>
      )}

      {/* ══ Partite tab ═══════════════════════════════════════ */}
      {activeTab === "partite" && (
        <div className="px-4 space-y-2">
          {playerSessions.length === 0 ? (
            <div className="flex flex-col items-center gap-3 pt-16 text-center">
              <p className="text-[var(--muted-text)]">Nessuna sessione ancora</p>
              <Link
                href="/sessions"
                className="rounded-xl bg-[var(--accent)] px-6 py-3 text-sm font-black text-black"
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
                className="rounded-xl bg-[var(--accent)] px-6 py-3 text-sm font-black text-black"
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
        <InviteTab promoCode={promoCode} playerName={fullPlayer.name} inviteCount={inviteCount} />
      )}

      {/* ══ App tab ═══════════════════════════════════════════ */}
      {activeTab === "app" && (
        <div className="px-4 space-y-1 pt-2">
          {[
            { label: "Chiedi aiuto o segnala un problema", href: "mailto:support@sander.app" },
            { label: "Termini del servizio", href: "/terms" },
            { label: "Privacy policy", href: "/privacy" },
            { label: "Valuta l'app", href: "https://www.instagram.com" },
          ].map(({ label, href }) => (
            <a
              key={label}
              href={href}
              target={href.startsWith("http") || href.startsWith("mailto") ? "_blank" : undefined}
              rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
              className="flex items-center justify-between px-2 py-4 text-sm font-semibold text-[var(--accent)] transition-opacity active:opacity-60"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
            >
              {label}
              <ArrowUpRight className="h-4 w-4 shrink-0" />
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
                {/* Banner image — left portion */}
                <div className="relative h-full w-32 shrink-0 overflow-hidden bg-[var(--surface-1)]">
                  {s.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={s.image} alt={s.name} className="h-full w-full object-cover object-top" />
                  ) : (
                    <div
                      className="h-full w-full flex items-center justify-center"
                      style={{ background: s.accentColor ? `linear-gradient(135deg, ${s.accentColor}33, ${s.accentColor}99)` : "var(--surface-3)" }}
                    >
                      <span className="text-xl font-black text-white opacity-90">
                        {s.name.slice(0, 2).toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
                {/* Info — right portion */}
                <div className="flex min-w-0 flex-1 items-center gap-3 px-4">
                  {s.icon ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={s.icon} alt="" className="h-10 w-10 shrink-0 rounded-xl object-cover" />
                  ) : (
                    <div
                      className="h-10 w-10 shrink-0 rounded-xl flex items-center justify-center text-sm font-black text-white"
                      style={{ background: s.accentColor ?? "var(--surface-3)" }}
                    >
                      {s.name.slice(0, 2).toUpperCase()}
                    </div>
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
        <div className="px-4 space-y-5">

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

          {/* Recalc button */}
          <AdminRecalcStatsButton />

          {/* DB error display */}
          {adminError && (
            <div className="rounded-2xl px-4 py-3 text-xs font-mono break-all"
              style={{ background: "#ef444420", color: "#ef4444" }}>
              {adminError}
            </div>
          )}

          {/* All sessions */}
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-[var(--accent)]">
              Tutte le sessioni
            </p>
            <div className="space-y-2">
              {adminSessions.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center gap-2 rounded-2xl bg-[var(--surface-2)] p-3"
                >
                  <Link
                    href={`/sessions/${s.id}`}
                    className="flex-1 min-w-0 active:opacity-80"
                  >
                    <p className="font-bold text-white text-sm truncate">{s.title}</p>
                    <p className="text-xs text-[var(--muted-text)]">
                      {s.organizer.name} · {formatDate(s.date)} · {s._count.participants} partecipanti
                    </p>
                  </Link>
                  <span
                    className="shrink-0 text-xs font-bold"
                    style={{ color: STATUS_COLORS[s.status] ?? "var(--muted-text)" }}
                  >
                    {STATUS_LABELS[s.status] ?? s.status}
                  </span>
                  <AdminDeleteSessionButton id={s.id} />
                </div>
              ))}
            </div>
          </div>

          {/* All tournaments */}
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-[var(--muted-text)]">
              Tutti i tornei
            </p>
            <div className="space-y-2">
              {adminTournaments.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center gap-2 rounded-2xl bg-[var(--surface-2)] p-3"
                >
                  <Link
                    href={`/tournaments/${t.id}`}
                    className="flex-1 min-w-0 flex items-center gap-3 active:opacity-80"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-white text-sm truncate">{t.name}</p>
                      <p className="text-xs text-[var(--muted-text)]">
                        {formatDate(t.date)} · {t._count.registrations} iscritti
                      </p>
                    </div>
                    <StatusBadge status={t.status as "DRAFT" | "LIVE" | "COMPLETED"} />
                  </Link>
                  <AdminDeleteTournamentButton id={t.id} />
                </div>
              ))}
            </div>
          </div>

          {/* All players */}
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-[var(--accent)]">
              Account giocatori
            </p>
            <div className="space-y-2">
              {adminPlayers.map((p: { id: string; name: string; level: number; createdAt: Date; user?: { email?: string } }) => (
                <div
                  key={p.id}
                  className="flex items-center gap-2 rounded-2xl bg-[var(--surface-2)] p-3"
                >
                  <Link
                    href={`/players/${p.id}`}
                    className="flex-1 min-w-0 active:opacity-80"
                  >
                    <p className="font-bold text-white text-sm truncate">{p.name}</p>
                    <p className="text-xs text-[var(--muted-text)] truncate">
                      {p.user?.email ?? "—"} · Lv.{p.level} · {formatDate(p.createdAt)}
                    </p>
                  </Link>
                  <AdminDeletePlayerButton id={p.id} />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
