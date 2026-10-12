import Link from "next/link"
import { MapPin, Users, ChevronRight } from "lucide-react"
import { formatTime, formatDayShort, relativeDay, daysFromNow } from "@/lib/datetime"
import { Pill } from "@/components/ui/Pill"

export interface NextMatch {
  id: string
  title: string
  location: string
  date: Date
  players: number
  maxPlayers: number
}

/** The match you already said yes to — the most useful thing on the screen. */
export function NextMatchCard({ match }: { match: NextMatch }) {
  const soon = daysFromNow(match.date) <= 1
  const missing = Math.max(0, match.maxPlayers - match.players)
  return (
    <Link
      href={`/sessions/${match.id}`}
      className="pressable tone-play relative block overflow-hidden rounded-[var(--radius-lg)] bg-[var(--surface-2)] p-5 shadow-[var(--shadow-glow)]"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full opacity-25"
        style={{ background: "radial-gradient(circle, var(--accent) 0%, transparent 65%)" }}
      />
      <div className="relative flex items-center justify-between gap-3">
        <p className="eyebrow text-[var(--accent)]">La tua prossima partita</p>
        <Pill tone="play" live={soon}>{relativeDay(match.date)}</Pill>
      </div>
      <div className="relative mt-3 flex items-end gap-4">
        <div>
          <p className="num text-5xl leading-none text-white">{formatTime(match.date)}</p>
          <p className="mt-1 text-sm font-bold capitalize text-[var(--muted-text)]">{formatDayShort(match.date)}</p>
        </div>
        <div className="min-w-0 flex-1 pb-1">
          <p className="truncate text-base font-extrabold text-white">{match.title}</p>
          <p className="flex items-center gap-1 truncate text-sm text-[var(--muted-text)]">
            <MapPin className="h-4 w-4 shrink-0 text-[var(--accent)]" aria-hidden="true" />
            {match.location}
          </p>
        </div>
      </div>
      <div className="relative mt-4 flex items-center justify-between border-t border-[var(--border)] pt-3">
        <span className="flex items-center gap-1.5 text-sm font-bold text-white">
          <Users className="h-4 w-4 text-[var(--accent)]" aria-hidden="true" />
          {match.players}/{match.maxPlayers} giocatori
          {missing > 0 && <span className="font-semibold text-[var(--muted-text)]">· ne mancano {missing}</span>}
        </span>
        <ChevronRight className="h-5 w-5 text-[var(--accent)]" aria-hidden="true" />
      </div>
    </Link>
  )
}
