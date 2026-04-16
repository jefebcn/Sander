import Link from "next/link"
import { Plus, Trophy, Users, Calendar } from "lucide-react"
import { listTournaments } from "@/actions/tournaments"
import { PageHeader } from "@/components/layout/PageHeader"
import { StatusBadge } from "@/components/tournament/StatusBadge"
import { TournamentPriceBadge } from "@/components/tournament/TournamentPriceBadge"
import { formatDate } from "@/lib/utils"

export const dynamic = "force-dynamic"

export default async function TournamentsPage() {
  const tournaments = await listTournaments()

  return (
    <div>
      <PageHeader
        title="Tornei"
        subtitle={`${tournaments.length} torneo${tournaments.length !== 1 ? "i" : ""}`}
        action={
          <Link
            href="/tournaments/new"
            className="flex h-11 items-center gap-2 rounded-xl bg-[var(--accent)] px-4 text-sm font-bold text-black"
          >
            <Plus className="h-5 w-5" />
            Nuovo
          </Link>
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
            <Link
              key={t.id}
              href={`/tournaments/${t.id}`}
              className="block rounded-2xl bg-[var(--surface-1)] p-4 active:opacity-80"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="truncate text-lg font-bold">{t.name}</h2>
                    <StatusBadge status={t.status} />
                  </div>
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-[var(--muted-text)]">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {formatDate(t.date)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" />
                      {t.registrations.length} giocatori
                    </span>
                    <span className="rounded bg-[var(--surface-3)] px-1.5 py-0.5 text-xs font-medium">
                      {t.type === "KING_OF_THE_BEACH" ? "King of the Beach" : "Brackets"}
                    </span>
                  </div>
                  {t.isOpenForRegistration && t.status === "DRAFT" && (
                    <div className="mt-2 flex items-center gap-2">
                      <TournamentPriceBadge
                        priceCents={t.priceCents}
                        currency={t.priceCurrency}
                      />
                      <span className="text-xs font-bold uppercase tracking-wide text-[var(--accent)]">
                        Iscrizioni aperte
                      </span>
                    </div>
                  )}
                </div>
                <Trophy
                  className="mt-0.5 h-5 w-5 shrink-0 text-[var(--accent)]"
                />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
