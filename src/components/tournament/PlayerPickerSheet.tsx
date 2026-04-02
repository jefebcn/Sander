"use client"

import { useState, useEffect, useTransition } from "react"
import { Search, X, UserCheck } from "lucide-react"
import { listPlayers } from "@/actions/players"
import { replaceMatchPlayer } from "@/actions/matches"
import { cn } from "@/lib/utils"
import type { Player } from "@/generated/prisma/client"

interface PlayerPickerSheetProps {
  matchId: string
  oldPlayerId: string | null  // null = slot was TBD
  team: number                // 0 or 1
  takenPlayerIds: string[]    // IDs already in this match (excluding oldPlayerId)
  onClose: () => void
  onDone: () => void
}

export function PlayerPickerSheet({
  matchId,
  oldPlayerId,
  team,
  takenPlayerIds,
  onClose,
  onDone,
}: PlayerPickerSheetProps) {
  const [players, setPlayers] = useState<Player[]>([])
  const [search, setSearch] = useState("")
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    listPlayers().then(setPlayers)
  }, [])

  const filtered = players.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()),
  )

  function handleSelect(playerId: string) {
    startTransition(async () => {
      await replaceMatchPlayer(matchId, oldPlayerId, playerId, team)
      onDone()
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
        aria-label="Seleziona giocatore"
      >
        {/* Drag handle */}
        <div className="flex shrink-0 justify-center pb-1 pt-3">
          <div className="h-1 w-10 rounded-full bg-[var(--surface-3)]" />
        </div>

        {/* Header */}
        <div className="flex shrink-0 items-center justify-between px-4 pb-3 pt-1">
          <p className="text-base font-black">
            {oldPlayerId ? "Sostituisci Giocatore" : "Aggiungi Giocatore"}
          </p>
          <button
            type="button"
            onClick={onClose}
            aria-label="Chiudi"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--surface-2)] text-[var(--muted-text)] transition-colors hover:bg-[var(--surface-3)] hover:text-[var(--foreground)]"
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
              placeholder="Cerca giocatore..."
              className="flex-1 bg-transparent text-sm text-[var(--foreground)] outline-none placeholder:text-[var(--muted-text)]"
            />
          </div>
        </div>

        {/* Player list */}
        <div className="flex-1 overflow-y-auto px-4 pb-6">
          <div className="space-y-1.5">
            {filtered.map((p) => {
              const isCurrent = p.id === oldPlayerId
              const isTaken = takenPlayerIds.includes(p.id)

              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => !isTaken && handleSelect(p.id)}
                  disabled={isPending || isTaken}
                  className={cn(
                    "flex min-h-[3rem] w-full items-center gap-3 rounded-xl px-4 py-3 text-left transition-all duration-150 active:scale-[0.99]",
                    isCurrent
                      ? "bg-[var(--accent)]/15 ring-1 ring-[var(--accent)]"
                      : isTaken
                        ? "cursor-not-allowed bg-[var(--surface-2)] opacity-40"
                        : "bg-[var(--surface-2)] hover:bg-[var(--surface-3)]",
                  )}
                >
                  <span
                    className={cn(
                      "flex-1 font-semibold",
                      isCurrent && "text-[var(--accent)]",
                    )}
                  >
                    {p.name}
                  </span>
                  {isCurrent && (
                    <UserCheck className="h-4 w-4 shrink-0 text-[var(--accent)]" aria-hidden="true" />
                  )}
                  {isTaken && !isCurrent && (
                    <span className="text-xs text-[var(--muted-text)]">in partita</span>
                  )}
                  {isPending && !isTaken && !isCurrent && (
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
