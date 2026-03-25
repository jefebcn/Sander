import Link from "next/link"
import { ChevronRight, Play, CheckCircle2 } from "lucide-react"
import { getTournamentDashboard } from "@/actions/standings"
import { startTournament, completeTournament } from "@/actions/tournaments"
import { StatusBadge } from "@/components/tournament/StatusBadge"
import { LiveDashboard } from "@/components/tournament/LiveDashboard"
import { formatDate } from "@/lib/utils"

export const dynamic = "force-dynamic"

interface Props {
  params: Promise<{ id: string }>
}

export default async function TournamentPage({ params }: Props) {
  const { id } = await params
  const data = await getTournamentDashboard(id)
  const { tournament } = data

  return (
    <div className="pb-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 px-4 pt-5 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black">{tournament.name}</h1>
            <StatusBadge status={tournament.status} />
          </div>
          <p className="mt-0.5 text-sm text-[var(--muted-text)]">
            {formatDate(tournament.date)} ·{" "}
            {tournament.type === "KING_OF_THE_BEACH" ? "King of the Beach" : "Brackets"} ·{" "}
            {tournament.registrations.length} giocatori
          </p>
        </div>
      </div>

      {/* Actions bar */}
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
              className="flex min-h-[3.5rem] w-full items-center justify-center gap-2 rounded-2xl bg-[var(--live)] font-bold text-black"
            >
              <Play className="h-5 w-5" />
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
            <CheckCircle2 className="mx-auto mb-2 h-10 w-10 text-[var(--completed)]" />
            <p className="font-bold text-[var(--completed)]">Torneo Completato</p>
          </div>
        </div>
      )}

      {/* Navigation links */}
      {tournament.status !== "DRAFT" && (
        <div className="mt-4 space-y-2 px-4">
          {tournament.type === "BRACKETS" && (
            <Link
              href={`/tournaments/${id}/bracket`}
              className="flex min-h-[3.5rem] items-center justify-between rounded-2xl bg-[var(--surface-1)] px-4"
            >
              <span className="font-semibold">Tabellone</span>
              <ChevronRight className="h-5 w-5 text-[var(--muted-text)]" />
            </Link>
          )}
          <Link
            href={`/tournaments/${id}/standings`}
            className="flex min-h-[3.5rem] items-center justify-between rounded-2xl bg-[var(--surface-1)] px-4"
          >
            <span className="font-semibold">Classifica Completa</span>
            <ChevronRight className="h-5 w-5 text-[var(--muted-text)]" />
          </Link>

          {tournament.status === "LIVE" && (
            <form
              action={async () => {
                "use server"
                await completeTournament(id)
              }}
            >
              <button
                type="submit"
                className="flex min-h-[3.5rem] w-full items-center justify-center gap-2 rounded-2xl bg-[var(--surface-2)] font-semibold text-[var(--muted-text)]"
              >
                Concludi Torneo
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  )
}
