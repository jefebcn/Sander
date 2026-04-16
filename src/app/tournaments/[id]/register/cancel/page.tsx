export const dynamic = "force-dynamic"

import Link from "next/link"
import { ChevronLeft, XCircle } from "lucide-react"
import { cancelRegistration } from "@/actions/registration"

export default async function CancelPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ registration_id?: string }>
}) {
  const { id } = await params
  const { registration_id } = await searchParams

  // Best-effort cleanup of the PENDING row so the unique slot frees up.
  // We intentionally swallow errors — the user already cancelled, nothing to show.
  if (registration_id) {
    try {
      await cancelRegistration({ registrationId: registration_id })
    } catch {
      // ignore
    }
  }

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
          Pagamento annullato
        </h2>
      </div>

      <div className="mt-10 flex flex-col items-center px-6 text-center">
        <XCircle className="h-16 w-16 text-[var(--muted-text)]" />
        <p className="mt-4 text-2xl font-black text-white">Pagamento annullato</p>
        <p className="mt-2 text-base text-[var(--muted-text)]">
          L'iscrizione non è stata completata. Puoi riprovare in qualsiasi momento.
        </p>
      </div>

      <div className="mt-10 flex flex-col gap-3 px-4">
        <Link
          href={`/tournaments/${id}/register`}
          className="flex min-h-[3.5rem] items-center justify-center rounded-2xl bg-[var(--accent)] font-bold text-black active:brightness-90"
        >
          Riprova iscrizione
        </Link>
        <Link
          href={`/tournaments/${id}`}
          className="flex min-h-[3.5rem] items-center justify-center rounded-2xl bg-[var(--surface-2)] font-bold text-white active:bg-white/10"
        >
          Torna al torneo
        </Link>
      </div>
    </div>
  )
}
