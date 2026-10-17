import Link from "next/link"
import { MapPin, Coins } from "lucide-react"
import { formatTime, formatDayShort, daysFromNow } from "@/lib/datetime"
import { Pill } from "@/components/ui/Pill"
import { PlayerSlots, type SlotPlayer } from "@/components/ui/PlayerSlots"
import { CrestHeading } from "./Crest"
import { QuickJoinButton } from "./QuickJoinButton"

export interface OpenMatch {
  id: string
  title: string
  location: string
  date: Date
  spotsLeft: number
  maxPlayers: number
  players: SlotPlayer[]
  familiar?: boolean
  /** What a seat costs, shown on the card; null when free. */
  price: string | null
  /** Credits debited on join: those open the match page instead of joining. */
  creditCost: number
}

/**
 * Swipeable strip of joinable matches: see a free spot, tap "Entra", you're
 * in. Full or paid matches open the match page instead, where the waitlist
 * and the cost are explained.
 */
export function OpenMatchesRail({
  matches,
  title = "Partite aperte",
  eyebrow = "Posti liberi",
}: {
  matches: OpenMatch[]
  title?: string
  eyebrow?: string
}) {
  if (matches.length === 0) return null
  return (
    <section className="flex flex-col gap-3" aria-labelledby="open-title">
      <CrestHeading id="open-title" eyebrow={eyebrow} title={title} action={{ href: "/sessions", label: "Tutte" }} />
      <div className="rail -mx-4 px-4 pb-1" style={{ scrollPaddingInline: "1rem" }}>
        {matches.map((m) => {
          const n = daysFromNow(m.date)
          const full = m.spotsLeft <= 0
          const oneTap = !full && m.creditCost === 0
          return (
            <div
              key={m.id}
              className="flex w-[14rem] flex-col gap-3 rounded-[var(--radius-lg)] bg-[var(--surface-2)] p-3 ring-1 ring-[var(--crest-hair)]"
            >
              <Link href={`/sessions/${m.id}`} className="pressable flex flex-col gap-3 rounded-[var(--radius-md)] p-1">
                <span className="flex items-center justify-between">
                  <span className="text-sm font-bold text-[var(--muted-text)] first-letter:uppercase">
                    {n === 0 ? "Oggi" : n === 1 ? "Domani" : formatDayShort(m.date)}
                  </span>
                  {full ? (
                    <span className="rounded-full bg-[var(--surface-4)] px-2.5 py-1 text-xs font-extrabold uppercase tracking-wide text-white">
                      Al completo
                    </span>
                  ) : (
                    <Pill tone="play" live>{m.spotsLeft} {m.spotsLeft === 1 ? "posto" : "posti"}</Pill>
                  )}
                </span>
                <span className="num text-4xl leading-none text-white">{formatTime(m.date)}</span>
                <span className="overflow-hidden">
                  <PlayerSlots players={m.players} total={m.maxPlayers} size={m.maxPlayers > 6 ? "sm" : "md"} />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-base font-extrabold text-white">{m.title}</span>
                  <span className="flex items-center gap-1 truncate text-sm text-[var(--muted-text)]">
                    <MapPin className="h-4 w-4 shrink-0 text-[var(--accent)]" aria-hidden="true" />
                    <span className="truncate">{m.location}</span>
                  </span>
                  {m.price && (
                    <span className="mt-0.5 flex items-center gap-1 truncate text-sm text-[var(--muted-text)]">
                      <Coins className="h-4 w-4 shrink-0 text-[var(--accent)]" aria-hidden="true" />
                      <span className="truncate">{m.price}</span>
                    </span>
                  )}
                </span>
              </Link>
              {oneTap ? (
                <QuickJoinButton sessionId={m.id} context={`${m.title}, ${formatTime(m.date)}`} />
              ) : (
                <Link
                  href={`/sessions/${m.id}`}
                  className="pressable flex min-h-[3.5rem] items-center justify-center gap-1.5 rounded-[var(--radius-md)] bg-[var(--surface-3)] text-base font-extrabold text-white ring-1 ring-[var(--crest-hair)]"
                >
                  {full ? "Mettiti in lista" : "Entra con i crediti"}
                </Link>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}
