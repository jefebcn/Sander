"use client"

import { useState, useTransition } from "react"
import { RefreshCw, Wrench, BarChart3 } from "lucide-react"
import {
  adminForceResetChiceceFinals,
  adminFixChiceceTournamentWinners,
  adminRecalculateAllStats,
} from "@/actions/tournaments"
import { cn } from "@/lib/utils"

interface Props {
  tournamentId: string
}

export function AdminChiceceCompletedActions({ tournamentId }: Props) {
  const [isPending, startTransition] = useTransition()
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null)

  function run(confirmText: string, fn: () => Promise<void>) {
    if (!confirm(confirmText)) return
    setMsg(null)
    startTransition(async () => {
      try {
        await fn()
        setMsg({ text: "Operazione completata con successo.", ok: true })
      } catch (err) {
        setMsg({ text: err instanceof Error ? err.message : "Errore sconosciuto", ok: false })
      }
    })
  }

  return (
    <div className="space-y-2 px-4 pb-6">
      {msg && (
        <p
          className={cn(
            "rounded-xl px-4 py-3 text-sm font-medium",
            msg.ok
              ? "bg-[var(--live)]/15 text-[var(--live)]"
              : "bg-[var(--danger)]/15 text-[var(--danger)]",
          )}
        >
          {msg.text}
        </p>
      )}

      <button
        onClick={() =>
          run(
            "Reimposta la fase finale? Le semifinali e la finale vengono cancellate, le statistiche ripristinate e i punteggi Glicko ricalcolati. Il torneo tornerà in stato LIVE.",
            () => adminForceResetChiceceFinals(tournamentId),
          )
        }
        disabled={isPending}
        className="flex min-h-[3.5rem] w-full items-center justify-center gap-2 rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] text-sm font-bold text-[var(--danger)] disabled:opacity-40"
      >
        <RefreshCw className="h-4 w-4" />
        {isPending ? "In corso…" : "Reimposta fase finale (admin)"}
      </button>

      <button
        onClick={() =>
          run(
            "Correggi il vincitore del torneo? Aggiorna tournamentsWon in base alla finale effettiva.",
            () => adminFixChiceceTournamentWinners(tournamentId),
          )
        }
        disabled={isPending}
        className="flex min-h-[3.5rem] w-full items-center justify-center gap-2 rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] text-sm font-bold text-[var(--danger)] disabled:opacity-40"
      >
        <Wrench className="h-4 w-4" />
        {isPending ? "In corso…" : "Correggi vincitore torneo (admin)"}
      </button>

      <button
        onClick={() =>
          run(
            "Ricalcola tutti i punteggi Glicko e le statistiche di carriera? Questa operazione rielabora tutti i tornei completati e può richiedere qualche secondo.",
            () => adminRecalculateAllStats(),
          )
        }
        disabled={isPending}
        className="flex min-h-[3.5rem] w-full items-center justify-center gap-2 rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] text-sm font-bold text-[var(--accent)] disabled:opacity-40"
      >
        <BarChart3 className="h-4 w-4" />
        {isPending ? "In corso…" : "Ricalcola punteggi Glicko (admin)"}
      </button>
    </div>
  )
}
