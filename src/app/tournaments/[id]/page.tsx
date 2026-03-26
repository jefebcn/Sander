import Link from "next/link"
import { ChevronRight, Play, Trophy } from "lucide-react"
import { getTournamentDashboard } from "@/actions/standings"
import { startTournament, completeTournament } from "@/actions/tournaments"
import { StatusBadge } from "@/components/tournament/StatusBadge"
import { LiveDashboard } from "@/components/tournament/LiveDashboard"
import { ConfirmActionButton } from "@/components/tournament/ConfirmActionButton"
import { formatDate } from "@/lib/utils"

export const dynamic = "force-dynamic"

export default async function TournamentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const data = await getTournamentDashboard(id)
  const { tournament } = data

  return (
    <div className="pb-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 px-4 pt-5 pb-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="truncate text-2xl font-black">{tournament.name}</h1>
            <StatusBadge status={tournament.status} />
          </div>
          <p className="mt-0.5 text-sm text-[var(--muted-text)]">
            {formatDate(tournament.date)} ·{" "}
            {tournament.type === "KING_OF_THE_BEACH"
              ? "King of the Beach"
              : tournament.type === "ROUND_ROBIN"
              ? "Round Robin"
              : tournament.type === "DOUBLE_ELIMINATION"
              ? "Doppia Eliminazione"
              : "Brackets"}{" "}
            ·{" "}
            {tournament.registrations.length} giocatori
          </p>
        </div>
      </div>

      {/* Draft — start action */}
      {tournament.status === "DRAFT" && (
        <div className="mx-4 mb-4 rounded-2xl bg-[var(--surface-1)] p-4">
          <p className="mb-3 text-sm text-[var(--muted-text)]">
            Torneo in bozza con {tournament.registrations.length} giocatori registrati.
          </p>
          <form
            action={async () => {
              "use server"
              await startTournament(id)
            }}
          >
            <button
              type="submit"
              className="flex min-h-[3.5rem] w-full items-center justify-center gap-2 rounded-2xl bg-[var(--live)] font-bold text-black transition-all active:scale-[0.98]"
            >
              <Play className="h-5 w-5" aria-hidden="true" />
              Avvia Torneo
            </button>
          </form>
        </div>
      )}

      {tournament.status === "LIVE" && (
        <LiveDashboard tournamentId={id} initialData={data} />
      )}

      {tournament.status === "COMPLETED" && (
        <div className="space-y-4 px-4">
          <LiveDashboard tournamentId={id} initialData={data} readOnly />
          <div className="rounded-2xl bg-[var(--surface-1)] p-4 text-center">
            <Trophy className="mx-auto mb-2 h-10 w-10 text-[var(--gold)]" aria-hidden="true" />
            <p className="font-bold text-[var(--completed)]">Torneo Completato</p>
          </div>
        </div>
      )}

      {/* Navigation links */}
      {tournament.status !== "DRAFT" && (
        <div className="mt-4 space-y-2 px-4">
          {(tournament.type === "BRACKETS" || tournament.type === "DOUBLE_ELIMINATION") && (
            <Link
              href={`/tournaments/${id}/bracket`}
              className="flex min-h-[3.5rem] items-center justify-between rounded-2xl bg-[var(--surface-1)] px-4 transition-colors hover:bg-[var(--surface-2)]"
            >
              <span className="font-semibold">Tabellone</span>
              <ChevronRight className="h-5 w-5 text-[var(--muted-text)]" aria-hidden="true" />
            </Link>
          )}
          <Link
            href={`/tournaments/${id}/standings`}
            className="flex min-h-[3.5rem] items-center justify-between rounded-2xl bg-[var(--surface-1)] px-4 transition-colors hover:bg-[var(--surface-2)]"
          >
            <span className="font-semibold">Classifica Completa</span>
            <ChevronRight className="h-5 w-5 text-[var(--muted-text)]" aria-hidden="true" />
          </Link>

          {tournament.status === "LIVE" && (
            <ConfirmActionButton
              action={async () => {
                "use server"
                await completeTournament(id)
              }}
              label="Concludi Torneo"
              confirmLabel="Conferma — Concludi Torneo"
              description="Questa azione è irreversibile. Il torneo verrà chiuso e le statistiche aggiornate."
            />
          )}
        </div>
      )}
    </div>
  )
}
