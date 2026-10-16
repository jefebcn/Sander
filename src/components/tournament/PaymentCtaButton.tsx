"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { startCheckout, cancelMyRegistration } from "@/actions/registration"
import type { RegistrationUiStatus } from "@/lib/tournament/registrationPayment"
import { PaymentMethodSheet } from "./PaymentMethodSheet"

type Status = RegistrationUiStatus | "CLOSED"
type SheetMode = "pay" | "register"

/** Fixed CTAs sit above the mobile bottom nav (~5rem + safe area); flush on desktop. */
const FIXED_BAR =
  "fixed inset-x-0 z-[100] bottom-[calc(5rem+env(safe-area-inset-bottom,0px))] md:bottom-0"

export function PaymentCtaButton({
  tournamentId,
  isFree,
  status,
  isAuthed,
  inline = false,
  currentSkillLevel = null,
  registrationId = null,
}: {
  tournamentId: string
  isFree: boolean
  status: Status
  isAuthed: boolean
  inline?: boolean
  currentSkillLevel?: number | null
  /** The viewer's own registration, needed to let them cancel a pending one. */
  registrationId?: string | null
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [sheetOpen, setSheetOpen] = useState(false)
  const [sheetMode, setSheetMode] = useState<SheetMode>("pay")
  const [error, setError] = useState<string | null>(null)

  function redirectToAuth() {
    router.push(`/auth/signin?callbackUrl=/tournaments/${tournamentId}`)
  }

  // Used by /register fixed-bar: open sheet so user can pick skill level and (if paid) method
  function handleClick() {
    if (!isAuthed) { redirectToAuth(); return }
    setSheetMode("pay")
    setSheetOpen(true)
  }

  // Inline step-1: open sheet to pick skill level and register (no payment yet)
  function handleRegister() {
    if (!isAuthed) { redirectToAuth(); return }
    setSheetMode("register")
    setSheetOpen(true)
  }

  function openPaySheet() {
    setError(null)
    setSheetMode("pay")
    setSheetOpen(true)
  }

  // Resume existing Stripe session
  function handleCompleteStripe() {
    setError(null)
    startTransition(async () => {
      const result = await startCheckout({ tournamentId })
      if (!result.ok) {
        setError(result.error)
        // The registration may have changed server-side (e.g. card payment
        // unavailable → back to "registered, not paid").
        router.refresh()
        return
      }
      if (result.redirectUrl.startsWith("http")) {
        window.location.href = result.redirectUrl
      } else {
        router.push(result.redirectUrl)
      }
    })
  }

  function handleCancel() {
    if (!registrationId) return
    if (!window.confirm("Vuoi annullare la tua iscrizione a questo torneo?")) return
    setError(null)
    startTransition(async () => {
      const result = await cancelMyRegistration({ registrationId })
      if (!result.ok) setError(result.error)
      router.refresh()
    })
  }

  const cancelLink = registrationId ? (
    <button
      type="button"
      onClick={handleCancel}
      disabled={isPending}
      className="flex min-h-[3.5rem] w-full items-center justify-center rounded-2xl text-base font-bold text-[var(--muted-text)] transition-colors hover:text-white disabled:opacity-60"
    >
      Annulla iscrizione
    </button>
  ) : null

  const paySheet = (
    <PaymentMethodSheet
      open={sheetOpen}
      onClose={() => setSheetOpen(false)}
      tournamentId={tournamentId}
      isFree={isFree}
      mode={sheetMode}
      initialSkillLevel={currentSkillLevel}
    />
  )

  // ── Inline variant (tournament detail page) ──────────────────
  if (inline) {
    if (status === "PAID") return <InlineDisabled label="Sei già iscritto ✓" />
    if (status === "CLOSED") return <InlineDisabled label="Iscrizioni chiuse" />

    if (status === "PENDING_CASH" || status === "PENDING_PAYPAL") {
      return (
        <>
          {error && <InlineError error={error} />}
          <InlineDisabled
            label={status === "PENDING_CASH" ? "In attesa di conferma contanti" : "In attesa di conferma PayPal"}
          />
          {cancelLink}
        </>
      )
    }

    if (status === "REGISTERED_UNPAID") {
      return (
        <>
          {error && <InlineError error={error} />}
          <button
            type="button"
            onClick={openPaySheet}
            disabled={isPending}
            className="flex min-h-[3.5rem] w-full items-center justify-center gap-2 rounded-2xl bg-[var(--accent)] font-black text-base text-black transition-all active:brightness-90 disabled:opacity-60"
          >
            Paga ora iscrizione
          </button>
          {cancelLink}
          {paySheet}
        </>
      )
    }

    if (status === "PENDING_STRIPE") {
      return (
        <>
          {error && <InlineError error={error} />}
          <button
            type="button"
            onClick={handleCompleteStripe}
            disabled={isPending}
            className="flex min-h-[3.5rem] w-full items-center justify-center gap-2 rounded-2xl bg-[var(--accent)] font-black text-base text-black transition-all active:brightness-90 disabled:opacity-60"
          >
            {isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : "Completa pagamento"}
          </button>
          {/* A card payment that can't go through must never be a dead end. */}
          <button
            type="button"
            onClick={openPaySheet}
            disabled={isPending}
            className="flex min-h-[3.5rem] w-full items-center justify-center rounded-2xl bg-[var(--surface-2)] text-base font-bold text-white active:bg-white/10 disabled:opacity-60"
          >
            Paga in contanti o PayPal
          </button>
          {cancelLink}
          {paySheet}
        </>
      )
    }

    // NOT_REGISTERED: step-1 register (or free-flow)
    return (
      <>
        {error && <InlineError error={error} />}
        <button
          type="button"
          onClick={handleRegister}
          disabled={isPending}
          className="flex min-h-[3.5rem] w-full items-center justify-center gap-2 rounded-2xl bg-[var(--accent)] font-black text-base text-black transition-all active:brightness-90 disabled:opacity-60"
        >
          {isPending ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : isFree ? "Iscriviti gratis" : "Iscriviti"}
        </button>
        {paySheet}
      </>
    )
  }

  // ── Fixed bottom bar (/register page) ───────────────────────
  if (status === "PAID") return <BottomBanner label="Sei già iscritto" variant="disabled" />
  if (status === "CLOSED") return <BottomBanner label="Iscrizioni chiuse" variant="disabled" />
  if (status === "PENDING_CASH" || status === "PENDING_PAYPAL") {
    return <BottomBanner label="In attesa di conferma" variant="disabled" />
  }

  const label =
    status === "PENDING_STRIPE" ? "Completa pagamento"
    : isFree ? "Iscriviti gratis"
    : "Paga ora iscrizione"

  return (
    <>
      <div className={cn(FIXED_BAR, "flex flex-col")}>
        {error && (
          <p className="mx-4 mb-2 rounded-xl bg-[var(--danger)]/15 px-4 py-3 text-base text-[var(--danger)]">
            {error}
          </p>
        )}
        {status === "PENDING_STRIPE" && (
          <button
            type="button"
            onClick={openPaySheet}
            disabled={isPending}
            className="flex min-h-[3.5rem] w-full items-center justify-center bg-[var(--surface-2)] text-base font-bold text-white active:bg-white/10 disabled:opacity-60"
          >
            Paga in contanti o PayPal
          </button>
        )}
        <button
          type="button"
          onClick={status === "PENDING_STRIPE" ? handleCompleteStripe : handleClick}
          disabled={isPending}
          className={cn(
            "flex min-h-[4rem] w-full flex-shrink-0 items-center justify-center font-black text-lg text-black transition-all",
            "bg-[var(--accent)] active:brightness-90 disabled:opacity-60",
            "md:pb-[env(safe-area-inset-bottom,0px)]",
          )}
        >
          {isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : label}
        </button>
      </div>

      {paySheet}
    </>
  )
}

function InlineDisabled({ label }: { label: string }) {
  return (
    <div className="flex min-h-[3.5rem] w-full items-center justify-center rounded-2xl bg-[var(--surface-2)] text-base font-bold text-[var(--muted-text)]">
      {label}
    </div>
  )
}

function InlineError({ error }: { error: string }) {
  return (
    <p role="alert" className="rounded-xl bg-[var(--danger)]/15 px-4 py-3 text-base text-[var(--danger)]">
      {error}
    </p>
  )
}

function BottomBanner({
  label,
  variant,
  onClick,
}: {
  label: string
  variant: "accent" | "disabled"
  onClick?: () => void
}) {
  return (
    <div className={FIXED_BAR}>
      <button
        type="button"
        onClick={onClick}
        disabled={!onClick}
        className={cn(
          "flex min-h-[4rem] w-full items-center justify-center font-black text-lg transition-all md:pb-[env(safe-area-inset-bottom,0px)]",
          variant === "accent"
            ? "bg-[var(--accent)] text-black active:brightness-90"
            : "bg-[var(--surface-3)] text-[var(--muted-text)]",
        )}
      >
        {label}
      </button>
    </div>
  )
}
