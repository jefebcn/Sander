export const dynamic = "force-dynamic"

import { redirect } from "next/navigation"
import { getThread } from "@/actions/messages"
import { getCurrentPlayer } from "@/lib/getCurrentPlayer"
import { ConversationView } from "@/components/chat/ConversationView"

export default async function ThreadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const me = await getCurrentPlayer()
  if (!me) redirect(`/auth/signin?callbackUrl=/messaggi/${id}`)

  const thread = await getThread(id).catch(() => null)
  if (!thread) redirect("/messaggi")

  return (
    <div className="fixed inset-0 z-[100] bg-[var(--background)]">
      <ConversationView threadId={id} initial={thread} backHref="/messaggi" />
    </div>
  )
}
