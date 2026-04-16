import type { Metadata } from "next"
import Link from "next/link"
import { ChevronRight, Play, Trophy, Shuffle } from "lucide-react"
import { getTournamentDashboard } from "@/actions/standings"
import { startTournament, completeTournament } from "@/actions/tournaments"
import { getCurrentSession } from "@/lib/getCurrentPlayer"
import { db } from "@/lib/db"
import { canManageTournament } from "@/lib/isAdmin"
import { StatusBadge } from "@/components/tournament/StatusBadge"
import { LiveDashboard } from "@/components/tournament/LiveDashboard"
import { ConfirmActionButton } from "@/components/tournament/ConfirmActionButton"
import { ChiceceDashboard } from "@/components/tournament/ChiceceDashboard"
import { TeamPairingEditor } from "@/components/tournament/TeamPairingEditor"
import { ShareButton } from "@/components/ui/ShareButton"
import { TournamentPriceBadge } from "@/components/tournament/TournamentPriceBadge"
import { TournamentPaymentsList } from "@/components/tournament/TournamentPaymentsList"
import { PaymentCtaButton } from "@/components/tournament/PaymentCtaButton"
import { formatDate } from "@/lib/utils"
import { redirect } from "next/navigation"

export const dynamic = "force-dynamic"

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> }
): Promise<Metadata> {
  const { id } = await params
  const tournament = await db.tournament.findUnique({ where: { id }, select: { name: true } }).catch(() => null)
  const title = tournament ? `${tournament.name} — SANDER` : "SANDER — Beach Volleyball"
  const ogUrl = tournament
    ? `/api/og?title=${encodeURIComponent(tournament.name)}&subtitle=Torneo+Beach+Volleyball&type=tournament`
    : `/api/og?title=SANDER&subtitle=Beach+Volleyball&type=tournament`
  return {
    title,
    openGraph: {
      title,
      description: tournament
        ? `Torneo di beach volley · Unisciti su SANDER 🏐`
        : "Beach Volleyball Tournament Manager",
      images: [{ url: ogUrl, width: 1200, height: 630, alt: title }],
    },
  }
}

export default async function TournamentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const [base, session] = await Promise.all([
    db.tournament.findUniqueOrThrow({ where: { id }, select: { type: true } }),
    getCurrentSession(),
  ])

  const isAdmin = await canManageTournament(session?.user?.email, id)

  // ── Chicece path ────────────────────────────────────────────
  if (base.type === "CHICECE") {
    const [tournament, registrations, matches] = await Promise.all([
      db.tournament.findUniqueOrThrow({ where: { id } }),
      db.tournamentRegistration.findMany({
        where: { tournamentId: id },
        include: { player: true },
        orderBy: { chicecePlusMinus: "desc" },
      }),
      db.match.findMany({
        where: { tournamentId: id },
        include: { players: { include: { player: true } } },
        orderBy: [{ round: "asc" }, { matchNumber: "asc" }],
      }),
    ])

    const typeLabel = "Chicece"

    return (
      <div className="pb-6">
        {/* Header */}
        <div className="flex items-start gap-3 px-4 pt-5 pb-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <Shuffle className="h-5 w-5 shrink-0 text-[var(--accent)]" />
              <h1 className="truncate text-2xl font-black">{tournament.name}</h1>
              <StatusBadge status={tournament.status} />
            </div>
            <p className="mt-0.5 text-sm text-[var(--muted-text)]">
              {formatDate(tournament.date)} · {typeLabel} · {registrations.length} giocatori
            </p>
          </div>
          <ShareButton path={`/tournaments/${id}`} title={tournament.name} text={`Unisciti al torneo "${tournament.name}" su SANDER 🏐`} />
        </div>

        {/* Draft — start */}
        {tournament.status === "DRAFT" && isAdmin && (
          <div className="mx-4 mb-4 rounded-2xl bg-[var(--surface-1)] p-4">
            <p className="mb-3 text-sm text-[var(--muted-text)]">
              Torneo in bozza con {registrations.length} giocatori registrati.
            </p>
            <form
              action={async () => {
                "use server"
                try {
                  await startTournament(id)
                } catch (e) {
                  console.error("Errore avvio torneo chicece:", e)
                }
                redirect(`/tournaments/${id}`)
              }}
            >
              <button
                type="submit"
                className="flex min-h-[3.5rem] w-full items-center justify-center gap-2 rounded-2xl bg-[var(--live)] font-bold text-black transition-all active:scale-[0.98]"
              >
                <Play className="h-5 w-5" />
                Avvia Torneo Chicece
              </button>
            </form>
          </div>
        )}

        {/* Bollini pagamento — solo per tornei a pagamento, solo admin */}
        {isAdmin && (tournament.priceCents ?? 0) > 0 && (
          <div className="mx-4 mb-4">
            <TournamentPaymentsList
              registrations={registrations.map((r) => ({
                id: r.id,
                player: { name: r.player.name },
                paymentStatus: r.paymentStatus,
                paymentMethod: r.paymentMethod,
                paidAt: r.paidAt,
                amountPaidCents: r.amountPaidCents,
              }))}
              priceCents={tournament.priceCents!}
              isAdmin={isAdmin}
              tournamentId={id}
            />
          </div>
        )}

        {tournament.status !== "DRAFT" && (
          <ChiceceDashboard
            tournament={{
              id: tournament.id,
              chicecePhase: tournament.chicecePhase,
              chiceceMatchCount: tournament.chiceceMatchCount,
              status: tournament.status,
            }}
            registrations={registrations.map((r) => ({
              id: r.id,
              playerId: r.playerId,
              chicecePlusMinus: r.chicecePlusMinus,
              chiceceMatchesPlayed: r.chiceceMatchesPlayed,
              player: {
                id: r.player.id,
                name: r.player.name,
                firstName: r.player.firstName,
                lastName: r.player.lastName,
              },
            }))}
            matches={matches.map((m) => ({
              id: m.id,
              round: m.round,
              matchNumber: m.matchNumber,
              bracketSection: m.bracketSection,
              teamAScore: m.teamAScore,
              teamBScore: m.teamBScore,
              isCompleted: m.isCompleted,
              players: m.players.map((mp) => ({
                playerId: mp.playerId,
                team: mp.team,
                player: {
                  id: mp.player.id,
                  name: mp.player.name,
                  firstName: mp.player.firstName,
                  lastName: mp.player.lastName,
                },
              })),
            }))}
            isAdmin={isAdmin}
          />
        )}
      </div>
    )
  }

  // ── Standard tournament path ─────────────────────────────────
  const data = await getTournamentDashboard(id)
  const { tournament } = data

  // Fetch current player's registration (for inline self-registration CTA)
  const currentPlayer = session?.user?.id
    ? await db.player.findUnique({ where: { userId: session.user.id }, select: { id: true } })
    : null
  const myRegistration = currentPlayer && tournament.isOpenForRegistration
    ? await db.tournamentRegistration.findUnique({
        where: { tournamentId_playerId: { tournamentId: id, playerId: currentPlayer.id } },
        select: { paymentStatus: true, paymentMethod: true },
      })
    : null

  function getRegStatus() {
    if (!myRegistration) return "NOT_REGISTERED" as const
    const { paymentStatus, paymentMethod } = myRegistration
    if (paymentStatus === "PAID" || paymentStatus === "FREE") return "PAID" as const
    if (paymentStatus === "PENDING" && paymentMethod === "STRIPE") return "PENDING_STRIPE" as const
    if (paymentStatus === "PENDING" && paymentMethod === "CASH") return "PENDING_CASH" as const
    return "NOT_REGISTERED" as const
  }
  const regStatus = getRegStatus()

  return (
    <div className="pb-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 px-4 pt-5 pb-3">
        <div className="min-w-0 flex-1">
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
              : "Classico"}{" "}
            ·{" "}
            {tournament.registrations.length} giocatori
          </p>
        </div>
        <ShareButton path={`/tournaments/${id}`} title={tournament.name} text={`Unisciti al torneo "${tournament.name}" su SANDER 🏐`} />
      </div>

      {/* Open for self-registration — visible to everyone */}
      {tournament.status === "DRAFT" && tournament.isOpenForRegistration && (
        <div className="mx-4 mb-4 space-y-2">
          <div className="flex items-center justify-between gap-3 rounded-2xl bg-[var(--surface-1)] p-4">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold uppercase tracking-wide text-[var(--accent)]">
                Iscrizioni aperte
              </p>
              <p className="mt-1 text-sm text-[var(--muted-text)]">
                Iscriviti e paga direttamente in app
              </p>
            </div>
            <TournamentPriceBadge priceCents={tournament.priceCents} currency={tournament.priceCurrency} />
          </div>
          {/* Pulsante iscrizione inline — evita redirect a /register */}
          <PaymentCtaButton
            tournamentId={id}
            isFree={!tournament.priceCents || tournament.priceCents === 0}
            status={regStatus}
            isAuthed={!!currentPlayer}
            inline
          />
          {/* Link invito — chiunque può copiarlo e condividerlo */}
          <ShareButton
            path={`/tournaments/${id}/register`}
            title={tournament.name}
            text={`Iscriviti al torneo "${tournament.name}" su SANDER 🏐`}
            fullWidth
          />
        </div>
      )}

      {/* Draft — admin pairing editor + start action */}
      {tournament.status === "DRAFT" && isAdmin && (
        <>
          {/* Team pairing editor: only for fixed-team formats where pairing matters */}
          {(tournament.type === "BRACKETS" ||
            tournament.type === "DOUBLE_ELIMINATION" ||
            tournament.type === "ROUND_ROBIN") && (
            <TeamPairingEditor
              tournamentId={id}
              registrations={tournament.registrations}
            />
          )}

          <div className="mx-4 mb-4 rounded-2xl bg-[var(--surface-1)] p-4">
            <p className="mb-3 text-sm text-[var(--muted-text)]">
              Torneo in bozza con {tournament.registrations.length} giocatori registrati.
            </p>
            <form
              action={async () => {
                "use server"
                try {
                  await startTournament(id)
                } catch (e) {
                  console.error("Errore avvio torneo:", e)
                }
                redirect(`/tournaments/${id}`)
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
        </>
      )}

      {/* Bollini pagamento — solo per tornei a pagamento, solo admin */}
      {isAdmin && (tournament.priceCents ?? 0) > 0 && (
        <div className="mx-4 mb-4">
          <TournamentPaymentsList
            registrations={tournament.registrations.map((r) => ({
              id: r.id,
              player: { name: r.player.name },
              paymentStatus: r.paymentStatus,
              paymentMethod: r.paymentMethod,
              paidAt: r.paidAt,
              amountPaidCents: r.amountPaidCents,
            }))}
            priceCents={tournament.priceCents!}
            isAdmin={isAdmin}
            tournamentId={id}
          />
        </div>
      )}

      {tournament.status === "LIVE" && (
        <LiveDashboard tournamentId={id} initialData={data} canEditPlayers={!!session?.user?.id} />
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
              className="flex items-center gap-4 rounded-2xl p-4 transition-colors hover:opacity-90 active:scale-[0.98]"
              style={{
                background: "var(--surface-1)",
                border: "1px solid rgba(201,243,29,0.25)",
              }}
            >
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                style={{ background: "rgba(201,243,29,0.1)" }}
              >
                <Trophy className="h-5 w-5 text-[var(--accent)]" aria-hidden="true" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-black text-white">Tabellone</p>
                <p className="text-xs text-[var(--muted-text)]">Visualizza il tabellone del torneo</p>
              </div>
              <ChevronRight className="h-5 w-5 shrink-0 text-[var(--accent)]" aria-hidden="true" />
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
                try {
                  await completeTournament(id)
                } catch (e) {
                  console.error("Errore conclusione torneo:", e)
                }
                redirect(`/tournaments/${id}`)
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
