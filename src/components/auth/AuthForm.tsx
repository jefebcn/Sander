"use client"

import { useId, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { signIn } from "next-auth/react"
import { Eye, EyeOff, LogIn } from "lucide-react"
import { registerWithEmail } from "@/actions/auth"
import { trackEvent } from "@/lib/analytics"
import { cn } from "@/lib/utils"
import { safeCallbackUrl } from "@/lib/safeRedirect"

type Mode = "login" | "register"

interface AuthFormProps {
  callbackUrl: string
  inviteCode?: string
  defaultMode?: Mode
}

const INPUT =
  "w-full rounded-2xl bg-[var(--surface-2)] px-4 py-3.5 text-base text-white placeholder:text-[var(--muted-text)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
const LABEL = "mb-1 block px-1 text-sm font-semibold text-[var(--muted-text)]"

export function AuthForm({ callbackUrl: rawCallbackUrl, inviteCode: initialInviteCode, defaultMode = "login" }: AuthFormProps) {
  const [mode, setMode] = useState<Mode>(defaultMode)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [inviteCode, setInviteCode] = useState(initialInviteCode ?? "")
  const [showPwd, setShowPwd] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  // Re-checked here too: this value ends up in router.push and signIn.
  const callbackUrl = safeCallbackUrl(rawCallbackUrl)
  const id = useId()

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
          trackEvent("signup", { invited: inviteCode.trim() ? "yes" : "no" })
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
        router.push(callbackUrl)
        router.refresh()
      } catch (err) {
        setError(err instanceof Error ? err.message : "Errore imprevisto")
      }
    })
  }

  return (
    <div className="space-y-5">
      {/* Tab toggle */}
      <div className="flex rounded-2xl bg-[var(--surface-2)] p-1" role="group" aria-label="Accedi o registrati">
        {(["login", "register"] as Mode[]).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => { setMode(m); setError(null) }}
            aria-pressed={mode === m}
            className={cn(
              "flex min-h-[2.75rem] flex-1 items-center justify-center rounded-xl text-base font-bold transition-all",
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
        <div>
          <label htmlFor={`${id}-email`} className={LABEL}>Email</label>
          <input
            id={`${id}-email`}
            type="email"
            required
            autoComplete="email"
            inputMode="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="nome@esempio.it"
            className={INPUT}
          />
        </div>

        <div>
          <label htmlFor={`${id}-password`} className={LABEL}>
            Password{mode === "register" && <span className="font-normal"> (min. 8 caratteri)</span>}
          </label>
          <div className="relative">
            <input
              id={`${id}-password`}
              type={showPwd ? "text" : "password"}
              required
              autoComplete={mode === "register" ? "new-password" : "current-password"}
              minLength={mode === "register" ? 8 : 1}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={cn(INPUT, "pr-14")}
            />
            <button
              type="button"
              onClick={() => setShowPwd((v) => !v)}
              aria-label={showPwd ? "Nascondi password" : "Mostra password"}
              aria-pressed={showPwd}
              aria-controls={`${id}-password`}
              className="absolute right-1 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-xl text-[var(--muted-text)] active:text-white"
            >
              {showPwd ? <EyeOff className="h-5 w-5" aria-hidden="true" /> : <Eye className="h-5 w-5" aria-hidden="true" />}
            </button>
          </div>
        </div>

        {mode === "register" && (
          <>
            <div>
              <label htmlFor={`${id}-confirm`} className={LABEL}>Conferma password</label>
              <input
                id={`${id}-confirm`}
                type={showPwd ? "text" : "password"}
                required
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className={INPUT}
              />
            </div>
            <div>
              <label htmlFor={`${id}-invite`} className={LABEL}>
                Codice invito <span className="font-normal">(opzionale)</span>
              </label>
              <input
                id={`${id}-invite`}
                type="text"
                autoComplete="off"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                maxLength={9}
                className={cn(INPUT, "tracking-widest")}
              />
            </div>
          </>
        )}

        {error && (
          <p role="alert" className="rounded-xl bg-[var(--danger)]/15 px-4 py-2.5 text-base text-[var(--danger)]">
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
            className="flex min-h-[2.75rem] items-center justify-center text-center text-base text-[var(--muted-text)] underline-offset-2 hover:text-white"
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
