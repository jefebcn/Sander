import Link from "next/link"
import { Trophy, Users, ChevronRight } from "lucide-react"
import { formatDayShort, relativeDay } from "@/lib/datetime"
import { Pill } from "@/components/ui/Pill"

export interface SpotlightTournament {
  id: string
  name: string
  date: Date
  location: string | null
  priceCents: number | null
  prizePool: string | null
  registered: number
  maxTeams: number | null
  open: boolean
}

/** The next tournament, shown like an event poster: date, prize, how full it is. */
export function TournamentSpotlight({ t }: { t: SpotlightTournament }) {
  const fillPct = t.maxTeams ? Math.min(100, Math.round((t.registered / t.maxTeams) * 100)) : null
  return (
    <Link
      href={`/tournaments/${t.id}`}
      className="pressable tone-compete relative block overflow-hidden rounded-[var(--radius-lg)] bg-[var(--surface-2)] p-5 ring-1 ring-[var(--tone-line)]"
    >
      <Trophy aria-hidden="true" className="pointer-events-none absolute -right-6 -top-4 h-36 w-36 rotate-12 text-white opacity-[0.05]" />
      <div className="relative flex items-center justify-between gap-2">
        <p className="eyebrow text-[var(--tone)]">Torneo in arrivo</p>
        {t.open ? <Pill tone="compete" live>Iscrizioni aperte</Pill> : <Pill tone="compete">{relativeDay(t.date)}</Pill>}
      </div>
      <p className="relative mt-2 font-display text-3xl font-extrabold uppercase leading-none text-white">{t.name}</p>
      <p className="relative mt-2 text-sm font-semibold text-[var(--muted-text)] first-letter:uppercase">
        {formatDayShort(t.date)}{t.location ? ` · ${t.location}` : ""}
      </p>

      <div className="relative mt-4 grid grid-cols-3 gap-2">
        <div className="rounded-[var(--radius-sm)] bg-black/30 p-3">
          <p className="text-xs font-bold uppercase text-[var(--muted-text)]">Quota</p>
          <p className="num text-xl text-white">{t.priceCents ? `${(t.priceCents / 100).toFixed(0)} €` : "Gratis"}</p>
        </div>
        <div className="col-span-2 rounded-[var(--radius-sm)] bg-black/30 p-3">
          <p className="text-xs font-bold uppercase text-[var(--muted-text)]">Premio</p>
          <p className="truncate text-base font-extrabold text-white">{t.prizePool ?? "Gloria e classifica"}</p>
        </div>
      </div>

      <div className="relative mt-4 flex items-center gap-3">
        <Users className="h-4 w-4 shrink-0 text-[var(--tone)]" aria-hidden="true" />
        {fillPct !== null ? (
          <>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-black/30" aria-hidden="true">
              <div className="xp-bar-fill h-full rounded-full bg-[var(--compete)]" style={{ width: `${Math.max(4, fillPct)}%` }} />
            </div>
            <span className="text-sm font-bold text-white">{t.registered}/{t.maxTeams}</span>
          </>
        ) : (
          <span className="flex-1 text-sm font-bold text-white">{t.registered} iscritti</span>
        )}
        <ChevronRight className="h-5 w-5 text-[var(--tone)]" aria-hidden="true" />
      </div>
    </Link>
  )
}
