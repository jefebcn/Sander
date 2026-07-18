import Link from "next/link"
import { Plus, Trophy } from "lucide-react"
import { listTournaments } from "@/actions/tournaments"
import { getCurrentPlayer } from "@/lib/getCurrentPlayer"
import { PageHeader } from "@/components/layout/PageHeader"
import { TournamentsInfoSheet } from "@/components/tournament/TournamentsInfoSheet"
import { TournamentCard } from "@/components/tournament/TournamentCard"

export const dynamic = "force-dynamic"

export default async function TournamentsPage() {
  const [tournaments, currentPlayer] = await Promise.all([
    listTournaments(),
    getCurrentPlayer(),
  ])

  return (
    <div>
      <PageHeader
        title="Tornei"
        subtitle={`${tournaments.length} torneo${tournaments.length !== 1 ? "i" : ""}`}
        action={
          <div className="flex items-center gap-2">
            <TournamentsInfoSheet />
            {/* Creating a tournament needs an account (and costs SanderCredits) —
                don't push newcomers toward a wall; show it only when logged in. */}
            {currentPlayer && (
              <Link
                href="/tournaments/new"
                className="flex h-11 items-center gap-2 rounded-xl bg-[var(--accent)] px-4 text-sm font-bold text-black"
              >
                <Plus className="h-5 w-5" />
                Nuovo
              </Link>
            )}
          </div>
        }
      />

      {tournaments.length === 0 ? (
        <div className="flex flex-col items-center gap-4 px-6 py-20 text-center">
          <Trophy className="h-16 w-16 text-[var(--muted)]" />
          <div>
            <p className="text-lg font-semibold">Nessun torneo ancora</p>
            <p className="text-sm text-[var(--muted-text)]">
              {currentPlayer ? "Crea il primo torneo per iniziare" : "Accedi per creare il primo torneo"}
            </p>
          </div>
          <Link
            href={currentPlayer ? "/tournaments/new" : "/auth/signin?callbackUrl=%2Ftournaments%2Fnew"}
            className="flex h-14 items-center gap-2 rounded-2xl bg-[var(--accent)] px-6 font-bold text-black"
          >
            <Plus className="h-5 w-5" />
            {currentPlayer ? "Crea Torneo" : "Accedi per creare"}
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
