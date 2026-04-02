"use client"

import { useState, useEffect, useTransition } from "react"
import { Search, X, UserCheck, UserPlus } from "lucide-react"
import { listPlayers, listUsersWithoutProfile, createMinimalPlayerForUser } from "@/actions/players"
import { addPlayerToSession } from "@/actions/sessions"
import { cn } from "@/lib/utils"
import type { Player } from "@/generated/prisma/client"

interface UnlinkedUser {
  id: string
  name: string | null
  email: string | null
}

interface AddPlayerSheetProps {
  sessionId: string
  existingPlayerIds: string[]
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
  const [unlinked, setUnlinked] = useState<UnlinkedUser[]>([])
  const [search, setSearch] = useState("")
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  // Lock body scroll while sheet is open
  useEffect(() => {
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = ""
    }
  }, [])

  useEffect(() => {
    Promise.all([listPlayers(), listUsersWithoutProfile()]).then(([p, u]) => {
      setPlayers(p)
      setUnlinked(u)
    })
  }, [])

  const q = search.toLowerCase()

  const filteredPlayers = players.filter((p) =>
    p.name.toLowerCase().includes(q),
  )

  const filteredUnlinked = unlinked.filter((u) => {
    const name = (u.name ?? u.email ?? "").toLowerCase()
    return name.includes(q)
  })

  function handleSelectPlayer(playerId: string) {
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

  function handleSelectUnlinked(userId: string) {
    setError(null)
    startTransition(async () => {
      try {
        const player = await createMinimalPlayerForUser(userId)
        await addPlayerToSession(sessionId, player.id)
        onDone()
      } catch (err) {
        setError(err instanceof Error ? err.message : "Errore")
      }
    })
  }

  const isLoading = players.length === 0 && unlinked.length === 0

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
          {isLoading ? (
            <div className="flex justify-center py-6">
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--accent)] border-t-transparent" />
            </div>
          ) : (
            <div className="space-y-1.5">
              {/* Registered players with full profiles */}
              {filteredPlayers.map((p) => {
                const alreadyIn = existingPlayerIds.includes(p.id)
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => !alreadyIn && handleSelectPlayer(p.id)}
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

              {/* Users without a player profile yet */}
              {filteredUnlinked.length > 0 && (
                <>
                  {filteredPlayers.length > 0 && (
                    <p className="px-1 pt-3 pb-1 text-[0.65rem] font-bold uppercase tracking-wider text-[var(--muted-text)]">
                      Profilo da completare
                    </p>
                  )}
                  {filteredUnlinked.map((u) => {
                    const displayName = u.name ?? u.email?.split("@")[0] ?? "Utente"
                    return (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => handleSelectUnlinked(u.id)}
                        disabled={isPending}
                        className="flex min-h-[3rem] w-full items-center gap-3 rounded-xl bg-[var(--surface-2)] px-4 py-3 text-left transition-all hover:bg-[var(--surface-3)] active:scale-[0.99] disabled:opacity-50"
                      >
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--surface-3)] text-xs font-black text-[var(--muted-text)]">
                          {displayName.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-[var(--muted-text)]">{displayName}</p>
                          <p className="text-[0.65rem] text-[var(--accent)]/70">Profilo incompleto</p>
                        </div>
                        <UserPlus className="h-4 w-4 shrink-0 text-[var(--accent)]/60" aria-hidden="true" />
                      </button>
                    )
                  })}
                </>
              )}

              {filteredPlayers.length === 0 && filteredUnlinked.length === 0 && !isLoading && (
                <p className="py-6 text-center text-sm text-[var(--muted-text)]">
                  Nessun giocatore trovato
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
