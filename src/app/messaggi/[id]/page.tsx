export const dynamic = "force-dynamic"

import { redirect } from "next/navigation"
import { getThread } from "@/actions/messages"
import { getCurrentPlayer } from "@/lib/getCurrentPlayer"
import { ConversationView } from "@/components/chat/ConversationView"

export default async function ThreadPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ proponi?: string }>
}) {
  const { id } = await params
  const { proponi } = await searchParams
  const me = await getCurrentPlayer()
  if (!me) redirect(`/auth/signin?callbackUrl=/messaggi/${id}`)

  const thread = await getThread(id).catch(() => null)
  if (!thread) redirect("/messaggi")

  return (
    <div className="fixed inset-0 z-[100] bg-[var(--background)]">
      <ConversationView threadId={id} initial={thread} backHref="/messaggi" openPropose={proponi === "1"} />
    </div>
  )
}
