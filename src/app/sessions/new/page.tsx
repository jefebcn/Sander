export const dynamic = "force-dynamic"

import { redirect } from "next/navigation"
import { getCurrentPlayer } from "@/lib/getCurrentPlayer"
import { getCurrentSession } from "@/lib/getCurrentPlayer"
import { CreateSessionForm } from "@/components/session/CreateSessionForm"
import { PageHeader } from "@/components/layout/PageHeader"
import { SignInButton } from "@/components/auth/SignInButton"

export default async function NewSessionPage() {
  const [authSession, player] = await Promise.all([getCurrentSession(), getCurrentPlayer()])

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

  return (
    <div className="pb-6">
      <PageHeader title="Nuova Sessione" backHref="/sessions" />
      <CreateSessionForm />
    </div>
  )
}
