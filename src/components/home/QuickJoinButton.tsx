"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Plus, Loader2 } from "lucide-react"
import { quickJoinSession } from "@/actions/sessions"
import { useHaptic } from "@/lib/useHaptic"

/** "Entra": takes the free seat right from the home, no detour. */
export function QuickJoinButton({
  sessionId,
  context,
  label = "Entra",
}: {
  sessionId: string
  /** Which match, for screen readers: every card has the same "Entra". */
  context: string
  label?: string
}) {
  const [pending, startTransition] = useTransition()
  const router = useRouter()
  const haptic = useHaptic()

  function join() {
    haptic("light")
    startTransition(async () => {
      try {
        const res = await quickJoinSession({ sessionId })
        if (res.ok) {
          haptic("success")
          // The action revalidates "/", so the home re-renders with the match
          // moved up to "La tua prossima partita": no extra refresh needed.
          toast.success("Sei dentro! Ci vediamo in campo", {
            action: { label: "Apri", onClick: () => router.push(`/sessions/${sessionId}`) },
          })
        } else {
          haptic("error")
          toast.error(res.error)
        }
      } catch {
        // Offline on the beach, or the app was updated meanwhile: keep the
        // home on screen instead of falling to the error page.
        haptic("error")
        toast.error("Connessione assente, riprova")
      }
    })
  }

  return (
    <button
      type="button"
      onClick={join}
      disabled={pending}
      aria-busy={pending}
      aria-label={`${label}: ${context}`}
      className="pressable flex min-h-[3.5rem] w-full items-center justify-center gap-1.5 rounded-[var(--radius-md)] bg-[var(--accent-soft)] text-base font-extrabold text-[var(--accent)] ring-1 ring-[var(--accent-line)] active:bg-[var(--accent)] active:text-black disabled:opacity-60"
    >
      {pending ? (
        <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
      ) : (
        <Plus className="h-5 w-5" strokeWidth={3} aria-hidden="true" />
      )}
      {label}
    </button>
  )
}
