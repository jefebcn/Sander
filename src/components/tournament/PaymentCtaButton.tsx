"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { startCheckout } from "@/actions/registration"
import { PaymentMethodSheet } from "./PaymentMethodSheet"

type Status = "NOT_REGISTERED" | "PAID" | "PENDING_STRIPE" | "PENDING_CASH" | "CLOSED"

export function PaymentCtaButton({
  tournamentId,
  isFree,
  status,
  isAuthed,
  inline = false,
}: {
  tournamentId: string
  isFree: boolean
  status: Status
  isAuthed: boolean
  /** When true renders as a rounded inline button instead of fixed bottom bar */
  inline?: boolean
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [sheetOpen, setSheetOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleFreeRegistration() {
    setError(null)
    startTransition(async () => {
      const result = await startCheckout({ tournamentId })
      if (!result.ok) {
        setError(result.error)
        return
      }
      router.push(result.redirectUrl)
    })
  }

  function handleClick() {
    if (!isAuthed) {
      router.push(`/auth/signin?callbackUrl=/tournaments/${tournamentId}/register`)
      return
    }
    if (isFree) {
      handleFreeRegistration()
      return
    }
    setSheetOpen(true)
  }

  const statusLabel = isFree ? "Iscriviti gratis" : "Paga ora iscrizione"

  // ── Inline variant (used on tournament detail page) ──────────────
  if (inline) {
    const inlineDisabledLabel =
      status === "PAID" ? "Sei già iscritto ✓"
      : status === "PENDING_CASH" ? "In attesa di conferma contanti"
      : status === "CLOSED" ? "Iscrizioni chiuse"
      : null

    if (inlineDisabledLabel) {
      return (
        <div className="flex min-h-[3.5rem] w-full items-center justify-center rounded-2xl bg-[var(--surface-2)] text-sm font-bold text-[var(--muted-text)]">
          {inlineDisabledLabel}
        </div>
      )
    }

    const inlineLabel =
      status === "PENDING_STRIPE" ? "Completa pagamento" : statusLabel

    return (
      <>
        {error && (
          <p className="rounded-xl bg-[var(--danger)]/15 px-4 py-3 text-sm text-[var(--danger)]">
            {error}
          </p>
        )}
        <button
          type="button"
          onClick={handleClick}
          disabled={isPending}
          className="flex min-h-[3.5rem] w-full items-center justify-center gap-2 rounded-2xl bg-[var(--accent)] font-black text-base text-black transition-all active:brightness-90 disabled:opacity-60"
        >
          {isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : inlineLabel}
        </button>
        <PaymentMethodSheet
          open={sheetOpen}
          onClose={() => setSheetOpen(false)}
          tournamentId={tournamentId}
          isFree={isFree}
        />
      </>
    )
  }

  // ── Fixed bottom bar (default, used on /register page) ───────────
  if (status === "PAID") {
    return <BottomBanner label="Sei già iscritto" variant="disabled" />
  }
  if (status === "PENDING_STRIPE") {
    return <BottomBanner label="Completa pagamento" variant="accent" onClick={handleClick} />
  }
  if (status === "PENDING_CASH") {
    return <BottomBanner label="In attesa di conferma contanti" variant="disabled" />
  }
  if (status === "CLOSED") {
    return <BottomBanner label="Iscrizioni chiuse" variant="disabled" />
  }

  return (
    <>
      <div className="fixed inset-x-0 bottom-0 z-[100] flex flex-col">
        {error && (
          <p className="mx-4 mb-2 rounded-xl bg-[var(--danger)]/15 px-4 py-3 text-sm text-[var(--danger)]">
            {error}
          </p>
        )}
        <button
          type="button"
          onClick={handleClick}
          disabled={isPending}
          className={cn(
            "flex min-h-[4rem] w-full flex-shrink-0 items-center justify-center font-black text-lg text-black transition-all",
            "bg-[var(--accent)] active:brightness-90 disabled:opacity-60",
          )}
          style={{
            borderRadius: 0,
            paddingBottom: "env(safe-area-inset-bottom, 0px)",
          }}
        >
          {isPending ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : statusLabel}
        </button>
      </div>

      <PaymentMethodSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        tournamentId={tournamentId}
        isFree={isFree}
      />
    </>
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
    <div className="fixed inset-x-0 bottom-0 z-[100]">
      <button
        type="button"
        onClick={onClick}
        disabled={!onClick}
        className={cn(
          "flex min-h-[4rem] w-full items-center justify-center font-black text-lg transition-all",
          variant === "accent"
            ? "bg-[var(--accent)] text-black active:brightness-90"
            : "bg-[var(--surface-3)] text-[var(--muted-text)]",
        )}
        style={{
          borderRadius: 0,
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
        }}
      >
        {label}
      </button>
    </div>
  )
}
