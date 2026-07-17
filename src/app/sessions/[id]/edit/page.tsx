export const dynamic = "force-dynamic"

import { notFound, redirect } from "next/navigation"
import { getSession } from "@/actions/sessions"
import { getCurrentPlayer } from "@/lib/getCurrentPlayer"
import { PageHeader } from "@/components/layout/PageHeader"
import { EditSessionForm } from "@/components/session/EditSessionForm"

export default async function EditSessionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [session, player] = await Promise.all([
    getSession(id).catch(() => null),
    getCurrentPlayer(),
  ])

  if (!session) notFound()
  if (!player || session.organizerId !== player.id) redirect(`/sessions/${id}`)
  if (session.status === "COMPLETED" || session.status === "CANCELLED") redirect(`/sessions/${id}`)

  return (
    <div>
      <PageHeader title="Modifica partita" />
      <EditSessionForm
        session={{
          id: session.id,
          title: session.title,
          location: session.location,
          date: session.date.toISOString(),
          maxPlayers: session.maxPlayers,
          notes: session.notes ?? null,
        }}
      />
    </div>
  )
}
