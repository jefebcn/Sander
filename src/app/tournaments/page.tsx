import type { Metadata } from "next"
import Link from "next/link"
import { Plus } from "lucide-react"
import { listTournaments } from "@/actions/tournaments"
import { getCurrentPlayer, getCurrentSession } from "@/lib/getCurrentPlayer"
import { isAdminEmail } from "@/lib/isAdmin"
import { myManagedClubs } from "@/lib/clubAccess"
import { PageHeader } from "@/components/layout/PageHeader"
import { TournamentsInfoSheet } from "@/components/tournament/TournamentsInfoSheet"
import { TournamentCard } from "@/components/tournament/TournamentCard"
import { SectionTabs, PLAY_TABS } from "@/components/layout/SectionTabs"
import { Gabbo } from "@/components/ui/Gabbo"

export const metadata: Metadata = {
  title: "Tornei di beach volley | SANDER",
  description:
    "Tornei di beach volley in programma: iscrizioni, quote, tabelloni e risultati in diretta.",
}

export const dynamic = "force-dynamic"

export default async function TournamentsPage() {
  const [tournaments, currentPlayer, session] = await Promise.all([
    listTournaments(),
    getCurrentPlayer(),
    getCurrentSession(),
  ])
  // "+ Nuovo" only for those who can create: admins and club staff.
  const canCreate = isAdminEmail(session?.user?.email) || (!!currentPlayer && (await myManagedClubs(currentPlayer.id)).length > 0)

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
            {canCreate && (
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
          <Gabbo pose="attesa" size={128} />
          <div>
            <p className="text-lg font-semibold">Nessun torneo ancora</p>
            <p className="text-base text-[var(--muted-text)]">
              {canCreate ? "Crea il primo torneo del tuo club" : "Sei una società o un circolo? Porta i tuoi tornei su SANDER"}
            </p>
          </div>
          <Link
            href={canCreate ? "/tournaments/new" : "/club"}
            className="flex h-14 items-center gap-2 rounded-2xl bg-[var(--accent)] px-6 font-bold text-black"
          >
            <Plus className="h-5 w-5" />
            {canCreate ? "Crea Torneo" : "Iscrivi il tuo club"}
          </Link>
        </div>
      ) : (
        <div className="space-y-3 px-4">
          {tournaments.map((t) => (
            <TournamentCard key={t.id} tournament={t} />
          ))}
          {!canCreate && (
            <Link href="/club" className="flex min-h-[3.5rem] items-center justify-center text-base font-bold text-[var(--accent)]">
              Organizzi tornei? Porta il tuo club su SANDER
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
