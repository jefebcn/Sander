export const dynamic = "force-dynamic"

import Image from "next/image"
import { ChevronLeft } from "lucide-react"
import Link from "next/link"
import { AuthForm } from "@/components/auth/AuthForm"

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; invite?: string }>
}) {
  const { callbackUrl, invite } = await searchParams
  const resolvedCallback = callbackUrl ?? "/"

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

      <div className="relative z-10 mt-4 space-y-8">
        {/* Logo centrato */}
        <div className="flex flex-col items-center gap-4">
          <Image
            src="/sander-logo.png"
            alt="SANDER"
            width={140}
            height={140}
            className="object-contain"
          />
          <div className="space-y-1 text-center">
            <h1 className="text-3xl font-black leading-tight text-white">
              Entra nel campo.
            </h1>
            <p className="text-sm text-[var(--muted-text)]">
              Crea un account o accedi per continuare
            </p>
          </div>
        </div>

        {/* Form */}
        <AuthForm callbackUrl={resolvedCallback} inviteCode={invite} />

        <p className="text-center text-xs text-[var(--muted-text)]">
          Accedendo accetti i nostri Termini di Servizio
        </p>
      </div>
    </div>
  )
}
