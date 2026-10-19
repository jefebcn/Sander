export const dynamic = "force-dynamic"

import Image from "next/image"
import Link from "next/link"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { safeCallbackUrl } from "@/lib/safeRedirect"
import { AuthForm } from "@/components/auth/AuthForm"
import { BackButton } from "@/components/auth/BackButton"

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; invite?: string; mode?: string }>
}) {
  const { callbackUrl, invite, mode } = await searchParams
  // Same-site paths only: never hand an external URL to router.push/signIn.
  const resolvedCallback = safeCallbackUrl(callbackUrl)

  // Already signed in: the form has nothing to offer, go where they were headed.
  const session = await auth()
  if (session?.user?.id) {
    redirect(resolvedCallback.startsWith("/auth/") ? "/" : resolvedCallback)
  }

  const defaultMode = mode === "register" ? "register" : "login"

  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden bg-[var(--background)] px-6 pb-10">
      {/* Background video (muted, looping) — falls back to the dark bg if it fails */}
      <video
        autoPlay
        muted
        loop
        playsInline
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-40"
      >
        <source src="/beach-volley.mp4" type="video/mp4" />
      </video>
      {/* Readability overlay: darker toward the bottom where the form sits */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(to bottom, rgba(10,10,10,0.55) 0%, rgba(10,10,10,0.8) 55%, rgba(10,10,10,0.95) 100%)",
        }}
        aria-hidden="true"
      />

      {/* Glow */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 35% at 50% 0%, rgba(255,107,74,0.10) 0%, transparent 60%)",
        }}
        aria-hidden="true"
      />

      {/* Back */}
      <div className="relative z-10 flex items-center pt-14">
        <BackButton />
      </div>

      <div className="relative z-10 mt-4 space-y-8">
        {/* Logo centrato */}
        <div className="flex flex-col items-center gap-4">
          <Image
            src="/sander-logo-coral.png"
            alt="SANDER"
            width={140}
            height={140}
            className="object-contain"
          />
          <div className="space-y-1 text-center">
            <h1 className="font-display text-4xl font-extrabold leading-none text-white">
              Entra nel campo.
            </h1>
            <p className="text-sm text-[var(--muted-text)]">
              Crea un account o accedi per continuare
            </p>
          </div>
        </div>

        {/* Form */}
        <AuthForm callbackUrl={resolvedCallback} inviteCode={invite} defaultMode={defaultMode} />

        <p className="text-center text-sm text-[var(--muted-text)]">
          Accedendo accetti i nostri{" "}
          <Link href="/terms" className="inline-flex min-h-[2.75rem] items-center font-semibold text-white underline underline-offset-2">
            Termini di Servizio
          </Link>{" "}
          e la{" "}
          <Link href="/privacy" className="inline-flex min-h-[2.75rem] items-center font-semibold text-white underline underline-offset-2">
            Privacy Policy
          </Link>
        </p>
      </div>
    </div>
  )
}
