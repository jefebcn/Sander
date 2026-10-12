import Link from "next/link"
import { MapPin } from "lucide-react"
import { formatTime, formatDayShort, daysFromNow } from "@/lib/datetime"
import { Pill } from "@/components/ui/Pill"
import { SectionHeader } from "@/components/ui/SectionHeader"
import { PlayerSlots, type SlotPlayer } from "@/components/ui/PlayerSlots"

export interface OpenMatch {
  id: string
  title: string
  location: string
  date: Date
  spotsLeft: number
  maxPlayers: number
  players: SlotPlayer[]
  familiar?: boolean
}

/** Swipeable strip of joinable matches: see a free spot, tap, you're in. */
export function OpenMatchesRail({ matches }: { matches: OpenMatch[] }) {
  if (matches.length === 0) return null
  return (
    <section className="flex flex-col gap-3">
      <SectionHeader eyebrow="Posti liberi" title="Partite aperte" tone="play" action={{ href: "/sessions", label: "Tutte" }} />
      <div className="rail -mx-4 px-4 pb-1" style={{ scrollPaddingInline: "1rem" }}>
        {matches.map((m) => {
          const n = daysFromNow(m.date)
          const full = m.spotsLeft <= 0
          return (
            <Link
              key={m.id}
              href={`/sessions/${m.id}`}
              className="pressable tone-play flex w-[13.5rem] flex-col gap-3 rounded-[var(--radius-lg)] bg-[var(--surface-2)] p-4 shadow-[var(--shadow-card)] active:bg-[var(--surface-3)]"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold capitalize text-[var(--muted-text)]">
                  {n === 0 ? "Oggi" : n === 1 ? "Domani" : formatDayShort(m.date)}
                </span>
                {full ? (
                  <Pill tone="sand">Lista d&apos;attesa</Pill>
                ) : (
                  <Pill tone="play" live>{m.spotsLeft} {m.spotsLeft === 1 ? "posto" : "posti"}</Pill>
                )}
              </div>
              <p className="num text-4xl leading-none text-white">{formatTime(m.date)}</p>
              <PlayerSlots players={m.players} total={m.maxPlayers} />
              <div className="min-w-0">
                <p className="truncate text-base font-extrabold text-white">{m.title}</p>
                <p className="flex items-center gap-1 truncate text-sm text-[var(--muted-text)]">
                  <MapPin className="h-4 w-4 shrink-0 text-[var(--accent)]" aria-hidden="true" />
                  {m.location}
                </p>
              </div>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
