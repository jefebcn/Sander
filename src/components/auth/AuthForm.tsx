"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { signIn } from "next-auth/react"
import { Eye, EyeOff, LogIn } from "lucide-react"
import { registerWithEmail } from "@/actions/auth"
import { cn } from "@/lib/utils"

interface AuthFormProps {
  callbackUrl: string
  inviteCode?: string
}

type Mode = "login" | "register"

export function AuthForm({ callbackUrl, inviteCode: initialInviteCode }: AuthFormProps) {
  const [mode, setMode] = useState<Mode>("login")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [inviteCode, setInviteCode] = useState(initialInviteCode ?? "")
  const [showPwd, setShowPwd] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (mode === "register" && password !== confirm) {
      setError("Le password non coincidono")
      return
    }

    startTransition(async () => {
      try {
        if (mode === "register") {
          const reg = await registerWithEmail({ email, password, inviteCode: inviteCode.trim() || undefined })
          if ("error" in reg) {
            setError(reg.error)
            return
          }
        }
        const result = await signIn("credentials", {
          email,
          password,
          redirect: false,
        })
        if (!result || result.error) {
          setError("Email o password non corretti")
          return
        }
        window.location.href = callbackUrl
      } catch (err) {
        setError(err instanceof Error ? err.message : "Errore imprevisto")
      }
    })
  }

  return (
    <div className="space-y-5">
      {/* Tab toggle */}
      <div className="flex rounded-2xl bg-[var(--surface-2)] p-1">
        {(["login", "register"] as Mode[]).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => { setMode(m); setError(null) }}
            className={cn(
              "flex-1 rounded-xl py-2.5 text-sm font-bold transition-all",
              mode === m
                ? "bg-[var(--accent)] text-black"
                : "text-[var(--muted-text)]",
            )}
          >
            {m === "login" ? "Accedi" : "Registrati"}
          </button>
        ))}
      </div>

      {/* Email / password form */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="w-full rounded-2xl bg-[var(--surface-2)] px-4 py-3.5 text-base text-white placeholder:text-[var(--muted-text)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
        />

        <div className="relative">
          <input
            type={showPwd ? "text" : "password"}
            required
            minLength={mode === "register" ? 8 : 1}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={mode === "register" ? "Password (min. 8 caratteri)" : "Password"}
            className="w-full rounded-2xl bg-[var(--surface-2)] px-4 py-3.5 pr-12 text-base text-white placeholder:text-[var(--muted-text)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
          />
          <button
            type="button"
            onClick={() => setShowPwd((v) => !v)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--muted-text)]"
            tabIndex={-1}
          >
            {showPwd ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>

        {mode === "register" && (
          <>
            <input
              type={showPwd ? "text" : "password"}
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Conferma password"
              className="w-full rounded-2xl bg-[var(--surface-2)] px-4 py-3.5 text-base text-white placeholder:text-[var(--muted-text)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
            />
            <input
              type="text"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              placeholder="Codice invito (opzionale)"
              maxLength={9}
              className="w-full rounded-2xl bg-[var(--surface-2)] px-4 py-3.5 text-base text-white placeholder:text-[var(--muted-text)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] tracking-widest"
            />
          </>
        )}

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
            <>{mode === "login" ? "Accedi" : "Registrati"}</>
          )}
        </button>

        {mode === "login" && (
          <Link
            href="/auth/forgot-password"
            className="block text-center text-sm text-[var(--muted-text)] underline-offset-2 hover:text-white"
          >
            Password dimenticata?
          </Link>
        )}
      </form>

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-[var(--border)]" />
        <span className="text-xs text-[var(--muted-text)]">oppure</span>
        <div className="h-px flex-1 bg-[var(--border)]" />
      </div>

      {/* Google */}
      <button
        type="button"
        onClick={() => signIn("google", { callbackUrl })}
        className="flex min-h-[3.5rem] w-full items-center justify-center gap-3 rounded-2xl bg-[var(--surface-2)] font-semibold text-white transition-all active:bg-[var(--surface-3)]"
      >
        <LogIn className="h-5 w-5 text-[var(--accent)]" aria-hidden="true" />
        Continua con Google
      </button>
    </div>
  )
}
