"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Shuffle, Users } from "lucide-react"
import { randomizePairings, swapPlayers } from "@/actions/tournaments"
import { cn } from "@/lib/utils"
import type { Player, TournamentRegistration } from "@/generated/prisma/client"

type RegWithPlayer = TournamentRegistration & { player: Player }

interface TeamPairingEditorProps {
  tournamentId: string
  registrations: RegWithPlayer[]
}

export function TeamPairingEditor({ tournamentId, registrations }: TeamPairingEditorProps) {
  const router = useRouter()
  const [selected, setSelected] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  // Sort by seedPosition, build consecutive pairs
  const sorted = [...registrations].sort(
    (a, b) => (a.seedPosition ?? 0) - (b.seedPosition ?? 0),
  )
  const pairs: [RegWithPlayer, RegWithPlayer | undefined][] = []
  for (let i = 0; i < sorted.length; i += 2) {
    pairs.push([sorted[i], sorted[i + 1]])
  }

  function handleRandomize() {
    setSelected(null)
    startTransition(async () => {
      await randomizePairings(tournamentId)
      router.refresh()
    })
  }

  function handlePlayerTap(playerId: string) {
    if (isPending) return
    if (!selected) {
      setSelected(playerId)
      return
    }
    if (selected === playerId) {
      setSelected(null)
      return
    }
    const prev = selected
    setSelected(null)
    startTransition(async () => {
      await swapPlayers(tournamentId, prev, playerId)
      router.refresh()
    })
  }

  return (
    <div className="mx-4 mb-3 rounded-2xl bg-[var(--surface-1)] p-4">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-[var(--accent)]" aria-hidden="true" />
          <p className="text-xs font-bold uppercase tracking-wider">Formazione Coppie</p>
        </div>
        <button
          type="button"
          onClick={handleRandomize}
          disabled={isPending}
          className="flex items-center gap-1.5 rounded-full bg-[var(--surface-3)] px-3 py-1.5 text-xs font-bold transition-all hover:bg-[var(--surface-4)] active:scale-95 disabled:opacity-50"
        >
          {isPending ? (
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
          ) : (
            <Shuffle className="h-3.5 w-3.5" aria-hidden="true" />
          )}
          Casuale
        </button>
      </div>

      {/* Contextual hint */}
      <p className="mb-3 text-xs text-[var(--muted-text)]">
        {selected
          ? "Tocca un altro giocatore per scambiarlo"
          : "Tocca un giocatore per selezionarlo, poi tocca un altro per scambiarli"}
      </p>

      {/* Pairs list */}
      <div className="space-y-2">
        {pairs.map(([p1, p2], i) => (
          <div
            key={i}
            className="flex items-center gap-2 rounded-xl bg-[var(--surface-2)] px-3 py-2"
          >
            <span className="w-5 shrink-0 text-center text-xs font-bold text-[var(--muted-text)]">
              {i + 1}
            </span>

            <PlayerChip
              name={p1.player.name}
              isSelected={selected === p1.playerId}
              onTap={() => handlePlayerTap(p1.playerId)}
              disabled={isPending}
            />

            <span className="shrink-0 text-sm font-bold text-[var(--muted-text)]">+</span>

            {p2 ? (
              <PlayerChip
                name={p2.player.name}
                isSelected={selected === p2.playerId}
                onTap={() => handlePlayerTap(p2.playerId)}
                disabled={isPending}
              />
            ) : (
              <span className="flex-1 rounded-lg bg-[var(--surface-3)] px-3 py-2 text-center text-xs italic text-[var(--muted-text)]">
                BYE
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function PlayerChip({
  name,
  isSelected,
  onTap,
  disabled,
}: {
  name: string
  isSelected: boolean
  onTap: () => void
  disabled: boolean
}) {
  return (
    <button
      type="button"
      onClick={onTap}
      disabled={disabled}
      className={cn(
        "min-h-[2.75rem] flex-1 rounded-lg px-3 py-2 text-left text-sm font-semibold transition-all duration-150 active:scale-95",
        isSelected
          ? "bg-[var(--accent)] text-black ring-2 ring-[var(--accent)]/40"
          : "bg-[var(--surface-3)] text-[var(--foreground)] hover:bg-[var(--surface-4)]",
        disabled && !isSelected && "cursor-not-allowed opacity-60",
      )}
    >
      {name}
    </button>
  )
}
