import Link from "next/link"
import { MapPin, Calendar, Clock, Users } from "lucide-react"
import { StatusBadge } from "@/components/tournament/StatusBadge"

const TYPE_LABEL: Record<string, string> = {
  KING_OF_THE_BEACH: "King of the Beach",
  BRACKETS:          "Classico",
  ROUND_ROBIN:       "Round Robin",
  DOUBLE_ELIMINATION:"Doppia Elim.",
  CHICECE:           "Chicece",
}

interface TournamentCardProps {
  tournament: {
    id: string
    name: string
    date: Date | string
    location: string | null
    type: string
    status: string
    coverUrl: string | null
    skillLevel: string | null
    gender: string | null
    maxTeams: number | null
    priceCents: number | null
    priceCurrency: string
    isOpenForRegistration: boolean
    registrationDeadline: Date | string | null
    registrations: { id: string }[]
  }
}

export function TournamentCard({ tournament: t }: TournamentCardProps) {
  const date = new Date(t.date)
  const dateStr = date.toLocaleDateString("it-IT", { timeZone: "Europe/Rome", day: "2-digit", month: "short", year: "numeric" })
  const timeStr = date.toLocaleTimeString("it-IT", { timeZone: "Europe/Rome", hour: "2-digit", minute: "2-digit" })

  const deadline = t.registrationDeadline ? new Date(t.registrationDeadline) : null
  const deadlineStr = deadline
    ? `${deadline.toLocaleDateString("it-IT", { timeZone: "Europe/Rome", day: "2-digit", month: "2-digit", year: "numeric" })} - ${deadline.toLocaleTimeString("it-IT", { timeZone: "Europe/Rome", hour: "2-digit", minute: "2-digit" })}`
    : null

  const formula = [TYPE_LABEL[t.type] ?? t.type, t.gender].filter(Boolean).join(" · ")

  const open = t.isOpenForRegistration && t.status === "DRAFT"
  const price = t.priceCents ? `${(t.priceCents / 100).toFixed(t.priceCents % 100 ? 2 : 0)} €` : "Gratis"

  return (
    <Link
      href={`/tournaments/${t.id}`}
      className={
        "pressable tone-compete block overflow-hidden rounded-[var(--radius-lg)] bg-[var(--surface-2)] shadow-[var(--shadow-card)] " +
        (open ? "ring-1 ring-[var(--tone-line)]" : "")
      }
    >
      {t.coverUrl && (
        <div className="relative h-40 w-full">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={t.coverUrl} alt="" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--surface-2)] via-black/10 to-transparent" />
          <div className="absolute right-3 top-3">
            <StatusBadge status={t.status as "DRAFT" | "LIVE" | "COMPLETED"} />
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="eyebrow text-[var(--tone)]">{formula}</p>
            <h2 className="mt-1 font-display text-2xl font-extrabold uppercase leading-[0.95] text-white line-clamp-2">
              {t.name}
            </h2>
          </div>
          {!t.coverUrl && <StatusBadge status={t.status as "DRAFT" | "LIVE" | "COMPLETED"} />}
        </div>

        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-[var(--muted-text)]">
          <span className="flex items-center gap-1.5 capitalize">
            <Calendar className="h-4 w-4 text-[var(--tone)]" aria-hidden="true" />
            {dateStr} · {timeStr}
          </span>
          {t.location && (
            <span className="flex min-w-0 items-center gap-1.5">
              <MapPin className="h-4 w-4 shrink-0 text-[var(--tone)]" aria-hidden="true" />
              <span className="truncate">{t.location}</span>
            </span>
          )}
        </p>

        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-[var(--radius-sm)] bg-black/25 p-3">
            <p className="flex items-center gap-1 text-xs font-bold uppercase text-[var(--muted-text)]">
              <Users className="h-3.5 w-3.5" aria-hidden="true" /> Iscritti
            </p>
            <p className="num text-xl text-white">{t.registrations.length}</p>
          </div>
          <div className="rounded-[var(--radius-sm)] bg-black/25 p-3">
            <p className="text-xs font-bold uppercase text-[var(--muted-text)]">Quota</p>
            <p className="num text-xl text-white">{price}</p>
          </div>
          <div className="rounded-[var(--radius-sm)] bg-black/25 p-3">
            <p className="text-xs font-bold uppercase text-[var(--muted-text)]">Livello</p>
            <p className="truncate text-base font-extrabold text-white">{t.skillLevel ?? "Tutti"}</p>
          </div>
        </div>

        {deadlineStr && open && (
          <p className="flex items-center gap-1.5 text-sm text-[var(--muted-text)]">
            <Clock className="h-4 w-4 text-[var(--tone)]" aria-hidden="true" />
            Iscrizioni entro {deadlineStr}
          </p>
        )}
      </div>

      {open && (
        <div className="flex min-h-[3.5rem] items-center justify-between bg-[var(--tone-soft)] px-5">
          <span className="flex items-center gap-2 text-sm font-extrabold uppercase tracking-wide text-[var(--tone)]">
            <span className="live-dot h-2 w-2 rounded-full bg-current" aria-hidden="true" />
            Iscrizioni aperte
          </span>
          <span className="text-sm font-extrabold text-white">Iscriviti →</span>
        </div>
      )}
    </Link>
  )
}
