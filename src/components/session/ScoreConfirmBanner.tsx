"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { CheckCircle2, Clock, ShieldAlert, ThumbsDown } from "lucide-react"
import { confirmSessionScore, disputeSessionScore } from "@/actions/sessions"
import type { ScoreState } from "@/lib/scoreConfirm"

const deadlineFmt = new Intl.DateTimeFormat("it-IT", { timeZone: "Europe/Rome", weekday: "long", hour: "2-digit", minute: "2-digit" })

/**
 * A submitted score waiting for the other team: they confirm or dispute it,
 * everyone else sees it is still pending. Nothing for a counted score.
 */
export function ScoreConfirmBanner({
  sessionId,
  state,
  canAnswer,
  isAdmin,
  deadline,
}: {
  sessionId: string
  state: ScoreState
  canAnswer: boolean
  isAdmin: boolean
  deadline: string | null
}) {
  const router = useRouter()
  const [busy, start] = useTransition()

  function run(action: (input: unknown) => Promise<unknown>, done: string) {
    start(async () => {
      try {
        await action(sessionId)
        toast.success(done)
        router.refresh()
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Non riuscito, riprova")
      }
    })
  }

  if (state === "none" || state === "confirmed") return null

  if (state === "disputed") {
    return (
      <div className="mt-3 flex flex-col gap-3 rounded-xl bg-[var(--surface-2)] p-4">
        <p className="flex items-start gap-2 text-base text-white">
          <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-[var(--danger)]" aria-hidden="true" />
          Risultato contestato: non conta per rating e classifica finché non si chiarisce.
        </p>
        {isAdmin && (
          <button
            type="button"
            disabled={busy}
            onClick={() => run(confirmSessionScore, "Risultato confermato")}
            className="btn btn-secondary"
          >
            Conferma comunque (admin)
          </button>
        )}
      </div>
    )
  }

  const until = deadline ? deadlineFmt.format(new Date(deadline)) : null
  if (state === "due" || !canAnswer) {
    return (
      <p className="mt-3 flex items-start gap-2 rounded-xl bg-[var(--surface-2)] p-4 text-base text-[var(--muted-text)]">
        <Clock className="mt-0.5 h-5 w-5 shrink-0 text-[var(--accent)]" aria-hidden="true" />
        {state === "due"
          ? "Nessuna risposta dall'altra squadra: il risultato vale così e viene contato a breve."
          : `In attesa di conferma dall'altra squadra${until ? ` (fino a ${until})` : ""}. Poi conta per rating e classifica.`}
      </p>
    )
  }

  return (
    <div className="mt-3 flex flex-col gap-3 rounded-xl bg-[var(--surface-2)] p-4">
      <p className="text-base font-bold text-white">Il risultato è giusto?</p>
      <p className="text-sm text-[var(--muted-text)]">
        L&apos;ha segnato l&apos;altra squadra. Se non rispondi{until ? ` entro ${until}` : ""} vale così.
      </p>
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => run(confirmSessionScore, "Confermato: il risultato conta")}
          className="btn btn-primary"
        >
          <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
          Confermo
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => {
            if (window.confirm("Contesti il risultato? Non conterà per rating e classifica.")) {
              run(disputeSessionScore, "Contestato: il risultato non conta")
            }
          }}
          className="btn btn-secondary"
        >
          <ThumbsDown className="h-5 w-5" aria-hidden="true" />
          Non è giusto
        </button>
      </div>
    </div>
  )
}
