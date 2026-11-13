import { ChevronDown, Crown, Wand2 } from "lucide-react"
import { simulateTournament, type SimMatch, type SimRegistration, type SimTeam } from "@/lib/tournament/preview"

function TeamLine({ team, won }: { team: SimTeam | null; won: boolean }) {
  return (
    <div className={`flex items-center gap-2 px-3 py-2 ${won ? "text-white" : "text-[var(--muted-text)]"}`}>
      <span className="w-6 shrink-0 text-xs font-bold tabular-nums">{team ? `#${team.seed}` : ""}</span>
      <span className={`min-w-0 flex-1 truncate text-base ${won ? "font-bold" : ""}`}>{team?.label ?? "—"}</span>
      {won && <Crown className="h-4 w-4 shrink-0 text-[var(--tone)]" aria-label="passa il turno" />}
    </div>
  )
}

function MatchBox({ m }: { m: SimMatch }) {
  return (
    <div className="divide-y divide-[var(--border)] overflow-hidden rounded-xl bg-[var(--surface-2)]">
      <TeamLine team={m.a} won={m.winner === m.a} />
      <TeamLine team={m.b} won={m.winner === m.b} />
    </div>
  )
}

/**
 * "Simula": a what-if of the tournament with the people signed up now, where
 * the higher level always wins. Collapsed by default; never the real bracket.
 */
export function TournamentSimulation({ type, registrations }: { type: string; registrations: SimRegistration[] }) {
  const sim = simulateTournament(type, registrations)
  if (!sim) return null
  const champion = sim.kind === "bracket" ? sim.rounds.at(-1)?.matches[0]?.winner ?? sim.ranking[0] : sim.ranking[0]

  return (
    <details className="tone-compete group mx-4 mb-4 overflow-hidden rounded-2xl bg-[var(--surface-1)]">
      <summary className="flex min-h-[3.5rem] cursor-pointer list-none items-center gap-3 px-4 [&::-webkit-details-marker]:hidden">
        <Wand2 className="h-5 w-5 shrink-0 text-[var(--tone)]" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <p className="text-base font-bold text-white">Simula il torneo</p>
          <p className="truncate text-sm text-[var(--muted-text)]">Con gli iscritti di adesso, chi vincerebbe?</p>
        </div>
        <ChevronDown className="h-5 w-5 shrink-0 text-[var(--muted-text)] transition-transform group-open:rotate-180" aria-hidden="true" />
      </summary>

      <div className="space-y-4 px-4 pb-4">
        <p className="rounded-xl bg-[var(--surface-2)] px-3 py-2 text-sm text-[var(--muted-text)]">
          Vince sempre chi ha il livello SANDER più alto. È un pronostico, non il tabellone ufficiale: squadre e
          tabellone veri si fanno all’avvio.
        </p>

        {champion && (
          <div className="flex items-center gap-3 rounded-xl bg-[var(--surface-2)] px-3 py-3">
            <Crown className="h-6 w-6 shrink-0 text-[var(--gold)]" aria-hidden="true" />
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-wide text-[var(--muted-text)]">Favoriti</p>
              <p className="truncate text-lg font-bold text-white">{champion.label}</p>
            </div>
          </div>
        )}

        {sim.kind === "bracket" ? (
          sim.rounds.map((r) => (
            <div key={r.label}>
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[var(--tone)]">{r.label}</p>
              <div className="space-y-2">
                {r.matches.map((m, i) => <MatchBox key={i} m={m} />)}
              </div>
            </div>
          ))
        ) : (
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[var(--tone)]">Classifica prevista</p>
            <ol className="divide-y divide-[var(--border)] overflow-hidden rounded-xl bg-[var(--surface-2)]">
              {sim.ranking.slice(0, 10).map((t) => (
                <li key={t.key} className="flex items-center gap-2 px-3 py-2">
                  <span className="w-6 shrink-0 text-xs font-bold tabular-nums text-[var(--muted-text)]">{t.seed}°</span>
                  <span className="min-w-0 flex-1 truncate text-base text-white">{t.label}</span>
                </li>
              ))}
            </ol>
          </div>
        )}

        {sim.leftOut.length > 0 && (
          <p className="text-sm text-[var(--muted-text)]">
            Senza compagno per ora: {sim.leftOut.join(", ")}.
          </p>
        )}
      </div>
    </details>
  )
}
