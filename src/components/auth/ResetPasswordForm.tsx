"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Eye, EyeOff, CheckCircle } from "lucide-react"
import { resetPassword } from "@/actions/auth"

interface Props {
  token: string
}

export function ResetPasswordForm({ token }: Props) {
  const router = useRouter()
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [showPwd, setShowPwd] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (password !== confirm) {
      setError("Le password non coincidono")
      return
    }

    startTransition(async () => {
      const result = await resetPassword({ token, password })
      if ("error" in result) {
        setError(result.error)
      } else {
        setDone(true)
        // Redirect to sign-in after 2s
        setTimeout(() => router.push("/auth/signin"), 2000)
      }
    })
  }

  if (done) {
    return (
      <div className="space-y-5 text-center">
        <div
          className="mx-auto flex h-16 w-16 items-center justify-center rounded-full"
          style={{ background: "rgba(198,247,54,0.12)" }}
        >
          <CheckCircle className="h-8 w-8 text-[var(--accent)]" />
        </div>
        <div className="space-y-2">
          <p className="text-lg font-bold text-white">Password aggiornata!</p>
          <p className="text-sm text-[var(--muted-text)]">
            Reindirizzamento al login...
          </p>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm text-[var(--muted-text)]">
        Scegli una nuova password di almeno 8 caratteri.
      </p>

      <div className="relative">
        <label htmlFor="reset-password" className="sr-only">Nuova password (min. 8 caratteri)</label>
        <input
          id="reset-password"
          type={showPwd ? "text" : "password"}
          required
          autoComplete="new-password"
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Nuova password (min. 8 caratteri)"
          className="w-full rounded-2xl bg-[var(--surface-2)] px-4 py-3.5 pr-14 text-base text-white placeholder:text-[var(--muted-text)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
        />
        <button
          type="button"
          onClick={() => setShowPwd((v) => !v)}
          aria-label={showPwd ? "Nascondi password" : "Mostra password"}
          aria-pressed={showPwd}
          aria-controls="reset-password"
          className="absolute right-1 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-xl text-[var(--muted-text)] active:text-white"
        >
          {showPwd ? <EyeOff className="h-5 w-5" aria-hidden="true" /> : <Eye className="h-5 w-5" aria-hidden="true" />}
        </button>
      </div>

      <label htmlFor="reset-confirm" className="sr-only">Conferma nuova password</label>
      <input
        id="reset-confirm"
        type={showPwd ? "text" : "password"}
        required
        autoComplete="new-password"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        placeholder="Conferma nuova password"
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
        className="flex min-h-[3.5rem] w-full items-center justify-center gap-2 rounded-full bg-[var(--accent)] font-bold text-black transition-all active:scale-[0.98] disabled:opacity-50"
      >
        {isPending ? (
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-black border-t-transparent" />
        ) : (
          "Reimposta password"
        )}
      </button>

      <Link
        href="/auth/signin"
        className="flex min-h-[2.75rem] items-center justify-center text-base text-[var(--muted-text)]"
      >
        Torna al login
      </Link>
    </form>
  )
}
