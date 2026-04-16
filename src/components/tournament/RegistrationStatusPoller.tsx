"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, CheckCircle2, Clock } from "lucide-react"
import { getTournamentForRegistration } from "@/actions/registration"

type Status = "PAID" | "FREE" | "PENDING" | "UNKNOWN"

export function RegistrationStatusPoller({
  tournamentId,
  initialStatus,
}: {
  tournamentId: string
  initialStatus: Status
}) {
  const router = useRouter()
  const [status, setStatus] = useState<Status>(initialStatus)
  const [elapsedSec, setElapsedSec] = useState(0)

  useEffect(() => {
    if (status === "PAID" || status === "FREE") return
    const startedAt = Date.now()
    let cancelled = false

    const interval = setInterval(async () => {
      if (cancelled) return
      const elapsed = Math.floor((Date.now() - startedAt) / 1000)
      setElapsedSec(elapsed)

      try {
        const result = await getTournamentForRegistration({ tournamentId })
        const s = result.myRegistration?.paymentStatus
        if (s === "PAID" || s === "FREE") {
          setStatus(s)
          clearInterval(interval)
          router.refresh()
          return
        }
      } catch {
        // Swallow; next tick will retry
      }

      if (elapsed >= 30) {
        clearInterval(interval)
      }
    }, 2000)

    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [status, tournamentId, router])

  if (status === "PAID" || status === "FREE") {
    return (
      <div className="mx-4 flex items-center gap-3 rounded-2xl bg-[var(--surface-1)] p-5">
        <CheckCircle2 className="h-8 w-8 shrink-0 text-[var(--accent)]" />
        <div className="min-w-0 flex-1">
          <p className="text-lg font-bold text-white">Iscrizione confermata</p>
          <p className="text-sm text-[var(--muted-text)]">
            Ci vediamo al torneo!
          </p>
        </div>
      </div>
    )
  }

  if (status === "PENDING") {
    return (
      <div className="mx-4 flex items-center gap-3 rounded-2xl bg-[var(--surface-1)] p-5">
        <Clock className="h-8 w-8 shrink-0 text-[var(--accent)]" />
        <div className="min-w-0 flex-1">
          <p className="text-lg font-bold text-white">Pagamento in contanti</p>
          <p className="text-sm text-[var(--muted-text)]">
            Paga all'organizzatore per confermare l'iscrizione.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-4 flex items-center gap-3 rounded-2xl bg-[var(--surface-1)] p-5">
      <Loader2 className="h-8 w-8 shrink-0 animate-spin text-[var(--accent)]" />
      <div className="min-w-0 flex-1">
        <p className="text-lg font-bold text-white">In attesa di conferma…</p>
        <p className="text-sm text-[var(--muted-text)]">
          {elapsedSec < 30
            ? "Stiamo verificando il pagamento con Stripe."
            : "Se il problema persiste, contatta l'organizzatore."}
        </p>
      </div>
    </div>
  )
}
