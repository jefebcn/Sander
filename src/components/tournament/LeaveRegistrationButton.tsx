"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Loader2, LogOut } from "lucide-react"
import { cancelMyRegistration } from "@/actions/registration"

/**
 * Icon button next to the viewer's own name in the participants list.
 * Shows the server's reason (e.g. card payment already completed) instead of
 * crashing the page like a throwing server form action would.
 */
export function LeaveRegistrationButton({
  registrationId,
  label = "Disiscriviti",
}: {
  registrationId: string
  label?: string
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleClick() {
    if (!window.confirm("Vuoi annullare la tua iscrizione a questo torneo?")) return
    setError(null)
    startTransition(async () => {
      const result = await cancelMyRegistration({ registrationId })
      if (!result.ok) setError(result.error)
      router.refresh()
    })
  }

  return (
    <div className="flex flex-col items-end">
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        title={label}
        aria-label={label}
        className="flex h-11 w-11 items-center justify-center rounded-xl text-[var(--muted-text)] transition-colors hover:bg-[var(--danger)]/15 hover:text-[var(--danger)] disabled:opacity-60"
      >
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
      </button>
      {error && (
        <p role="alert" className="max-w-[14rem] text-right text-sm text-[var(--danger)]">
          {error}
        </p>
      )}
    </div>
  )
}
