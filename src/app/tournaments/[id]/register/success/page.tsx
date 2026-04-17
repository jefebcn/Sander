export const dynamic = "force-dynamic"

import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { getTournamentForRegistration } from "@/actions/registration"
import { RegistrationStatusPoller } from "@/components/tournament/RegistrationStatusPoller"

export default async function SuccessPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const { tournament, myRegistration } = await getTournamentForRegistration({
    tournamentId: id,
  })

  const currentStatus = myRegistration?.paymentStatus ?? "UNKNOWN"
  const paymentMethod = myRegistration?.paymentMethod ?? null
  const initialStatus = (() => {
    if (currentStatus === "PAID" || currentStatus === "FREE") return currentStatus
    if (currentStatus === "PENDING" && (paymentMethod === "CASH" || paymentMethod === "PAYPAL")) return "PENDING"
    return "UNKNOWN"
  })() as "PAID" | "FREE" | "PENDING" | "UNKNOWN"

  return (
    <div className="min-h-dvh pb-10">
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
          {tournament.name}
        </h2>
      </div>

      <div className="mt-6">
        <RegistrationStatusPoller tournamentId={id} initialStatus={initialStatus} paymentMethod={paymentMethod} />
      </div>

      <div className="mt-6 flex flex-col gap-3 px-4">
        <Link
          href={`/tournaments/${id}`}
          className="flex min-h-[3.5rem] items-center justify-center rounded-2xl bg-[var(--accent)] font-bold text-black active:brightness-90"
        >
          Vai al torneo
        </Link>
        <Link
          href="/tournaments"
          className="flex min-h-[3.5rem] items-center justify-center rounded-2xl bg-[var(--surface-2)] font-bold text-white active:bg-white/10"
        >
          Tutti i tornei
        </Link>
      </div>
    </div>
  )
}
