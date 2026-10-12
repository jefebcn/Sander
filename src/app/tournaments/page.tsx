import Link from "next/link"
import { Plus, Trophy } from "lucide-react"
import { listTournaments } from "@/actions/tournaments"
import { getCurrentPlayer } from "@/lib/getCurrentPlayer"
import { PageHeader } from "@/components/layout/PageHeader"
import { TournamentsInfoSheet } from "@/components/tournament/TournamentsInfoSheet"
import { TournamentCard } from "@/components/tournament/TournamentCard"
import { SectionTabs, PLAY_TABS } from "@/components/layout/SectionTabs"

export const dynamic = "force-dynamic"

export default async function TournamentsPage() {
  const [tournaments, currentPlayer] = await Promise.all([
    listTournaments(),
    getCurrentPlayer(),
  ])

  return (
    <div>
      <PageHeader
        eyebrow="Gioca"
        tone="compete"
        title="Tornei"
        subtitle={`${tournaments.length} ${tournaments.length === 1 ? "torneo" : "tornei"}`}
        action={
          <div className="flex items-center gap-2">
            <TournamentsInfoSheet />
            {/* Creating a tournament needs an account (and costs SanderCredits) —
                don't push newcomers toward a wall; show it only when logged in. */}
            {currentPlayer && (
              <Link
                href="/tournaments/new"
                className="flex min-h-[2.75rem] items-center gap-2 rounded-full bg-[var(--accent)] px-4 text-sm font-extrabold text-black"
              >
                <Plus className="h-5 w-5" />
                Nuovo
              </Link>
            )}
          </div>
        }
      />
      <SectionTabs items={PLAY_TABS} active="tornei" className="pb-4" />

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
            href={currentPlayer ? "/tournaments/new" : "/auth/signin?callbackUrl=%2Ftournaments%2Fnew&mode=register"}
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
