"use client"

import { useEffect } from "react"
import { AlertTriangle, RefreshCw } from "lucide-react"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Global error:", error)
  }, [error])

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <AlertTriangle className="h-12 w-12 text-[var(--danger)]" />
      <h2 className="text-xl font-black">Qualcosa è andato storto</h2>
      <p className="max-w-sm text-sm text-[var(--muted-text)]">
        {error.message || "Si è verificato un errore imprevisto."}
      </p>
      <button
        onClick={reset}
        className="flex min-h-[3.5rem] items-center gap-2 rounded-2xl bg-[var(--surface-2)] px-6 font-semibold transition-colors hover:bg-[var(--surface-3)]"
      >
        <RefreshCw className="h-4 w-4" />
        Riprova
      </button>
    </div>
  )
}
