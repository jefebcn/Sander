"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { Mail, ArrowLeft } from "lucide-react"
import { requestPasswordReset } from "@/actions/auth"

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("")
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      const result = await requestPasswordReset({ email })
      if ("error" in result) {
        setError(result.error)
      } else {
        setSent(true)
      }
    })
  }

  if (sent) {
    return (
      <div className="space-y-5 text-center">
        <div
          className="mx-auto flex h-16 w-16 items-center justify-center rounded-full"
          style={{ background: "rgba(201,243,29,0.12)" }}
        >
          <Mail className="h-8 w-8 text-[var(--accent)]" />
        </div>
        <div className="space-y-2">
          <p className="text-lg font-bold text-white">Controlla la tua email</p>
          <p className="text-sm text-[var(--muted-text)]">
            Se l&apos;indirizzo <strong className="text-white">{email}</strong> è
            registrato, riceverai un link per reimpostare la password entro qualche
            minuto.
          </p>
        </div>
        <Link
          href="/auth/signin"
          className="flex min-h-[3.5rem] w-full items-center justify-center gap-2 rounded-2xl bg-[var(--surface-2)] font-semibold text-white"
        >
          Torna al login
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm text-[var(--muted-text)]">
        Inserisci la tua email e ti invieremo un link per reimpostare la password.
      </p>

      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="La tua email"
        className="w-full rounded-2xl bg-[var(--surface-2)] px-4 py-3.5 text-base text-white placeholder:text-[var(--muted-text)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
      />

      {error && (
        <p className="rounded-xl bg-[var(--danger)]/15 px-4 py-2.5 text-sm text-[var(--danger)]">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="flex min-h-[3.5rem] w-full items-center justify-center gap-2 rounded-2xl bg-[var(--accent)] font-bold text-black transition-all active:scale-[0.98] disabled:opacity-50"
      >
        {isPending ? (
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-black border-t-transparent" />
        ) : (
          "Invia link di reset"
        )}
      </button>

      <Link
        href="/auth/signin"
        className="flex items-center justify-center gap-1.5 text-sm text-[var(--muted-text)]"
      >
        <ArrowLeft className="h-4 w-4" />
        Torna al login
      </Link>
    </form>
  )
}
