import { Calendar, MapPin, Clock, Trophy, Users, Info, Ticket, Beer, Gauge } from "lucide-react"
import { formatPrice } from "@/lib/utils"
import { seatLimit } from "@/lib/tournament/capacity"
import { TournamentPriceBadge } from "./TournamentPriceBadge"
import { hasTimeOfDay } from "@/lib/datetime"

type Tournament = {
  date: Date | string
  type: string
  location: string | null
  description: string | null
  registrationDeadline: Date | string | null
  prizePool: string | null
  prize2nd: string | null
  prize3rd: string | null
  priceCents: number | null
  spectatorPriceCents: number | null
  priceCurrency: string
  skillLevel: string | null
  gender: string | null
  maxTeams: number | null
  status: string
}

const TZ = "Europe/Rome"

function formatDateTime(d: Date | string) {
  const date = new Date(d)
  const day = date.toLocaleDateString("it-IT", { timeZone: TZ, weekday: "long", day: "numeric", month: "long", year: "numeric" })
  if (!hasTimeOfDay(date)) return day
  const time = date.toLocaleTimeString("it-IT", { timeZone: TZ, hour: "2-digit", minute: "2-digit" })
  return `${day} · ore ${time}`
}

function Row({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 border-b border-[var(--border)] px-4 py-3 last:border-b-0">
      <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center text-[var(--tone)]" aria-hidden="true">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-bold uppercase tracking-wide text-[var(--muted-text)]">{label}</p>
        <div className="mt-0.5 break-words text-base text-white">{children}</div>
      </div>
    </div>
  )
}

/**
 * Everything the list card shows (and more) for the detail page: date & time,
 * place, fee, prizes, deadline, level, seats and rules.
 */
export function TournamentInfoCard({
  tournament: t,
  playerCount,
}: {
  tournament: Tournament
  /** Non-spectator registrations currently on the list. */
  playerCount: number
}) {
  const deadline = t.registrationDeadline ? new Date(t.registrationDeadline) : null
  const deadlinePassed = deadline ? deadline.getTime() < Date.now() : false
  const seats = seatLimit(t.type, t.maxTeams)
  const level = [t.skillLevel, t.gender].filter(Boolean).join(" · ")
  const hasPrizes = Boolean(t.prizePool || t.prize2nd || t.prize3rd)

  return (
    <section aria-label="Informazioni torneo" className="tone-compete mx-4 mb-4 space-y-2">
      <div className="overflow-hidden rounded-2xl bg-[var(--surface-1)]">
        <Row icon={<Calendar className="h-5 w-5" />} label="Quando">
          <span className="capitalize">{formatDateTime(t.date)}</span>
        </Row>

        {t.location && (
          <Row icon={<MapPin className="h-5 w-5" />} label="Dove">
            {t.location}
          </Row>
        )}

        <Row icon={<Ticket className="h-5 w-5" />} label="Quota iscrizione">
          <TournamentPriceBadge priceCents={t.priceCents} currency={t.priceCurrency} />
        </Row>

        {(t.spectatorPriceCents ?? 0) > 0 && (
          <Row icon={<Beer className="h-5 w-5" />} label="Quota spettatori">
            {formatPrice(t.spectatorPriceCents, t.priceCurrency)}
          </Row>
        )}

        {t.status === "DRAFT" && deadline && (
          <Row icon={<Clock className="h-5 w-5" />} label="Iscrizioni entro">
            <span className={deadlinePassed ? "text-[var(--danger)]" : undefined}>
              <span className="capitalize">{formatDateTime(deadline)}</span>
              {deadlinePassed && " · chiuse"}
            </span>
          </Row>
        )}

        {hasPrizes && (
          <Row icon={<Trophy className="h-5 w-5" />} label="Premi">
            <ul className="flex flex-col gap-0.5">
              {t.prizePool && <li>1° posto · {t.prizePool}</li>}
              {t.prize2nd && <li>2° posto · {t.prize2nd}</li>}
              {t.prize3rd && <li>3° posto · {t.prize3rd}</li>}
            </ul>
          </Row>
        )}

        <Row icon={<Gauge className="h-5 w-5" />} label="Livello">
          {level || "Tutti i livelli"}
        </Row>

        <Row icon={<Users className="h-5 w-5" />} label="Posti">
          {seats != null
            ? `${playerCount}/${seats} giocatori${t.maxTeams && seats !== t.maxTeams ? ` (${t.maxTeams} squadre)` : ""}`
            : `${playerCount} ${playerCount === 1 ? "giocatore" : "giocatori"} · nessun limite`}
        </Row>
      </div>

      {t.description && (
        <div className="overflow-hidden rounded-2xl bg-[var(--surface-1)]">
          <Row icon={<Info className="h-5 w-5" />} label="Regolamento">
            <p className="whitespace-pre-wrap">{t.description}</p>
          </Row>
        </div>
      )}
    </section>
  )
}
