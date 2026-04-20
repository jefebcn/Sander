"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { startCheckout } from "@/actions/registration"
import { PaymentMethodSheet } from "./PaymentMethodSheet"

type Status = "NOT_REGISTERED" | "PAID" | "PENDING_STRIPE" | "PENDING_CASH" | "REGISTERED_UNPAID" | "CLOSED"
type SheetMode = "pay" | "register"

export function PaymentCtaButton({
  tournamentId,
  isFree,
  status,
  isAuthed,
  inline = false,
  currentSkillLevel = null,
}: {
  tournamentId: string
  isFree: boolean
  status: Status
  isAuthed: boolean
  inline?: boolean
  currentSkillLevel?: number | null
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [sheetOpen, setSheetOpen] = useState(false)
  const [sheetMode, setSheetMode] = useState<SheetMode>("pay")
  const [error, setError] = useState<string | null>(null)

  function redirectToAuth() {
    router.push(`/auth/signin?callbackUrl=/tournaments/${tournamentId}/register`)
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

  // Inline: resume existing Stripe session
  function handleCompleteStripe() {
    setError(null)
    startTransition(async () => {
      const result = await startCheckout({ tournamentId })
      if (!result.ok) { setError(result.error); return }
      if (result.redirectUrl.startsWith("http")) {
        window.location.href = result.redirectUrl
      } else {
        router.push(result.redirectUrl)
      }
    })
  }

  // ── Inline variant (tournament detail page) ──────────────────
  if (inline) {
    if (status === "PAID") return <InlineDisabled label="Sei già iscritto ✓" />
    if (status === "PENDING_CASH") return <InlineDisabled label="In attesa di conferma contanti" />
    if (status === "CLOSED") return <InlineDisabled label="Iscrizioni chiuse" />

    if (status === "REGISTERED_UNPAID") {
      return (
        <>
          {error && <InlineError error={error} />}
          <button
            type="button"
            onClick={() => { setSheetMode("pay"); setSheetOpen(true) }}
            disabled={isPending}
            className="flex min-h-[3.5rem] w-full items-center justify-center gap-2 rounded-2xl bg-[var(--accent)] font-black text-base text-black transition-all active:brightness-90 disabled:opacity-60"
          >
            Paga ora iscrizione
          </button>
          <PaymentMethodSheet
            open={sheetOpen}
            onClose={() => setSheetOpen(false)}
            tournamentId={tournamentId}
            isFree={false}
            mode="pay"
            initialSkillLevel={currentSkillLevel}
          />
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
        <PaymentMethodSheet
          open={sheetOpen}
          onClose={() => setSheetOpen(false)}
          tournamentId={tournamentId}
          isFree={isFree}
          mode="register"
          initialSkillLevel={currentSkillLevel}
        />
      </>
    )
  }

  // ── Fixed bottom bar (/register page) ───────────────────────
  if (status === "PAID") return <BottomBanner label="Sei già iscritto" variant="disabled" />
  if (status === "PENDING_STRIPE") return <BottomBanner label="Completa pagamento" variant="accent" onClick={handleCompleteStripe} />
  if (status === "PENDING_CASH" || status === "REGISTERED_UNPAID") return <BottomBanner label="In attesa di conferma" variant="disabled" />
  if (status === "CLOSED") return <BottomBanner label="Iscrizioni chiuse" variant="disabled" />

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
          ) : isFree ? "Iscriviti gratis" : "Paga ora iscrizione"}
        </button>
      </div>

      <PaymentMethodSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        tournamentId={tournamentId}
        isFree={isFree}
        mode={sheetMode}
        initialSkillLevel={currentSkillLevel}
      />
    </>
  )
}

function InlineDisabled({ label }: { label: string }) {
  return (
    <div className="flex min-h-[3.5rem] w-full items-center justify-center rounded-2xl bg-[var(--surface-2)] text-sm font-bold text-[var(--muted-text)]">
      {label}
    </div>
  )
}

function InlineError({ error }: { error: string }) {
  return (
    <p className="rounded-xl bg-[var(--danger)]/15 px-4 py-3 text-sm text-[var(--danger)]">
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
