"use client"

import { useEffect } from "react"
import Link from "next/link"
import { AlertTriangle, RefreshCw, ArrowLeft } from "lucide-react"

export default function TournamentError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Tournament error:", error)
  }, [error])

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <AlertTriangle className="h-12 w-12 text-[var(--danger)]" />
      <h2 className="text-xl font-black">Errore nel torneo</h2>
      <p className="max-w-sm text-sm text-[var(--muted-text)]">
        {error.message || "Si è verificato un errore durante il caricamento del torneo."}
      </p>
      <div className="flex gap-3">
        <Link
          href="/tournaments"
          className="flex min-h-[3.5rem] items-center gap-2 rounded-2xl bg-[var(--surface-2)] px-5 font-semibold transition-colors hover:bg-[var(--surface-3)]"
        >
          <ArrowLeft className="h-4 w-4" />
          Tornei
        </Link>
        <button
          onClick={reset}
          className="flex min-h-[3.5rem] items-center gap-2 rounded-2xl bg-[var(--accent)] px-5 font-semibold text-black transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          Riprova
        </button>
      </div>
    </div>
  )
}
