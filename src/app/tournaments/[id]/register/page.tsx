export const dynamic = "force-dynamic"

import { redirect } from "next/navigation"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { getTournamentForRegistration } from "@/actions/registration"
import { TournamentRegistrationRecap } from "@/components/tournament/TournamentRegistrationRecap"
import { PaymentCtaButton } from "@/components/tournament/PaymentCtaButton"

type Status = "NOT_REGISTERED" | "PAID" | "PENDING_STRIPE" | "PENDING_CASH" | "REGISTERED_UNPAID" | "CLOSED"

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

  let status: Status = "NOT_REGISTERED"
  if (tournament.status !== "DRAFT" || deadlinePassed) {
    status = "CLOSED"
  } else if (myRegistration) {
    if (myRegistration.paymentStatus === "PAID" || myRegistration.paymentStatus === "FREE") {
      status = "PAID"
    } else if (myRegistration.paymentStatus === "PENDING" && myRegistration.paymentMethod === "CASH") {
      status = "PENDING_CASH"
    } else if (myRegistration.paymentStatus === "PENDING" && myRegistration.paymentMethod === "STRIPE") {
      status = "PENDING_STRIPE"
    } else if (myRegistration.paymentStatus === "PENDING" && !myRegistration.paymentMethod) {
      status = "REGISTERED_UNPAID"
    }
  }

  return (
    <div className="min-h-dvh pb-32">
      {/* Header with back */}
      <div
        className="flex items-center gap-3 px-4 pt-6 pb-3"
        style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 1.5rem)" }}
      >
        <Link
          href={`/tournaments/${id}`}
          aria-label="Indietro"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-[#2a2a2a] text-white active:bg-[#333]"
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
        currentSkillLevel={myRegistration?.skillLevel ?? null}
      />
    </div>
  )
}
