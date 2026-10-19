"use client"

/* eslint-disable @next/next/no-img-element -- user photos from Blob, any size */
import { useState } from "react"
import { ThumbsUp, ThumbsDown, Repeat } from "lucide-react"
import { toast } from "sonner"
import { votePlayAgain } from "@/actions/scopri"
import { formatWhen } from "@/lib/datetime"
import type { PlayAgainAsk } from "@/lib/scopri/playAgainServer"

/**
 * "Rigiocheresti con…?" — one tap per person after a match. Private: nobody
 * sees who voted what; the share of "sì" shows up on Scopri cards.
 */
export function PlayAgainCard({ ask }: { ask: PlayAgainAsk }) {
  const [left, setLeft] = useState(ask.people)
  const [busy, setBusy] = useState<string | null>(null)

  async function vote(id: string, again: boolean) {
    setBusy(id)
    try {
      await votePlayAgain({ sessionId: ask.sessionId, targetId: id, again })
      setLeft((l) => l.filter((p) => p.id !== id))
      if (!again) toast("Ok: su Scopri non ve lo riproponiamo")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Non riuscito")
    } finally {
      setBusy(null)
    }
  }

  if (left.length === 0) return null
  return (
    <section aria-labelledby="again-title" className="tone-social rounded-[var(--radius-lg)] bg-[var(--surface-2)] p-4 shadow-[var(--shadow-card)] ring-1 ring-[var(--tone-line)]">
      <p className="eyebrow flex items-center gap-1 text-[var(--social)]">
        <Repeat className="h-3.5 w-3.5" aria-hidden="true" /> {ask.title} · {formatWhen(ask.date)}
      </p>
      <h2 id="again-title" className="font-hand mt-1 text-[1.9rem] text-white">Rigiocheresti con…</h2>
      <p className="text-sm text-[var(--muted-text)]">Resta tra te e SANDER: serve a proporti i compagni giusti.</p>
      <ul className="mt-3 flex flex-col gap-2">
        {left.map((p) => (
          <li key={p.id} className="flex items-center gap-3 rounded-[var(--radius-md)] bg-black/20 p-2">
            <span className="h-12 w-12 shrink-0 overflow-hidden rounded-full bg-[var(--surface-4)]">
              {p.photo && <img src={p.photo} alt="" className="h-full w-full object-cover" />}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-base font-extrabold text-white">{p.name}</span>
              <span className="block text-xs font-bold uppercase tracking-wider text-[var(--muted-text)]">{p.teammate ? "In squadra con te" : "Avversario"}</span>
            </span>
            <button
              type="button"
              disabled={busy !== null}
              onClick={() => vote(p.id, false)}
              aria-label={`Non rigiocherei con ${p.name}`}
              className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--surface-4)] text-white disabled:opacity-50"
            >
              <ThumbsDown className="h-5 w-5" aria-hidden="true" />
            </button>
            <button
              type="button"
              disabled={busy !== null}
              onClick={() => vote(p.id, true)}
              aria-label={`Rigiocherei con ${p.name}`}
              className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--social)] text-black disabled:opacity-50"
            >
              <ThumbsUp className="h-5 w-5" aria-hidden="true" />
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
