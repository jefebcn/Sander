"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { ChevronLeft, Send, Volleyball } from "lucide-react"
import { getThread, sendMessage, markThreadRead } from "@/actions/messages"
import { ProposeMatchSheet } from "./ProposeMatchSheet"

type ThreadData = Awaited<ReturnType<typeof getThread>>

function timeLabel(iso: string): string {
  return new Date(iso).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })
}

const LINK_RE = /(\/(?:sessions|tournaments)\/[a-zA-Z0-9_-]+)/g

/** Render message text, turning internal /sessions|/tournaments links into taps. */
function renderBody(body: string) {
  return body.split(LINK_RE).map((part, i) =>
    /^\/(?:sessions|tournaments)\/[a-zA-Z0-9_-]+$/.test(part) ? (
      <Link key={i} href={part} className="font-black underline underline-offset-2">
        Apri la partita →
      </Link>
    ) : (
      <span key={i}>{part}</span>
    ),
  )
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
  const [proposeOpen, setProposeOpen] = useState(false)
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
  const isGroup = thread.kind !== "DM" // show sender names for SESSION and GROUP
  const subtitle =
    thread.kind === "SESSION"
      ? "Chat della partita"
      : thread.kind === "GROUP"
        ? "Gruppo"
        : "Messaggio diretto"

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
          <p className="text-xs text-[var(--muted-text)]">{subtitle}</p>
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
                <p className="whitespace-pre-wrap break-words text-base leading-snug">{renderBody(m.body)}</p>
                <p className={`mt-0.5 text-right text-[0.6rem] ${m.mine ? "text-black/50" : "text-white/40"}`}>
                  {timeLabel(m.createdAt)}
                </p>
              </div>
            </div>
          ))
        )}
        {/* Read receipt (DM): status under my last message */}
        {thread.kind === "DM" && messages.length > 0 && messages[messages.length - 1].mine && (
          <p className="pr-1 text-right text-[0.65rem] text-[var(--muted-text)]">
            {thread.otherReadAt && thread.otherReadAt >= messages[messages.length - 1].createdAt
              ? "Letto ✓✓"
              : "Inviato ✓"}
          </p>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Propose a match (DM + groups, not session threads) */}
      {thread.kind !== "SESSION" && (
        <button
          onClick={() => setProposeOpen(true)}
          className="flex items-center justify-center gap-2 border-t border-[var(--border)] py-2.5 text-sm font-black text-[var(--accent)] active:opacity-70"
        >
          <Volleyball className="h-4 w-4" />
          Proponi una partita
        </button>
      )}

      {proposeOpen && (
        <ProposeMatchSheet
          threadId={threadId}
          onClose={() => setProposeOpen(false)}
          onSent={() => qc.invalidateQueries({ queryKey: ["thread", threadId] })}
        />
      )}

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
