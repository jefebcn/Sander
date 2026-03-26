export const dynamic = "force-dynamic"

import { ChevronLeft, Sun } from "lucide-react"
import Link from "next/link"
import { SignInButton } from "@/components/auth/SignInButton"

export default function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>
}) {
  return (
    <div className="relative flex min-h-dvh flex-col bg-[#0a0a0a] px-6 pb-10 pt-safe">
      {/* Subtle glow */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 35% at 50% 0%, rgba(255,214,0,0.08) 0%, transparent 60%)",
        }}
        aria-hidden="true"
      />

      {/* Back button */}
      <div className="relative z-10 flex items-center pt-14">
        <Link
          href="/"
          aria-label="Indietro"
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--surface-2)] text-[var(--muted-text)] transition-colors active:bg-[var(--surface-3)]"
        >
          <ChevronLeft className="h-5 w-5" aria-hidden="true" />
        </Link>
      </div>

      {/* Main content */}
      <div className="relative z-10 flex flex-1 flex-col justify-between">
        {/* Header */}
        <div className="mt-10 space-y-2">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--accent)]/10 ring-1 ring-[var(--accent)]/20">
              <Sun className="h-6 w-6 text-[var(--accent)]" aria-hidden="true" />
            </div>
            <span className="text-2xl font-black tracking-tight text-[var(--foreground)]">
              SANDER
            </span>
          </div>
          <h1 className="text-3xl font-black leading-tight text-[var(--foreground)]">
            Accedi al tuo
            <br />
            <span className="text-[var(--accent)]">profilo</span>
          </h1>
          <p className="text-sm text-[var(--muted-text)]">
            Tieni traccia dei tuoi risultati e livello
          </p>
        </div>

        {/* Auth buttons */}
        <AuthButtons />
      </div>
    </div>
  )
}

function AuthButtons() {
  return (
    <div className="space-y-3">
      <p className="text-center text-xs font-medium uppercase tracking-widest text-[var(--muted-text)]">
        Scegli come accedere
      </p>

      {/* Google */}
      <SignInButton callbackUrl="/sessions" />

      {/* Divider */}
      <div className="flex items-center gap-3 py-1">
        <div className="h-px flex-1 bg-[var(--border)]" />
        <span className="text-xs text-[var(--muted-text)]">oppure</span>
        <div className="h-px flex-1 bg-[var(--border)]" />
      </div>

      {/* Continue as guest */}
      <Link
        href="/sessions"
        className="flex min-h-[3.5rem] w-full items-center justify-center gap-2 rounded-2xl bg-[var(--surface-2)] text-sm font-semibold text-[var(--foreground)] transition-all active:bg-[var(--surface-3)]"
      >
        Continua senza account
      </Link>

      <p className="text-center text-xs text-[var(--muted-text)]">
        Accedendo accetti i nostri Termini di Servizio
      </p>
    </div>
  )
}
