"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { CreditCard, Banknote, X, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { startCheckout, createManualPaymentRegistration } from "@/actions/registration"

export function PaymentMethodSheet({
  open,
  onClose,
  tournamentId,
  isFree,
}: {
  open: boolean
  onClose: () => void
  tournamentId: string
  isFree: boolean
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleStripe() {
    setError(null)
    startTransition(async () => {
      const result = await startCheckout({ tournamentId })
      if (!result.ok) {
        setError(result.error)
        return
      }
      if (result.redirectUrl.startsWith("http")) {
        window.location.href = result.redirectUrl
      } else {
        router.push(result.redirectUrl)
      }
    })
  }

  function handleCash() {
    setError(null)
    startTransition(async () => {
      const result = await createManualPaymentRegistration({ tournamentId })
      if (!result.ok) {
        setError(result.error)
        return
      }
      router.push(`/tournaments/${tournamentId}/register/success`)
    })
  }

  // Free tournament: skip method choice, go straight
  if (isFree) {
    return null
  }

  return (
    <div
      className={cn(
        "fixed inset-0 z-[300] flex flex-col justify-end transition-all duration-300",
        open ? "visible" : "invisible",
      )}
    >
      {/* Backdrop */}
      <div
        className={cn(
          "absolute inset-0 bg-black transition-opacity duration-300",
          open ? "opacity-60" : "opacity-0",
        )}
        onClick={isPending ? undefined : onClose}
      />
      {/* Sheet */}
      <div
        className={cn(
          "relative z-10 flex flex-col rounded-t-3xl bg-[#1e1e1e] transition-transform duration-300",
          open ? "translate-y-0" : "translate-y-full",
        )}
        style={{ maxHeight: "80dvh" }}
      >
        <div className="flex items-center justify-between px-5 pb-3 pt-5">
          <h3 className="text-lg font-bold text-white">Metodo di pagamento</h3>
          <button
            onClick={onClose}
            disabled={isPending}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--surface-3)] disabled:opacity-50"
          >
            <X className="h-4 w-4 text-[var(--muted-text)]" />
          </button>
        </div>

        <div className="flex flex-col gap-3 px-5 pb-8">
          <button
            type="button"
            onClick={handleStripe}
            disabled={isPending}
            className="flex min-h-[3.5rem] items-center gap-3 rounded-2xl bg-[var(--surface-2)] px-4 py-3 text-left active:bg-white/10 disabled:opacity-60"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--accent)]/20 text-[var(--accent)]">
              <CreditCard className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-base font-bold text-white">
                Carta, PayPal, Apple/Google Pay
              </p>
              <p className="text-sm text-[var(--muted-text)]">
                Pagamento sicuro via Stripe
              </p>
            </div>
            {isPending && <Loader2 className="h-5 w-5 animate-spin text-[var(--accent)]" />}
          </button>

          <button
            type="button"
            onClick={handleCash}
            disabled={isPending}
            className="flex min-h-[3.5rem] items-center gap-3 rounded-2xl bg-[var(--surface-2)] px-4 py-3 text-left active:bg-white/10 disabled:opacity-60"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--surface-3)] text-white">
              <Banknote className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-base font-bold text-white">Paga in contanti</p>
              <p className="text-sm text-[var(--muted-text)]">
                Pagamento all'organizzatore, iscrizione in attesa di conferma
              </p>
            </div>
            {isPending && <Loader2 className="h-5 w-5 animate-spin text-[var(--accent)]" />}
          </button>

          {error && (
            <p className="mt-2 rounded-xl bg-[var(--danger)]/15 px-4 py-3 text-sm text-[var(--danger)]">
              {error}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
