export const dynamic = "force-dynamic"

import { redirect } from "next/navigation"
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
        <PageHeader title="Nuova Sessione" backHref="/sessions" />
        <div className="space-y-4 rounded-2xl bg-[var(--surface-1)] p-6 text-center">
          <p className="text-[var(--muted-text)]">Effettua l&apos;accesso per creare una sessione.</p>
          <SignInButton callbackUrl="/sessions/new" />
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
          paymentType: true,
          quotaAmount: true,
          loserPays: true,
          matchMode: true,
        },
      })
      .catch(() => null)
  }

  const title = presets ? "Ricrea Sessione" : "Nuova Sessione"

  return (
    <div className="pb-6">
      <PageHeader title={title} backHref="/sessions" />
      {presets && (
        <p className="px-4 pb-2 text-sm text-[var(--accent)]">
          ↩ Precompilato dalla sessione precedente
        </p>
      )}
      <CreateSessionForm presets={presets ?? undefined} />
    </div>
  )
}
