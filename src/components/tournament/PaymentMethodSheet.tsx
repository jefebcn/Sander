"use client"

import { useEffect, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { CreditCard, Banknote, Wallet, X, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  startCheckout,
  createManualPaymentRegistration,
  createPaypalRegistration,
  registerForTournament,
} from "@/actions/registration"
import { SKILL_LEVEL_LABELS } from "./SkillBadge"

type Mode = "pay" | "register"

export function PaymentMethodSheet({
  open,
  onClose,
  tournamentId,
  isFree,
  mode = "pay",
  initialSkillLevel = null,
}: {
  open: boolean
  onClose: () => void
  tournamentId: string
  isFree: boolean
  mode?: Mode
  initialSkillLevel?: number | null
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [skillLevel, setSkillLevel] = useState<number | null>(initialSkillLevel ?? null)

  useEffect(() => {
    if (open) {
      setSkillLevel(initialSkillLevel ?? null)
      setError(null)
    }
  }, [open, initialSkillLevel])

  const canAct = skillLevel !== null && !isPending

  function handleStripe() {
    if (skillLevel === null) return
    setError(null)
    startTransition(async () => {
      const result = await startCheckout({ tournamentId, skillLevel })
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
    if (skillLevel === null) return
    setError(null)
    startTransition(async () => {
      const result = await createManualPaymentRegistration({ tournamentId, skillLevel })
      if (!result.ok) {
        setError(result.error)
        return
      }
      router.push(`/tournaments/${tournamentId}/register/success`)
    })
  }

  function handlePaypal() {
    if (skillLevel === null) return
    setError(null)
    startTransition(async () => {
      const result = await createPaypalRegistration({ tournamentId, skillLevel })
      if (!result.ok) {
        setError(result.error)
        return
      }
      router.push(`/tournaments/${tournamentId}/register/success`)
    })
  }

  function handleFreeRegister() {
    if (skillLevel === null) return
    setError(null)
    startTransition(async () => {
      const result = await startCheckout({ tournamentId, skillLevel })
      if (!result.ok) {
        setError(result.error)
        return
      }
      // Free flow returns a relative URL
      router.push(result.redirectUrl)
    })
  }

  function handleRegisterOnly() {
    if (skillLevel === null) return
    setError(null)
    startTransition(async () => {
      const result = await registerForTournament({ tournamentId, skillLevel })
      if (!result.ok) {
        setError(result.error)
        return
      }
      onClose()
      router.refresh()
    })
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
          <h3 className="text-lg font-bold text-white">
            {isFree ? "Iscrizione" : mode === "register" ? "Iscrizione" : "Metodo di pagamento"}
          </h3>
          <button
            onClick={onClose}
            disabled={isPending}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--surface-3)] disabled:opacity-50"
          >
            <X className="h-4 w-4 text-[var(--muted-text)]" />
          </button>
        </div>

        <div className="flex flex-col gap-3 px-5" style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 5rem)" }}>
          {/* Skill level selector (always required) */}
          <div className="flex flex-col gap-2">
            <p className="text-sm font-semibold text-white">Livello di abilità</p>
            <div className="grid grid-cols-3 gap-2">
              {[1, 2, 3].map((lvl) => {
                const selected = skillLevel === lvl
                return (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setSkillLevel(lvl)}
                    disabled={isPending}
                    className={cn(
                      "flex min-h-[3.5rem] flex-col items-center justify-center rounded-2xl px-2 py-2 text-center transition-colors disabled:opacity-60",
                      selected
                        ? "bg-[var(--accent)] text-black"
                        : "bg-[var(--surface-2)] text-white active:bg-white/10",
                    )}
                  >
                    <span className="text-xs font-bold uppercase tracking-wide">L{lvl}</span>
                    <span className="text-sm font-bold">{SKILL_LEVEL_LABELS[lvl]}</span>
                  </button>
                )
              })}
            </div>
            {skillLevel === null && (
              <p className="text-xs text-[var(--muted-text)]">
                Seleziona il tuo livello per continuare.
              </p>
            )}
          </div>

          {/* Action buttons — branch on free / register / pay */}
          {isFree ? (
            <button
              type="button"
              onClick={handleFreeRegister}
              disabled={!canAct}
              className="mt-2 flex min-h-[3.5rem] items-center justify-center gap-2 rounded-2xl bg-[var(--accent)] font-black text-black active:brightness-90 disabled:opacity-50"
            >
              {isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : "Iscriviti gratis"}
            </button>
          ) : mode === "register" ? (
            <button
              type="button"
              onClick={handleRegisterOnly}
              disabled={!canAct}
              className="mt-2 flex min-h-[3.5rem] items-center justify-center gap-2 rounded-2xl bg-[var(--accent)] font-black text-black active:brightness-90 disabled:opacity-50"
            >
              {isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : "Iscriviti"}
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={handleStripe}
                disabled={!canAct}
                className="flex min-h-[3.5rem] items-center gap-3 rounded-2xl bg-[var(--surface-2)] px-4 py-3 text-left active:bg-white/10 disabled:opacity-50"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--accent)]/20 text-[var(--accent)]">
                  <CreditCard className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-base font-bold text-white">
                    Carta, Apple/Google Pay
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
                disabled={!canAct}
                className="flex min-h-[3.5rem] items-center gap-3 rounded-2xl bg-[var(--surface-2)] px-4 py-3 text-left active:bg-white/10 disabled:opacity-50"
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

              <button
                type="button"
                onClick={handlePaypal}
                disabled={!canAct}
                className="flex min-h-[3.5rem] items-center gap-3 rounded-2xl bg-[var(--surface-2)] px-4 py-3 text-left active:bg-white/10 disabled:opacity-50"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#003087]/20 text-[#009cde]">
                  <Wallet className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-base font-bold text-white">PayPal</p>
                  <p className="text-sm text-[var(--muted-text)]">
                    Invia il pagamento a paypal.me/lilconti
                  </p>
                </div>
                {isPending && <Loader2 className="h-5 w-5 animate-spin text-[var(--accent)]" />}
              </button>
            </>
          )}

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
