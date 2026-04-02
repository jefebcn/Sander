import { ChevronLeft } from "lucide-react"
import Link from "next/link"
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm"

export default function ForgotPasswordPage() {
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
          href="/auth/signin"
          aria-label="Indietro"
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--surface-2)] text-[var(--muted-text)] transition-colors active:bg-[var(--surface-3)]"
        >
          <ChevronLeft className="h-5 w-5" aria-hidden="true" />
        </Link>
      </div>

      <div className="relative z-10 mt-8 space-y-8">
        <div className="space-y-1">
          <h1 className="text-2xl font-black text-white">Password dimenticata?</h1>
          <p className="text-sm text-[var(--muted-text)]">
            Nessun problema, ti mandiamo un link.
          </p>
        </div>

        <ForgotPasswordForm />
      </div>
    </div>
  )
}
