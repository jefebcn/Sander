import { Calendar, MapPin, Trophy, Clock, Users, Info } from "lucide-react"
import { formatDate, formatPrice } from "@/lib/utils"
import { TournamentPriceBadge } from "./TournamentPriceBadge"

type Tournament = {
  id: string
  name: string
  date: Date | string
  type: string
  location: string | null
  description: string | null
  registrationDeadline: Date | string | null
  prizePool: string | null
  priceCents: number | null
  priceCurrency: string
  _count?: { registrations: number }
}

function Row({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: React.ReactNode
}) {
  return (
    <div className="flex items-start gap-3 border-b border-[#2a2a2a] px-5 py-4 last:border-b-0">
      <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center text-[var(--accent)]">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs uppercase tracking-wide text-[var(--muted-text)]">{label}</p>
        <div className="mt-0.5 text-base text-white break-words">{value}</div>
      </div>
    </div>
  )
}

export function TournamentRegistrationRecap({ tournament }: { tournament: Tournament }) {
  const deadlinePassed =
    tournament.registrationDeadline &&
    new Date(tournament.registrationDeadline).getTime() < Date.now()

  return (
    <div className="flex flex-col gap-4">
      {/* Title + price badge */}
      <div className="flex items-start justify-between gap-3 px-5 pt-2">
        <div className="min-w-0">
          <h1 className="text-2xl font-black text-white break-words">{tournament.name}</h1>
          <p className="mt-1 text-sm text-[var(--muted-text)]">
            Iscrizione torneo
          </p>
        </div>
        <TournamentPriceBadge
          priceCents={tournament.priceCents}
          currency={tournament.priceCurrency}
          className="shrink-0"
        />
      </div>

      {/* Info card */}
      <div className="mx-4 overflow-hidden rounded-2xl bg-[var(--surface-1)]">
        <Row
          icon={<Calendar className="h-5 w-5" />}
          label="Data"
          value={formatDate(tournament.date)}
        />
        {tournament.location && (
          <Row
            icon={<MapPin className="h-5 w-5" />}
            label="Luogo"
            value={tournament.location}
          />
        )}
        {tournament.registrationDeadline && (
          <Row
            icon={<Clock className="h-5 w-5" />}
            label="Iscrizioni entro"
            value={
              <span className={deadlinePassed ? "text-[var(--danger)]" : ""}>
                {formatDate(tournament.registrationDeadline)}
                {deadlinePassed && " · chiuse"}
              </span>
            }
          />
        )}
        {tournament.prizePool && (
          <Row
            icon={<Trophy className="h-5 w-5" />}
            label="Montepremi"
            value={tournament.prizePool}
          />
        )}
        {tournament._count && (
          <Row
            icon={<Users className="h-5 w-5" />}
            label="Iscritti"
            value={`${tournament._count.registrations} giocator${tournament._count.registrations === 1 ? "e" : "i"}`}
          />
        )}
      </div>

      {/* Description */}
      {tournament.description && (
        <div className="mx-4 overflow-hidden rounded-2xl bg-[var(--surface-1)]">
          <div className="flex items-start gap-3 px-5 py-4">
            <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center text-[var(--accent)]">
              <Info className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs uppercase tracking-wide text-[var(--muted-text)]">
                Regolamento
              </p>
              <p className="mt-1 whitespace-pre-wrap text-base text-white">
                {tournament.description}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Price summary */}
      <div className="mx-4 rounded-2xl bg-[var(--surface-1)] p-5">
        <p className="text-xs uppercase tracking-wide text-[var(--muted-text)]">Totale</p>
        <p className="mt-1 text-3xl font-black text-[var(--accent)]">
          {formatPrice(tournament.priceCents, tournament.priceCurrency)}
        </p>
      </div>
    </div>
  )
}
