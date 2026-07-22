"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { ChevronLeft, Send } from "lucide-react"
import { getThread, sendMessage, markThreadRead } from "@/actions/messages"

type ThreadData = Awaited<ReturnType<typeof getThread>>

function timeLabel(iso: string): string {
  return new Date(iso).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })
}

export function ConversationView({
  threadId,
  initial,
  embedded = false,
  backHref,
}: {
  threadId: string
  initial: ThreadData
  embedded?: boolean
  backHref?: string
}) {
  const qc = useQueryClient()
  const [text, setText] = useState("")
  const bottomRef = useRef<HTMLDivElement>(null)

  const { data } = useQuery({
    queryKey: ["thread", threadId],
    queryFn: () => getThread(threadId),
    initialData: initial,
    refetchInterval: 5000,
    refetchOnWindowFocus: true,
  })

  const thread = data ?? initial
  const messages = thread.messages
  const isGroup = thread.kind === "SESSION"

  const send = useMutation({
    mutationFn: (body: string) => sendMessage({ threadId, body }),
    onSettled: () => qc.invalidateQueries({ queryKey: ["thread", threadId] }),
  })

  // Mark read on open and whenever new messages arrive while viewing.
  useEffect(() => {
    markThreadRead(threadId)
  }, [threadId, messages.length])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages.length])

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const body = text.trim()
    if (!body || send.isPending) return
    setText("")
    send.mutate(body)
  }

  return (
    <div className={embedded ? "flex flex-col" : "flex h-full flex-col"}>
      {/* Header */}
      <div
        className="flex items-center gap-2 border-b border-[var(--border)] px-3 py-3"
        style={!embedded ? { paddingTop: "calc(env(safe-area-inset-top, 0px) + 0.75rem)" } : undefined}
      >
        {backHref && (
          <Link
            href={backHref}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--surface-2)] text-white"
            aria-label="Indietro"
          >
            <ChevronLeft className="h-5 w-5" />
          </Link>
        )}
        <div className="min-w-0">
          <p className="truncate text-base font-black text-white">{thread.title}</p>
          <p className="text-xs text-[var(--muted-text)]">
            {isGroup ? "Chat della partita" : "Messaggio diretto"}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div
        className="flex-1 space-y-2 overflow-y-auto px-3 py-4"
        style={embedded ? { maxHeight: "55vh" } : undefined}
      >
        {messages.length === 0 ? (
          <p className="pt-10 text-center text-sm text-[var(--muted-text)]">
            Nessun messaggio. Scrivi per primo 👋
          </p>
        ) : (
          messages.map((m) => (
            <div key={m.id} className={`flex ${m.mine ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[78%] rounded-2xl px-3.5 py-2 ${
                  m.mine ? "bg-[var(--accent)] text-black" : "bg-[var(--surface-2)] text-white"
                }`}
              >
                {isGroup && !m.mine && (
                  <p className="mb-0.5 text-xs font-black text-[var(--accent)]">{m.senderName}</p>
                )}
                <p className="whitespace-pre-wrap break-words text-base leading-snug">{m.body}</p>
                <p className={`mt-0.5 text-right text-[0.6rem] ${m.mine ? "text-black/50" : "text-white/40"}`}>
                  {timeLabel(m.createdAt)}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Composer */}
      <form
        onSubmit={submit}
        className="flex items-center gap-2 border-t border-[var(--border)] px-3 py-3"
        style={!embedded ? { paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 0.5rem)" } : undefined}
      >
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Scrivi un messaggio…"
          maxLength={2000}
          className="min-h-[3rem] flex-1 rounded-2xl bg-[var(--surface-2)] px-4 text-base text-white placeholder:text-[var(--muted-text)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
        />
        <button
          type="submit"
          disabled={!text.trim() || send.isPending}
          aria-label="Invia"
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full font-black text-black transition-opacity active:opacity-80 disabled:opacity-40"
          style={{ background: "var(--accent)" }}
        >
          <Send className="h-5 w-5" />
        </button>
      </form>
    </div>
  )
}
