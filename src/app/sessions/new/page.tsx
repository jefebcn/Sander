export const dynamic = "force-dynamic"

import Link from "next/link"
import { redirect } from "next/navigation"
import { Sparkles } from "lucide-react"
import { getCurrentPlayer } from "@/lib/getCurrentPlayer"
import { getCurrentSession } from "@/lib/getCurrentPlayer"
import { CreateSessionForm } from "@/components/session/CreateSessionForm"
import { PageHeader } from "@/components/layout/PageHeader"
import { SignInButton } from "@/components/auth/SignInButton"
import { db } from "@/lib/db"

export default async function NewSessionPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>
}) {
  const [authSession, player, { from }] = await Promise.all([
    getCurrentSession(),
    getCurrentPlayer(),
    searchParams,
  ])

  if (!authSession) {
    return (
      <div className="px-4 pt-8">
        <PageHeader title="Nuova Partita" backHref="/sessions" />
        {/* Same choices as the landing: email sign-up/login, plus Google. */}
        <div className="space-y-3 rounded-2xl bg-[var(--surface-1)] p-6 text-center">
          <p className="text-base text-[var(--muted-text)]">Entra in SANDER per creare una partita.</p>
          <Link
            href={`/auth/signin?mode=register&callbackUrl=${encodeURIComponent("/sessions/new")}`}
            className="flex min-h-[3.5rem] items-center justify-center gap-2 rounded-2xl bg-[var(--accent)] text-base font-bold text-black"
          >
            <Sparkles className="h-5 w-5" aria-hidden="true" /> Crea un account gratis
          </Link>
          <Link
            href={`/auth/signin?callbackUrl=${encodeURIComponent("/sessions/new")}`}
            className="flex min-h-[3.5rem] items-center justify-center rounded-2xl bg-[var(--surface-2)] text-base font-bold text-white"
          >
            Ho già un account
          </Link>
          <SignInButton
            callbackUrl="/sessions/new"
            className="flex min-h-[3.5rem] w-full items-center justify-center gap-2 rounded-2xl bg-[var(--surface-2)] text-base font-semibold text-white"
          />
        </div>
      </div>
    )
  }

  if (!player) {
    redirect("/players/new?from=sessions")
  }

  let presets: {
    format: string
    location: string
    city: string | null
    paymentType: string
    quotaAmount: number | null
    loserPays: string | null
    matchMode: boolean
  } | null = null

  if (from) {
    presets = await db.session
      .findUnique({
        where: { id: from },
        select: {
          format: true,
          location: true,
          city: true,
          paymentType: true,
          quotaAmount: true,
          loserPays: true,
          matchMode: true,
        },
      })
      .catch(() => null)
  }

  const title = presets ? "Ricrea Partita" : "Nuova Partita"

  return (
    <div className="pb-6">
      <PageHeader title={title} backHref="/sessions" />
      {presets && (
        <p className="px-4 pb-2 text-sm text-[var(--accent)]">
          ↩ Precompilato dalla partita precedente
        </p>
      )}
      <CreateSessionForm presets={presets ?? undefined} defaultCity={player.homeCity ?? undefined} />
    </div>
  )
}
