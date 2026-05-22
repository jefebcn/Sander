import Link from "next/link"
import { MapPin, Calendar, Clock, Users, Trophy } from "lucide-react"
import { StatusBadge } from "@/components/tournament/StatusBadge"
import { TournamentPriceBadge } from "@/components/tournament/TournamentPriceBadge"

const TYPE_LABEL: Record<string, string> = {
  KING_OF_THE_BEACH: "King of the Beach",
  BRACKETS:          "Classico",
  ROUND_ROBIN:       "Round Robin",
  DOUBLE_ELIMINATION:"Doppia Elim.",
  CHICECE:           "Chicece",
}

const LEVEL_COLORS: Record<string, string | null> = {
  "D":          "#22c55e",
  "C":          "#84cc16",
  "C/D":        "#84cc16",
  "B":          "#eab308",
  "B/C":        "#eab308",
  "B/C/D":      "#f97316",
  "A":          "#ef4444",
  "A/B":        "#f97316",
  "A/B/C":      "#f97316",
  "Open":       null,
  "Multilevel": null,
}

function LevelBar({ level }: { level: string }) {
  const solidColor = LEVEL_COLORS[level]
  return (
    <div className="flex items-center gap-2">
      <div
        className="h-2 w-20 rounded-full overflow-hidden"
        style={{
          background: solidColor
            ? `linear-gradient(to right, ${solidColor}80, ${solidColor})`
            : "linear-gradient(to right, #22c55e, #eab308, #ef4444)",
        }}
      />
      <span className="text-xs font-bold text-white">{level}</span>
    </div>
  )
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
  const dateStr = date.toLocaleDateString("it-IT", { day: "2-digit", month: "short", year: "numeric" })
  const timeStr = date.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })

  const deadline = t.registrationDeadline ? new Date(t.registrationDeadline) : null
  const deadlineStr = deadline
    ? `${deadline.toLocaleDateString("it-IT", { day: "2-digit", month: "2-digit", year: "numeric" })} - ${deadline.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })}`
    : null

  const formula = [TYPE_LABEL[t.type] ?? t.type, t.gender].filter(Boolean).join(" · ")

  return (
    <Link href={`/tournaments/${t.id}`} className="block rounded-2xl overflow-hidden bg-[var(--surface-1)] active:opacity-80">
      {/* Cover image */}
      {t.coverUrl ? (
        <div className="relative h-44 w-full">
          <img
            src={t.coverUrl}
            alt={t.name}
            className="h-full w-full object-cover"
          />
          {/* Gradient overlay with date + status */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between">
            <div className="flex items-center gap-1.5 text-white/90">
              <Calendar className="h-3.5 w-3.5" />
              <span className="text-xs font-bold">{dateStr}</span>
            </div>
            <StatusBadge status={t.status as "DRAFT" | "LIVE" | "COMPLETED"} />
          </div>
        </div>
      ) : (
        /* No cover — minimal header */
        <div className="flex items-center justify-between px-4 pt-4">
          <Trophy className="h-5 w-5 text-[var(--accent)]" />
          <StatusBadge status={t.status as "DRAFT" | "LIVE" | "COMPLETED"} />
        </div>
      )}

      {/* Info body */}
      <div className="p-4 flex flex-col gap-3">
        {/* Name */}
        <h2 className="text-base font-black text-white leading-snug line-clamp-2">{t.name}</h2>

        {/* Date + Time + Location */}
        <div className="flex flex-col gap-1.5">
          {!t.coverUrl && (
            <div className="flex items-center gap-2 text-sm text-[var(--muted-text)]">
              <Calendar className="h-3.5 w-3.5 shrink-0 text-[var(--accent)]" />
              <span>{dateStr}</span>
              <Clock className="h-3.5 w-3.5 shrink-0 text-[var(--accent)]" />
              <span>{timeStr}</span>
            </div>
          )}
          {t.coverUrl && (
            <div className="flex items-center gap-2 text-sm text-[var(--muted-text)]">
              <Clock className="h-3.5 w-3.5 shrink-0 text-[var(--accent)]" />
              <span>{timeStr}</span>
            </div>
          )}
          {t.location && (
            <div className="flex items-center gap-2 text-sm text-[var(--muted-text)]">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-[var(--accent)]" />
              <span className="truncate">{t.location}</span>
            </div>
          )}
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-2">
          {/* Participants */}
          <div className="rounded-xl bg-[var(--surface-2)] px-3 py-2.5 flex flex-col gap-0.5">
            <div className="flex items-center gap-1 text-[0.6rem] font-bold uppercase tracking-wider text-[var(--muted-text)]">
              <Users className="h-3 w-3" />
              Partecipanti
            </div>
            <p className="text-base font-black text-white">
              {t.registrations.length}
            </p>
          </div>

          {/* Deadline */}
          <div className="rounded-xl bg-[var(--surface-2)] px-3 py-2.5 flex flex-col gap-0.5">
            <p className="text-[0.6rem] font-bold uppercase tracking-wider text-[var(--muted-text)]">
              {deadlineStr ? "Termine iscrizioni" : "Prezzo iscrizione"}
            </p>
            {deadlineStr ? (
              <p className="text-xs font-black text-white leading-tight">{deadlineStr}</p>
            ) : (
              <TournamentPriceBadge priceCents={t.priceCents} currency={t.priceCurrency} />
            )}
          </div>

          {/* Formula */}
          <div className="rounded-xl bg-[var(--surface-2)] px-3 py-2.5 flex flex-col gap-0.5">
            <p className="text-[0.6rem] font-bold uppercase tracking-wider text-[var(--muted-text)]">Formula</p>
            <p className="text-xs font-black text-white leading-tight">{formula}</p>
          </div>

          {/* Level */}
          <div className="rounded-xl bg-[var(--surface-2)] px-3 py-2.5 flex flex-col gap-0.5">
            <p className="text-[0.6rem] font-bold uppercase tracking-wider text-[var(--muted-text)]">Livello</p>
            {t.skillLevel ? (
              <LevelBar level={t.skillLevel} />
            ) : (
              <div className="h-2 w-20 rounded-full bg-gradient-to-r from-green-500 via-yellow-400 to-red-500 opacity-30" />
            )}
          </div>
        </div>

        {/* Open registration CTA */}
        {t.isOpenForRegistration && t.status === "DRAFT" && (
          <div className="flex items-center justify-between rounded-xl bg-[var(--accent)]/10 border border-[var(--accent)]/20 px-3 py-2">
            <span className="text-xs font-black uppercase tracking-wider text-[var(--accent)]">
              Iscrizioni aperte
            </span>
            <TournamentPriceBadge priceCents={t.priceCents} currency={t.priceCurrency} />
          </div>
        )}
      </div>
    </Link>
  )
}
