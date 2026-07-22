"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { getOrCreateDmThread } from "@/actions/messages"

type Companion = { id: string; name: string; avatarUrl: string | null }

/** Quick-DM strip of players you've played with, shown atop the inbox. */
export function CompanionsStrip({ companions }: { companions: Companion[] }) {
  const router = useRouter()
  const [busy, setBusy] = useState<string | null>(null)

  if (companions.length === 0) return null

  async function open(id: string) {
    if (busy) return
    setBusy(id)
    try {
      const threadId = await getOrCreateDmThread(id)
      router.push(`/messaggi/${threadId}`)
    } catch {
      setBusy(null)
    }
  }

  return (
    <div className="px-4 pb-3 pt-1">
      <p className="mb-2 text-xs font-bold uppercase tracking-wider text-[var(--muted-text)]">
        I tuoi compagni
      </p>
      <div className="flex gap-3 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
        {companions.map((c) => (
          <button
            key={c.id}
            onClick={() => open(c.id)}
            disabled={!!busy}
            className="flex w-16 shrink-0 flex-col items-center gap-1 active:opacity-70 disabled:opacity-50"
          >
            <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-[var(--surface-3)]">
              {c.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={c.avatarUrl} alt={c.name} className="h-full w-full object-cover" />
              ) : (
                <span className="text-sm font-black text-[var(--muted-text)]">
                  {c.name.slice(0, 2).toUpperCase()}
                </span>
              )}
            </div>
            <span className="w-full truncate text-center text-xs text-white">{c.name}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
