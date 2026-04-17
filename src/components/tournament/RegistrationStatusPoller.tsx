"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, CheckCircle2, Clock, ExternalLink } from "lucide-react"
import { getTournamentForRegistration } from "@/actions/registration"

type Status = "PAID" | "FREE" | "PENDING" | "UNKNOWN"

const PAYPAL_URL = "https://paypal.me/lilconti"

export function RegistrationStatusPoller({
  tournamentId,
  initialStatus,
  paymentMethod,
}: {
  tournamentId: string
  initialStatus: Status
  paymentMethod?: string | null
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
    if (paymentMethod === "PAYPAL") {
      return (
        <div className="mx-4 flex flex-col gap-3 rounded-2xl bg-[var(--surface-1)] p-5">
          <div className="flex items-center gap-3">
            <Clock className="h-8 w-8 shrink-0 text-[#009cde]" />
            <div className="min-w-0 flex-1">
              <p className="text-lg font-bold text-white">Paga via PayPal</p>
              <p className="text-sm text-[var(--muted-text)]">
                Invia il pagamento e l'organizzatore confermerà l'iscrizione.
              </p>
            </div>
          </div>
          <a
            href={PAYPAL_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-h-[3.5rem] items-center justify-center gap-2 rounded-2xl font-bold text-white"
            style={{ background: "#003087" }}
          >
            <ExternalLink className="h-4 w-4" />
            Apri paypal.me/lilconti
          </a>
        </div>
      )
    }

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
