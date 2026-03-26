import Link from "next/link"
import { MapPin, Users, Euro } from "lucide-react"
import { SessionStatusBadge } from "./SessionStatusBadge"
import { cn } from "@/lib/utils"

const FORMAT_LABEL: Record<string, string> = {
  TWO_VS_TWO: "2 vs 2",
  THREE_VS_THREE: "3 vs 3",
  FOUR_VS_FOUR: "4 vs 4",
}

interface SessionCardProps {
  session: {
    id: string
    title: string
    location: string
    date: Date
    format: string
    maxPlayers: number
    courtCost: number | null
    status: "OPEN" | "FULL" | "COMPLETED" | "CANCELLED"
    organizer: { name: string }
    _count: { participants: number }
  }
}

export function SessionCard({ session }: SessionCardProps) {
  const spotsLeft = session.maxPlayers - session._count.participants
  const costPerPlayer =
    session.courtCost && session._count.participants > 0
      ? Math.ceil(session.courtCost / session.maxPlayers / 100)
      : null

  const dateObj = new Date(session.date)
  const timeStr = dateObj.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })
  const dateStr = dateObj.toLocaleDateString("it-IT", { day: "2-digit", month: "short" })

  return (
    <Link
      href={`/sessions/${session.id}`}
      className="flex min-h-[5rem] items-center gap-4 rounded-2xl bg-[var(--surface-1)] px-4 py-3 transition-colors hover:bg-[var(--surface-2)] active:scale-[0.99]"
    >
      {/* Date column */}
      <div className="flex w-12 shrink-0 flex-col items-center">
        <span className="text-lg font-black leading-none text-[var(--accent)]">{timeStr}</span>
        <span className="text-xs text-[var(--muted-text)]">{dateStr}</span>
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <p className="truncate font-bold">{session.title}</p>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-[var(--muted-text)]">
          <span className="flex items-center gap-1">
            <MapPin className="h-3 w-3" aria-hidden="true" />
            {session.location}
          </span>
          <span className="flex items-center gap-1">
            <Users className="h-3 w-3" aria-hidden="true" />
            {FORMAT_LABEL[session.format]}
          </span>
        </div>
      </div>

      {/* Right side */}
      <div className="flex shrink-0 flex-col items-end gap-1.5">
        <SessionStatusBadge status={session.status} />
        <div className="flex items-center gap-2 text-xs">
          {session.status === "OPEN" && (
            <span
              className={cn(
                "rounded-full px-2 py-0.5 font-semibold",
                spotsLeft <= 1
                  ? "bg-[var(--warning)]/15 text-[var(--warning)]"
                  : "bg-[var(--surface-2)] text-[var(--muted-text)]",
              )}
            >
              {spotsLeft} {spotsLeft === 1 ? "posto" : "posti"}
            </span>
          )}
          {costPerPlayer !== null && (
            <span className="flex items-center gap-0.5 text-[var(--muted-text)]">
              <Euro className="h-3 w-3" />
              {costPerPlayer}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}
