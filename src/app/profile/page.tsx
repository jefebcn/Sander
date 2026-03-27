export const dynamic = "force-dynamic"

import { redirect } from "next/navigation"
import Link from "next/link"
import { ArrowUpRight, MapPin, Calendar, Settings, ShieldCheck, Users, Trophy } from "lucide-react"
import { getCurrentPlayer, getCurrentSession } from "@/lib/getCurrentPlayer"
import { db } from "@/lib/db"
import { SanderCardFifa } from "@/components/player/SanderCardFifa"
import { SignOutButton } from "@/components/auth/SignOutButton"
import { InviteTab } from "@/components/profile/InviteTab"
import { APP_VERSION_DISPLAY } from "@/lib/appVersion"
import { formatDate } from "@/lib/utils"
import { StatusBadge } from "@/components/tournament/StatusBadge"

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? ""

// ── helpers ──────────────────────────────────────────────────────────

async function getStreak(playerId: string): Promise<number> {
  const since = new Date(Date.now() - 28 * 24 * 60 * 60 * 1000)
  const count = await db.sessionParticipant.count({
    where: { playerId, session: { status: "COMPLETED", date: { gte: since } } },
  })
  return Math.min(count, 10)
}

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
  const validTabs = ["profilo", "partite", "organizzate", "invita", "app", "admin"]
  const activeTab = validTabs.includes(tab ?? "") ? (tab as string) : "profilo"

  const [player, session] = await Promise.all([getCurrentPlayer(), getCurrentSession()])
  if (!player) redirect("/auth/signin?callbackUrl=/profile")

  const isAdmin = ADMIN_EMAIL && session?.user?.email === ADMIN_EMAIL

  // Always fetch core player data
  const [fullPlayer, streak] = await Promise.all([
    db.player.findUniqueOrThrow({
      where: { id: player.id },
      include: {
        _count: { select: { organizedSessions: true, badgesReceived: true } },
        badgesReceived: { where: { badge: "MVP_PARTITA" } },
      },
    }),
    getStreak(player.id),
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

  // Admin data (only fetched when admin views the admin tab)
  const adminSessions = isAdmin && activeTab === "admin"
    ? await db.session.findMany({
        orderBy: { date: "desc" },
        include: {
          organizer: { select: { name: true } },
          _count: { select: { participants: true } },
        },
      })
    : []
  const adminTournaments = isAdmin && activeTab === "admin"
    ? await db.tournament.findMany({
        orderBy: { date: "desc" },
        include: { _count: { select: { registrations: true } } },
      })
    : []

  const TABS = [
    { id: "profilo",      label: "Profilo" },
    { id: "partite",      label: "Partite" },
    { id: "organizzate",  label: "Organizzate" },
    { id: "invita",       label: "Invita" },
    { id: "app",          label: "App" },
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
          <Link
            href="/onboarding/profile"
            className="flex min-h-[3.5rem] w-full items-center justify-center gap-2 rounded-2xl bg-[var(--surface-2)] font-semibold text-[var(--foreground)]"
          >
            <Settings className="h-4 w-4 text-[var(--muted-text)]" />
            Modifica profilo
          </Link>
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
        <InviteTab promoCode={promoCode} playerName={fullPlayer.name} />
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

      {/* ══ Admin tab ═════════════════════════════════════════ */}
      {activeTab === "admin" && isAdmin && (
        <div className="px-4 space-y-5">

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "Sessioni", value: adminSessions.length, icon: Users },
              { label: "Tornei",   value: adminTournaments.length, icon: Trophy },
              { label: "Totale",   value: adminSessions.length + adminTournaments.length, icon: ShieldCheck },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="flex flex-col items-center gap-1 rounded-2xl bg-[var(--surface-2)] py-4">
                <Icon className="h-5 w-5 text-[var(--accent)]" />
                <span className="text-2xl font-black text-white">{value}</span>
                <span className="text-xs text-[var(--muted-text)]">{label}</span>
              </div>
            ))}
          </div>

          {/* All sessions */}
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-[var(--accent)]">
              Tutte le sessioni
            </p>
            <div className="space-y-2">
              {adminSessions.map((s) => (
                <Link
                  key={s.id}
                  href={`/sessions/${s.id}`}
                  className="flex items-start gap-3 rounded-2xl bg-[var(--surface-2)] p-3 active:opacity-80"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-white text-sm truncate">{s.title}</p>
                    <p className="text-xs text-[var(--muted-text)]">
                      {s.organizer.name} · {formatDate(s.date)} · {s._count.participants} partecipanti
                    </p>
                  </div>
                  <span
                    className="shrink-0 text-xs font-bold"
                    style={{ color: STATUS_COLORS[s.status] ?? "var(--muted-text)" }}
                  >
                    {STATUS_LABELS[s.status] ?? s.status}
                  </span>
                </Link>
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
                <Link
                  key={t.id}
                  href={`/tournaments/${t.id}`}
                  className="flex items-start gap-3 rounded-2xl bg-[var(--surface-2)] p-3 active:opacity-80"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-white text-sm truncate">{t.name}</p>
                    <p className="text-xs text-[var(--muted-text)]">
                      {formatDate(t.date)} · {t._count.registrations} iscritti
                    </p>
                  </div>
                  <StatusBadge status={t.status as "DRAFT" | "LIVE" | "COMPLETED"} />
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
