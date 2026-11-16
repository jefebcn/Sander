import { Check, CalendarClock } from "lucide-react"
import { tournamentProgress, tournamentDeadlines, type ProgressInput } from "@/lib/tournament/preview"
import { hasTimeOfDay } from "@/lib/datetime"

const TZ = "Europe/Rome"

function when(d: Date): string {
  const day = d.toLocaleDateString("it-IT", { timeZone: TZ, weekday: "short", day: "numeric", month: "short" })
  if (!hasTimeOfDay(d)) return day
  return `${day}, ${d.toLocaleTimeString("it-IT", { timeZone: TZ, hour: "2-digit", minute: "2-digit" })}`
}

/**
 * Where the tournament is (iscrizioni → tabellone → si gioca → risultati) and
 * the dates that matter, with a countdown. Read-only, for everyone.
 */
export function TournamentProgress({ tournament }: { tournament: ProgressInput }) {
  const now = new Date()
  const steps = tournamentProgress(tournament, now)
  const deadlines = tournamentDeadlines(tournament, now)

  return (
    <section aria-label="Avanzamento torneo" className="tone-compete mx-4 mb-4 overflow-hidden rounded-2xl bg-[var(--surface-1)]">
      <p className="px-4 pt-3 text-xs font-bold uppercase tracking-wide text-[var(--muted-text)]">Avanzamento</p>
      <ol className="grid grid-cols-4 gap-1 px-3 pt-3 pb-4">
        {steps.map((s, i) => (
          <li key={s.key} className="relative flex flex-col items-center text-center" aria-current={s.state === "current" ? "step" : undefined}>
            {/* Line to the next step */}
            {i < steps.length - 1 && (
              <span
                aria-hidden="true"
                className={`absolute top-3.5 left-1/2 h-0.5 w-full ${s.state === "done" ? "bg-[var(--tone)]" : "bg-[var(--surface-4)]"}`}
              />
            )}
            <span
              className={`relative z-10 flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold ${
                s.state === "done"
                  ? "bg-[var(--tone)] text-[var(--accent-fg)]"
                  : s.state === "current"
                  ? "bg-[var(--surface-1)] text-[var(--tone)] ring-2 ring-[var(--tone)]"
                  : "bg-[var(--surface-3)] text-[var(--muted-text)]"
              }`}
            >
              {s.state === "done" ? <Check className="h-4 w-4" aria-hidden="true" /> : i + 1}
            </span>
            <span className={`mt-1.5 text-xs font-bold leading-tight ${s.state === "todo" ? "text-[var(--muted-text)]" : "text-white"}`}>
              {s.label}
            </span>
            <span className={`text-xs leading-tight ${s.state === "current" ? "text-[var(--tone)]" : "text-[var(--muted-text)]"}`}>
              {s.detail}
            </span>
          </li>
        ))}
      </ol>

      {deadlines.length > 0 && (
        <div className="border-t border-[var(--border)]">
          <p className="flex items-center gap-1.5 px-4 pt-3 text-xs font-bold uppercase tracking-wide text-[var(--muted-text)]">
            <CalendarClock className="h-4 w-4" aria-hidden="true" /> Scadenze · ora italiana
          </p>
          <ul className="pb-1">
            {deadlines.map((d) => (
              <li key={d.key} className="flex items-center justify-between gap-3 px-4 py-2.5">
                <div className="min-w-0">
                  <p className="text-base text-white">{d.label}</p>
                  <p className="text-sm capitalize text-[var(--muted-text)]">{when(d.at)}</p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold uppercase tracking-wide ${
                    d.past
                      ? "bg-[var(--surface-3)] text-[var(--muted-text)]"
                      : d.relative === "oggi" || d.relative === "domani" || d.relative === "in corso"
                      ? "bg-[var(--tone)] text-[var(--accent-fg)]"
                      : "bg-[var(--surface-3)] text-white"
                  }`}
                >
                  {d.relative}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}
