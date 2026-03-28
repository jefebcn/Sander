import { Shield, Hand, Trophy, TrendingUp, Activity, Award } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { StatusBadge } from "@/components/tournament/StatusBadge"
import { ratingToDisplayLevel, BADGE_LABELS, BADGE_EMOJIS } from "@/lib/tournament/glicko2"
import type {
  Player,
  TournamentRegistration,
  Tournament,
  BadgeAward,
} from "@/generated/prisma/client"

type PlayerWithHistory = Player & {
  registrations:  (TournamentRegistration & { tournament: Tournament })[]
  badgesReceived?: BadgeAward[]
  streak?:         number
}

interface SanderCardProps {
  player: PlayerWithHistory
}

// Count badge occurrences and return top-N
function topBadges(badges: BadgeAward[], n = 3) {
  const counts: Record<string, number> = {}
  for (const b of badges) counts[b.badge] = (counts[b.badge] ?? 0) + 1
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
}

export function SanderCard({ player }: SanderCardProps) {
  const isBlocker   = player.preferredRole === "BLOCKER"
  const avgDisplay  = player.avgRating > 0 ? (player.avgRating / 10).toFixed(1) : "—"
  const glicko      = ratingToDisplayLevel(player.glickoRating)
  const xpToNext    = 100 - (player.xp % 100)
  const xpPct       = Math.round(((player.xp % 100) / 100) * 100)
  const streak      = player.streak ?? 0
  const badges      = player.badgesReceived ?? []
  const top3        = topBadges(badges)

  return (
    <div className="overflow-hidden rounded-3xl" style={{ border: "1px solid var(--border)" }}>
      {/* ── Card header ──────────────────────────────────────────────────── */}
      <div
        className={cn(
          "relative px-6 pt-8 pb-10",
          isBlocker
            ? "bg-gradient-to-br from-blue-950 via-blue-900 to-blue-950"
            : "bg-gradient-to-br from-[#0e2a10] via-[#1a4020] to-[#0e2a10]",
        )}
      >
        <div className="absolute -top-8 -right-8 h-32 w-32 rounded-full bg-white/5" />
        <div className="absolute -bottom-4 -left-4 h-20 w-20 rounded-full bg-white/5" />

        {/* Brand + role badge */}
        <div className="relative mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-widest text-white/60">
              SANDER
            </span>
            <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs font-black text-white">
              Lv.{player.level}
            </span>
          </div>
          {/* Glicko badge */}
          <span className="rounded-full bg-[var(--accent)]/20 px-3 py-1 text-xs font-bold text-[var(--accent)]">
            {glicko} GLK
          </span>
        </div>

        {/* Role + avatar + trophy */}
        <div className="relative mb-4 flex items-end justify-center gap-4">
          <div className="absolute -left-0 bottom-0 text-left">
            <p className="text-xs font-bold uppercase tracking-widest text-white/50">Level</p>
            <p className="text-5xl font-black leading-none text-white">{player.level}</p>
          </div>

          <div
            className={cn(
              "flex h-24 w-24 items-center justify-center overflow-hidden rounded-full text-3xl font-black",
              isBlocker ? "bg-blue-600 text-blue-100" : "bg-[var(--accent)] text-black",
            )}
          >
            {player.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={player.avatarUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              player.name.slice(0, 2).toUpperCase()
            )}
          </div>

          {player.tournamentsWon > 0 && (
            <div className="absolute -right-0 bottom-0 flex h-8 w-8 items-center justify-center rounded-full bg-[var(--accent)] text-xs font-black text-black">
              {player.tournamentsWon}
            </div>
          )}
        </div>

        {/* Name */}
        <div className="text-center">
          <h2 className="text-3xl font-black tracking-tight text-white">{player.name}</h2>
          <p className="mt-1 flex items-center justify-center gap-1.5 text-xs text-white/50">
            {isBlocker ? (
              <><span className="flex gap-px"><Hand className="h-3 w-3 -scale-x-100" /><Hand className="h-3 w-3" /></span> GIOCATORE DI MURO</>
            ) : (
              <><Shield className="h-3 w-3" /> DIFENSORE</>
            )}
          </p>
        </div>

        {/* XP bar */}
        <div className="mt-4">
          <div className="mb-1 flex justify-between text-xs text-white/50">
            <span>{player.xp} XP</span>
            <span>+{xpToNext} al prossimo livello</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-[var(--accent)] transition-all duration-500"
              style={{ width: `${xpPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* ── Rating row: AVG + GLK + STREAK ───────────────────────────────── */}
      <div
        className="grid grid-cols-3 divide-x bg-[var(--surface-2)]"
        style={{ borderBottom: "1px solid var(--border)", borderColor: "var(--border)" }}
      >
        <div className="flex flex-col items-center gap-0.5 py-4">
          <span className="text-3xl font-black text-[var(--accent)]">{avgDisplay}</span>
          <span className="text-xs text-[var(--muted-text)]">Media voti</span>
        </div>
        <div className="flex flex-col items-center gap-0.5 py-4">
          <span className="text-3xl font-black text-[var(--accent)]">{glicko}</span>
          <span className="text-xs text-[var(--muted-text)]">Glicko-2</span>
        </div>
        <div className="flex flex-col items-center gap-0.5 py-4">
          <span className="text-3xl font-black">{streak}</span>
          <span className="text-xs text-[var(--muted-text)]">Streak</span>
        </div>
      </div>

      {/* ── Badges ───────────────────────────────────────────────────────── */}
      {top3.length > 0 && (
        <div className="flex flex-wrap gap-2 bg-[var(--surface-1)] px-4 py-3">
          {top3.map(([badge, count]) => (
            <span
              key={badge}
              className="flex items-center gap-1 rounded-full bg-[var(--surface-3)] px-3 py-1 text-xs font-semibold text-white"
            >
              <span>{BADGE_EMOJIS[badge]}</span>
              {BADGE_LABELS[badge]}
              {count > 1 && (
                <span className="ml-1 font-black text-[var(--accent)]">×{count}</span>
              )}
            </span>
          ))}
        </div>
      )}

      {/* ── Tournament stats grid ─────────────────────────────────────────── */}
      <div
        className="grid grid-cols-4 divide-x bg-[var(--surface-1)]"
        style={{ borderTop: "1px solid var(--border)", borderColor: "var(--border)" }}
      >
        {[
          { icon: TrendingUp, label: "Vinte",  value: player.matchesWon,    color: "text-[var(--live)]" },
          { icon: Activity,   label: "Perse",  value: player.matchesLost,   color: "text-[var(--danger)]" },
          { icon: Award,      label: "Win%",   value: `${player.winRatePct}%`, color: "text-[var(--completed)]" },
          { icon: Trophy,     label: "Tornei", value: player.tournamentsWon, color: "text-[var(--accent)]" },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="flex flex-col items-center gap-1 py-4">
            <Icon className={cn("h-4 w-4", color)} />
            <span className="text-xl font-black">{value}</span>
            <span className="text-xs text-[var(--muted-text)]">{label}</span>
          </div>
        ))}
      </div>

      {/* ── Recent tournaments ────────────────────────────────────────────── */}
      {player.registrations.length > 0 && (
        <div className="rounded-b-3xl bg-[var(--surface-2)] p-4">
          <p className="mb-3 text-xs font-bold uppercase tracking-wider text-[var(--muted-text)]">
            Tornei Recenti
          </p>
          <div className="space-y-2">
            {player.registrations.map((reg) => (
              <Link
                key={reg.id}
                href={`/tournaments/${reg.tournamentId}`}
                className="flex items-center justify-between rounded-xl bg-[var(--surface-3)] px-3 py-2.5 transition-colors hover:bg-[var(--surface-4)]"
              >
                <span className="text-sm font-semibold">{reg.tournament.name}</span>
                <StatusBadge status={reg.tournament.status as "DRAFT" | "LIVE" | "COMPLETED"} />
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
