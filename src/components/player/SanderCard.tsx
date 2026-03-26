import { Shield, Swords, Trophy, TrendingUp, Award, Activity } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { StatusBadge } from "@/components/tournament/StatusBadge"
import type { Player, TournamentRegistration, Tournament } from "@/generated/prisma/client"

type PlayerWithHistory = Player & {
  registrations: (TournamentRegistration & { tournament: Tournament })[]
  streak?: number
}

interface SanderCardProps {
  player: PlayerWithHistory
}

export function SanderCard({ player }: SanderCardProps) {
  const isBlocker = player.preferredRole === "BLOCKER"
  const avgDisplay = player.avgRating > 0 ? (player.avgRating / 10).toFixed(1) : "—"
  const xpToNext = 100 - (player.xp % 100)
  const xpPct = Math.round(((player.xp % 100) / 100) * 100)
  const streak = player.streak ?? 0

  return (
    <div className="overflow-hidden rounded-3xl">
      {/* Card header */}
      <div
        className={cn(
          "relative px-6 pt-8 pb-10",
          isBlocker
            ? "bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900"
            : "bg-gradient-to-br from-orange-900 via-orange-800 to-amber-900",
        )}
      >
        <div className="absolute -top-8 -right-8 h-32 w-32 rounded-full bg-white/5" />
        <div className="absolute -bottom-4 -left-4 h-20 w-20 rounded-full bg-white/5" />

        {/* Top row: brand + role badge */}
        <div className="relative mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-widest text-white/60">
              ☀ Sander
            </span>
            {/* Level badge */}
            <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs font-black text-white">
              Lv.{player.level}
            </span>
          </div>
          <span
            className={cn(
              "flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold",
              isBlocker
                ? "bg-blue-500/30 text-blue-200"
                : "bg-orange-500/30 text-orange-200",
            )}
          >
            {isBlocker ? (
              <><Swords className="h-3 w-3" /> ATTACCANTE</>
            ) : (
              <><Shield className="h-3 w-3" /> DIFENSORE</>
            )}
          </span>
        </div>

        {/* Level number + avatar */}
        <div className="relative mb-4 flex items-end justify-center gap-4">
          {/* Big level */}
          <div className="absolute -left-0 bottom-0 text-left">
            <p className="text-xs font-bold uppercase tracking-widest text-white/50">Level</p>
            <p className="text-5xl font-black leading-none text-white">{player.level}</p>
          </div>

          {/* Avatar */}
          <div
            className={cn(
              "flex h-24 w-24 items-center justify-center rounded-full text-3xl font-black",
              isBlocker ? "bg-blue-600 text-blue-100" : "bg-orange-600 text-orange-100",
            )}
          >
            {player.name.slice(0, 2).toUpperCase()}
          </div>

          {/* Trophy count */}
          {player.tournamentsWon > 0 && (
            <div className="absolute -right-0 bottom-0 flex h-8 w-8 items-center justify-center rounded-full bg-[var(--accent)] text-xs font-black text-black">
              {player.tournamentsWon}
            </div>
          )}
        </div>

        {/* Name */}
        <div className="text-center">
          <h2 className="text-3xl font-black tracking-tight text-white">{player.name}</h2>
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

      {/* Social stats row: AVG + STREAK */}
      <div className="grid grid-cols-2 divide-x divide-[var(--border)] bg-[var(--surface-2)]">
        <div className="flex flex-col items-center gap-0.5 py-4">
          <span className="text-3xl font-black text-[var(--accent)]">{avgDisplay}</span>
          <span className="text-xs text-[var(--muted-text)]">AVG Rating</span>
        </div>
        <div className="flex flex-col items-center gap-0.5 py-4">
          <div className="mb-1 flex items-center gap-1.5">
            <span className="text-3xl font-black">{streak}</span>
          </div>
          {/* STREAK bar */}
          <div className="flex gap-0.5">
            {Array.from({ length: 10 }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  "h-2 w-2 rounded-sm",
                  i < streak ? "bg-[var(--live)]" : "bg-[var(--surface-3)]",
                )}
              />
            ))}
          </div>
          <span className="mt-0.5 text-xs text-[var(--muted-text)]">Streak (4 sett.)</span>
        </div>
      </div>

      {/* Tournament stats grid */}
      <div className="grid grid-cols-4 divide-x divide-[var(--border)] bg-[var(--surface-1)]">
        {[
          { icon: TrendingUp, label: "Vinte", value: player.matchesWon, color: "text-[var(--live)]" },
          { icon: Activity, label: "Perse", value: player.matchesLost, color: "text-[var(--danger)]" },
          { icon: Award, label: "Win%", value: `${player.winRatePct}%`, color: "text-[var(--completed)]" },
          { icon: Trophy, label: "Tornei", value: player.tournamentsWon, color: "text-[var(--accent)]" },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="flex flex-col items-center gap-1 py-4">
            <Icon className={cn("h-4 w-4", color)} />
            <span className="text-xl font-black">{value}</span>
            <span className="text-xs text-[var(--muted-text)]">{label}</span>
          </div>
        ))}
      </div>

      {/* Recent tournaments */}
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
