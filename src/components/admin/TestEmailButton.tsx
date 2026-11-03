"use client"

import { useState, useTransition } from "react"
import { Loader2, Mail } from "lucide-react"
import { adminTestEmail } from "@/actions/adminSystem"

/** Sends a test email to the admins and shows Resend's answer. */
export function TestEmailButton() {
  const [pending, startTransition] = useTransition()
  const [status, setStatus] = useState<string | null>(null)

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={() =>
          startTransition(async () => {
            try {
              setStatus(await adminTestEmail())
            } catch {
              setStatus("Non inviata: errore imprevisto, riprova.")
            }
          })
        }
        disabled={pending}
        className="flex min-h-[3.5rem] items-center justify-center gap-2 rounded-[var(--radius-md)] bg-[var(--accent)] px-5 text-base font-extrabold text-black disabled:opacity-60"
      >
        {pending ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> : <Mail className="h-5 w-5" aria-hidden="true" />}
        {pending ? "Invio in corso…" : "Invia email di prova"}
      </button>
      {status && <p className="text-base text-white" role="status">{status}</p>}
    </div>
  )
}
