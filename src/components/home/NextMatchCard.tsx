import Link from "next/link"
import { MapPin, ChevronRight } from "lucide-react"
import { formatTime, formatDayShort, relativeDay, daysFromNow } from "@/lib/datetime"
import { Pill } from "@/components/ui/Pill"
import { PlayerSlots, type SlotPlayer } from "@/components/ui/PlayerSlots"

export interface NextMatch {
  id: string
  title: string
  location: string
  date: Date
  players: number
  maxPlayers: number
  faces: SlotPlayer[]
}

function hasStarted(date: Date): boolean {
  return new Date(date).getTime() <= Date.now()
}

/** The match you already said yes to — the most useful thing on the screen. */
export function NextMatchCard({ match }: { match: NextMatch }) {
  // Kept here for its first hour; after that it becomes "Com'è andata?".
  const started = hasStarted(match.date)
  const soon = daysFromNow(match.date) <= 1
  const missing = Math.max(0, match.maxPlayers - match.players)
  return (
    <Link
      href={`/sessions/${match.id}`}
      className="pressable tone-play relative block overflow-hidden rounded-[var(--radius-lg)] bg-[var(--surface-2)] p-5 shadow-[var(--shadow-card)]"
    >
      <div className="flex items-center justify-between gap-3">
        <p className="eyebrow text-[var(--accent)]">{started ? "La tua partita è in corso" : "La tua prossima partita"}</p>
        <Pill tone="play" live={soon}>{started ? "Adesso" : relativeDay(match.date)}</Pill>
      </div>
      <div className="mt-3 flex items-end gap-4">
        <div>
          <p className="num text-5xl leading-none text-white">{formatTime(match.date)}</p>
          <p className="mt-1 text-sm font-bold text-[var(--muted-text)] first-letter:uppercase">{formatDayShort(match.date)}</p>
        </div>
        <div className="min-w-0 flex-1 pb-1">
          <p className="truncate text-base font-extrabold text-white">{match.title}</p>
          <p className="flex items-center gap-1 truncate text-sm text-[var(--muted-text)]">
            <MapPin className="h-4 w-4 shrink-0 text-[var(--accent)]" aria-hidden="true" />
            {match.location}
          </p>
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between border-t border-[var(--crest-hair)] pt-3">
        <span className="flex items-center gap-3">
          <PlayerSlots players={match.faces} total={match.maxPlayers} />
          <span className="text-sm font-bold text-white">
            {missing === 0 ? "Al completo" : missing === 1 ? "Ne manca 1" : `Ne mancano ${missing}`}
          </span>
        </span>
        <ChevronRight className="h-5 w-5 text-[var(--accent)]" aria-hidden="true" />
      </div>
    </Link>
  )
}
