"use client"

import { useState, useTransition } from "react"
import { CreditCard, Loader2 } from "lucide-react"
import { adminTestSumUp } from "@/actions/adminSystem"

/** Checks the SumUp setup on the server and shows the answer. */
export function TestSumUpButton() {
  const [pending, startTransition] = useTransition()
  const [status, setStatus] = useState<string | null>(null)

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={() =>
          startTransition(async () => {
            try {
              setStatus(await adminTestSumUp())
            } catch {
              setStatus("Prova non riuscita: errore imprevisto, riprova.")
            }
          })
        }
        disabled={pending}
        className="flex min-h-[3.5rem] items-center justify-center gap-2 rounded-[var(--radius-md)] bg-[var(--accent)] px-5 text-base font-extrabold text-black disabled:opacity-60"
      >
        {pending ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> : <CreditCard className="h-5 w-5" aria-hidden="true" />}
        {pending ? "Controllo in corso…" : "Prova SumUp"}
      </button>
      {status && <p className="text-base text-white" role="status">{status}</p>}
    </div>
  )
}
