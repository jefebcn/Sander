import Link from "next/link"
import { Plus, Trophy } from "lucide-react"
import { listTournaments } from "@/actions/tournaments"
import { PageHeader } from "@/components/layout/PageHeader"
import { TournamentsInfoSheet } from "@/components/tournament/TournamentsInfoSheet"
import { TournamentCard } from "@/components/tournament/TournamentCard"

export const dynamic = "force-dynamic"

export default async function TournamentsPage() {
  const tournaments = await listTournaments()

  return (
    <div>
      <PageHeader
        title="Tornei"
        subtitle={`${tournaments.length} torneo${tournaments.length !== 1 ? "i" : ""}`}
        action={
          <div className="flex items-center gap-2">
            <TournamentsInfoSheet />
            <Link
              href="/tournaments/new"
              className="flex h-11 items-center gap-2 rounded-xl bg-[var(--accent)] px-4 text-sm font-bold text-black"
            >
              <Plus className="h-5 w-5" />
              Nuovo
            </Link>
          </div>
        }
      />

      {tournaments.length === 0 ? (
        <div className="flex flex-col items-center gap-4 px-6 py-20 text-center">
          <Trophy className="h-16 w-16 text-[var(--muted)]" />
          <div>
            <p className="text-lg font-semibold">Nessun torneo ancora</p>
            <p className="text-sm text-[var(--muted-text)]">
              Crea il primo torneo per iniziare
            </p>
          </div>
          <Link
            href="/tournaments/new"
            className="flex h-14 items-center gap-2 rounded-2xl bg-[var(--accent)] px-6 font-bold text-black"
          >
            <Plus className="h-5 w-5" />
            Crea Torneo
          </Link>
        </div>
      ) : (
        <div className="space-y-3 px-4">
          {tournaments.map((t) => (
            <TournamentCard key={t.id} tournament={t} />
          ))}
        </div>
      )}
    </div>
  )
}
