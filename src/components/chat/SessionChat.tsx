"use client"

import { useState } from "react"
import { MessageCircle } from "lucide-react"
import { getOrCreateSessionThread, getThread } from "@/actions/messages"
import { ConversationView } from "./ConversationView"

type ThreadData = Awaited<ReturnType<typeof getThread>>

/** Group chat for a session — collapsed to a button until a participant opens it. */
export function SessionChat({ sessionId }: { sessionId: string }) {
  const [state, setState] = useState<{ threadId: string; initial: ThreadData } | null>(null)
  const [loading, setLoading] = useState(false)

  async function openChat() {
    if (loading) return
    setLoading(true)
    try {
      const threadId = await getOrCreateSessionThread(sessionId)
      const initial = await getThread(threadId)
      setState({ threadId, initial })
    } catch {
      setLoading(false)
    }
  }

  if (state) {
    return (
      <div className="overflow-hidden rounded-2xl bg-[var(--surface-1)]">
        <ConversationView threadId={state.threadId} initial={state.initial} embedded />
      </div>
    )
  }

  return (
    <button
      onClick={openChat}
      disabled={loading}
      className="flex min-h-[3.5rem] w-full items-center justify-center gap-2 rounded-2xl bg-[var(--surface-2)] font-black text-white transition-opacity active:opacity-80 disabled:opacity-60"
    >
      <MessageCircle className="h-5 w-5 text-[var(--accent)]" />
      {loading ? "Apro…" : "Chat della partita"}
    </button>
  )
}
