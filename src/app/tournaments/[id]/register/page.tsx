export const dynamic = "force-dynamic"

import { redirect } from "next/navigation"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { getTournamentForRegistration } from "@/actions/registration"
import { TournamentRegistrationRecap } from "@/components/tournament/TournamentRegistrationRecap"
import { PaymentCtaButton } from "@/components/tournament/PaymentCtaButton"
import { deriveRegistrationStatus } from "@/lib/tournament/registrationPayment"

export default async function RegisterPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const { tournament, myRegistration, isAuthed } = await getTournamentForRegistration({
    tournamentId: id,
  })

  // Not open for registration → bounce back to detail
  if (!tournament.isOpenForRegistration) {
    redirect(`/tournaments/${id}`)
  }

  const isFree = tournament.priceCents == null || tournament.priceCents === 0
  const deadlinePassed =
    tournament.registrationDeadline &&
    new Date(tournament.registrationDeadline).getTime() < Date.now()

  const ownPlayerReg = myRegistration && !myRegistration.isSpectator ? myRegistration : null
  const status =
    tournament.status !== "DRAFT" || deadlinePassed
      ? ("CLOSED" as const)
      : deriveRegistrationStatus(ownPlayerReg)

  return (
    // Bottom padding clears the fixed CTA, which sits above the mobile nav.
    <div className="min-h-dvh pb-56 md:pb-32">
      {/* Header with back */}
      <div
        className="flex items-center gap-3 px-4 pt-6 pb-3"
        style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 1.5rem)" }}
      >
        <Link
          href={`/tournaments/${id}`}
          aria-label="Indietro"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--surface-3)] text-white active:bg-[var(--surface-4)]"
        >
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <h2 className="text-sm font-medium uppercase tracking-wide text-[var(--muted-text)]">
          Iscrizione torneo
        </h2>
      </div>

      <TournamentRegistrationRecap tournament={tournament} />

      <PaymentCtaButton
        tournamentId={id}
        isFree={isFree}
        status={status}
        isAuthed={isAuthed}
        currentSkillLevel={ownPlayerReg?.skillLevel ?? null}
        registrationId={ownPlayerReg?.id ?? null}
      />
    </div>
  )
}
