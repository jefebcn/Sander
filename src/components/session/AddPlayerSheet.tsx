"use client"

import { useState, useEffect, useTransition } from "react"
import { Search, X, UserCheck } from "lucide-react"
import { listPlayers } from "@/actions/players"
import { addPlayerToSession } from "@/actions/sessions"
import { cn } from "@/lib/utils"
import type { Player } from "@/generated/prisma/client"

interface AddPlayerSheetProps {
  sessionId: string
  existingPlayerIds: string[]   // already joined — shown disabled
  onClose: () => void
  onDone: () => void
}

export function AddPlayerSheet({
  sessionId,
  existingPlayerIds,
  onClose,
  onDone,
}: AddPlayerSheetProps) {
  const [players, setPlayers] = useState<Player[]>([])
  const [search, setSearch] = useState("")
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    listPlayers().then(setPlayers)
  }, [])

  const filtered = players.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()),
  )

  function handleSelect(playerId: string) {
    setError(null)
    startTransition(async () => {
      try {
        await addPlayerToSession(sessionId, playerId)
        onDone()
      } catch (err) {
        setError(err instanceof Error ? err.message : "Errore")
      }
    })
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/70"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Bottom sheet */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 flex max-h-[75dvh] flex-col rounded-t-3xl bg-[var(--surface-1)]"
        role="dialog"
        aria-modal="true"
        aria-label="Aggiungi giocatore"
      >
        {/* Handle */}
        <div className="flex shrink-0 justify-center pb-1 pt-3">
          <div className="h-1 w-10 rounded-full bg-[var(--surface-3)]" />
        </div>

        {/* Header */}
        <div className="flex shrink-0 items-center justify-between px-4 pb-3 pt-1">
          <p className="text-base font-black">Aggiungi Giocatore</p>
          <button
            type="button"
            onClick={onClose}
            aria-label="Chiudi"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--surface-2)] text-[var(--muted-text)] transition-colors hover:bg-[var(--surface-3)]"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        {/* Search */}
        <div className="shrink-0 px-4 pb-3">
          <div className="flex items-center gap-2 rounded-xl bg-[var(--surface-2)] px-3 py-2.5">
            <Search className="h-4 w-4 shrink-0 text-[var(--muted-text)]" aria-hidden="true" />
            <input
              type="text"
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cerca per nome..."
              className="flex-1 bg-transparent text-sm text-[var(--foreground)] outline-none placeholder:text-[var(--muted-text)]"
            />
          </div>
        </div>

        {error && (
          <p className="mx-4 mb-2 shrink-0 rounded-xl bg-[var(--danger)]/15 px-3 py-2 text-sm text-[var(--danger)]">
            {error}
          </p>
        )}

        {/* List */}
        <div className="flex-1 overflow-y-auto px-4 pb-6">
          <div className="space-y-1.5">
            {filtered.map((p) => {
              const alreadyIn = existingPlayerIds.includes(p.id)
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => !alreadyIn && handleSelect(p.id)}
                  disabled={isPending || alreadyIn}
                  className={cn(
                    "flex min-h-[3rem] w-full items-center gap-3 rounded-xl px-4 py-3 text-left transition-all active:scale-[0.99]",
                    alreadyIn
                      ? "cursor-not-allowed bg-[var(--surface-2)] opacity-40"
                      : "bg-[var(--surface-2)] hover:bg-[var(--surface-3)]",
                  )}
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--surface-3)] text-xs font-black">
                    {p.name.slice(0, 2).toUpperCase()}
                  </div>
                  <span className="flex-1 font-semibold">{p.name}</span>
                  {alreadyIn && (
                    <UserCheck className="h-4 w-4 shrink-0 text-[var(--muted-text)]" aria-hidden="true" />
                  )}
                  {isPending && !alreadyIn && (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--accent)] border-t-transparent" />
                  )}
                </button>
              )
            })}

            {players.length > 0 && filtered.length === 0 && (
              <p className="py-6 text-center text-sm text-[var(--muted-text)]">
                Nessun giocatore trovato
              </p>
            )}
            {players.length === 0 && (
              <div className="flex justify-center py-6">
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--accent)] border-t-transparent" />
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
