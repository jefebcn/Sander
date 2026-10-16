import Link from "next/link"
import { MapPin, MessageCircle } from "lucide-react"
import { formatTime, formatDayShort, daysFromNow } from "@/lib/datetime"
import { PlayerSlots, type SlotPlayer } from "@/components/ui/PlayerSlots"

export interface NextMatch {
  id: string
  title: string
  location: string
  city: string | null
  date: Date
  players: number
  maxPlayers: number
  faces: SlotPlayer[]
}

/** "Oggi", "Domani", "Sab 18 ott" */
export function dayWord(d: Date): string {
  const n = daysFromNow(d)
  if (n === 0) return "Oggi"
  if (n === 1) return "Domani"
  const s = formatDayShort(d)
  return s.charAt(0).toUpperCase() + s.slice(1)
}

/**
 * The match you already said yes to: when, where, who — and the two things you
 * do right before it, open the chat and get directions.
 */
export function NextMatchCard({ match }: { match: NextMatch }) {
  const place = [match.location, match.city].filter(Boolean).join(" · ")
  const maps = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place)}`
  return (
    <section className="tone-play flex flex-col gap-3 rounded-[var(--radius-lg)] bg-[var(--surface-2)] p-[1.125rem]">
      <p className="eyebrow text-[var(--accent)]">La tua prossima partita</p>
      <Link href={`/sessions/${match.id}`} className="flex items-end justify-between gap-3">
        <span className="min-w-0">
          <span className="block whitespace-nowrap font-display text-4xl font-extrabold uppercase leading-[0.95] text-white">
            {dayWord(match.date)} {formatTime(match.date)}
          </span>
          <span className="mt-1.5 block truncate text-base text-white/75">{place}</span>
        </span>
        <PlayerSlots players={match.faces} total={match.maxPlayers} size="sm" className="shrink-0 pb-1" />
      </Link>
      <div className="grid grid-cols-2 gap-2">
        <Link
          href={`/sessions/${match.id}#chat`}
          className="pressable flex min-h-[3.25rem] items-center justify-center gap-2 rounded-[var(--radius-md)] bg-[var(--surface-4)] text-base font-bold text-white"
        >
          <MessageCircle className="h-5 w-5 text-[var(--social)]" aria-hidden="true" /> Chat
        </Link>
        <a
          href={maps}
          target="_blank"
          rel="noopener noreferrer"
          className="pressable flex min-h-[3.25rem] items-center justify-center gap-2 rounded-[var(--radius-md)] bg-[var(--surface-4)] text-base font-bold text-white"
        >
          <MapPin className="h-5 w-5 text-[var(--sunset)]" aria-hidden="true" /> Portami lì
        </a>
      </div>
    </section>
  )
}
