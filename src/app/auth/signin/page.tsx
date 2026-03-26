export const dynamic = "force-dynamic"

import { ChevronLeft, Sun } from "lucide-react"
import Link from "next/link"
import { AuthForm } from "@/components/auth/AuthForm"

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>
}) {
  const { callbackUrl } = await searchParams
  const resolvedCallback = callbackUrl ?? "/sessions"

  return (
    <div className="relative flex min-h-dvh flex-col bg-[#0a0a0a] px-6 pb-10">
      {/* Glow */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 35% at 50% 0%, rgba(201,243,29,0.07) 0%, transparent 60%)",
        }}
        aria-hidden="true"
      />

      {/* Back */}
      <div className="relative z-10 flex items-center pt-14">
        <Link
          href="/"
          aria-label="Indietro"
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--surface-2)] text-[var(--muted-text)] transition-colors active:bg-[var(--surface-3)]"
        >
          <ChevronLeft className="h-5 w-5" aria-hidden="true" />
        </Link>
      </div>

      <div className="relative z-10 mt-8 space-y-8">
        {/* Header */}
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--accent)]/10 ring-1 ring-[var(--accent)]/20">
              <Sun className="h-6 w-6 text-[var(--accent)]" aria-hidden="true" />
            </div>
            <span className="text-2xl font-black tracking-tight text-white">SANDER</span>
          </div>
          <h1 className="text-3xl font-black leading-tight text-white">
            Entra nel campo.
          </h1>
          <p className="text-sm text-[var(--muted-text)]">
            Crea un account o accedi per continuare
          </p>
        </div>

        {/* Form */}
        <AuthForm callbackUrl={resolvedCallback} />

        <p className="text-center text-xs text-[var(--muted-text)]">
          Accedendo accetti i nostri Termini di Servizio
        </p>
      </div>
    </div>
  )
}
