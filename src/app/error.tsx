"use client"

import { useEffect } from "react"
import Link from "next/link"
import { CloudOff, RefreshCw } from "lucide-react"
import { reportError } from "@/lib/reportError"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Global error:", error)
    reportError(error, error.digest)
  }, [error])

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--surface-2)]">
        <CloudOff className="h-8 w-8 text-[var(--muted-text)]" aria-hidden="true" />
      </span>
      <h2 className="font-hand text-[2.3rem] text-white">Palla fuori</h2>
      <p className="max-w-xs text-base text-[var(--muted-text)]">
        Qualcosa non ha funzionato. Riprova: di solito basta. Se succede ancora, torna alla home.
      </p>
      <div className="flex w-full max-w-xs flex-col gap-2">
        <button
          onClick={reset}
          className="flex min-h-[3.5rem] items-center justify-center gap-2 rounded-[var(--radius-md)] bg-[var(--accent)] px-6 text-base font-extrabold text-black"
        >
          <RefreshCw className="h-5 w-5" aria-hidden="true" />
          Riprova
        </button>
        <Link
          href="/"
          className="flex min-h-[3.5rem] items-center justify-center rounded-[var(--radius-md)] bg-[var(--surface-2)] px-6 text-base font-bold text-white"
        >
          Torna alla home
        </Link>
      </div>
      {/* The raw message helps when someone sends a screenshot, but it is not
          for reading: kept folded, and wrapped so it can't widen the page. */}
      {(error.message || error.digest) && (
        <details className="max-w-xs text-left text-xs text-[var(--muted-text)]">
          <summary className="cursor-pointer py-2 text-center">Dettagli tecnici</summary>
          <p className="break-all opacity-70">
            {error.message}
            {error.digest && <> · {error.digest}</>}
          </p>
        </details>
      )}
    </div>
  )
}
