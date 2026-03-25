"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { ChevronRight, Check, Trophy, Crown, Users } from "lucide-react"
import { createTournament } from "@/actions/tournaments"
import { cn } from "@/lib/utils"
import type { Player } from "@/generated/prisma/client"

interface CreateTournamentFormProps {
  players: Player[]
}

export function CreateTournamentForm({ players }: CreateTournamentFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [name, setName] = useState("")
  const [date, setDate] = useState(new Date().toISOString().split("T")[0])
  const [type, setType] = useState<"KING_OF_THE_BEACH" | "BRACKETS">("KING_OF_THE_BEACH")
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)

  function togglePlayer(id: string) {
    setSelectedPlayerIds((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id],
    )
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (selectedPlayerIds.length < 4) {
      setError("Seleziona almeno 4 giocatori")
      return
    }

    startTransition(async () => {
      try {
        const tournament = await createTournament({
          name,
          date: new Date(date),
          type,
          playerIds: selectedPlayerIds,
        })
        router.push(`/tournaments/${tournament.id}`)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Errore durante la creazione")
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 px-4 pb-8">
      {/* Name */}
      <div className="space-y-1.5">
        <label className="text-sm font-semibold text-[var(--muted-text)]">
          Nome Torneo
        </label>
        <input
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="es. Sander Cup 2026"
          className="w-full rounded-xl bg-[var(--surface-2)] px-4 py-3 text-base text-[var(--foreground)] placeholder:text-[var(--muted-text)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
        />
      </div>

      {/* Date */}
      <div className="space-y-1.5">
        <label className="text-sm font-semibold text-[var(--muted-text)]">Data</label>
        <input
          type="date"
          required
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full rounded-xl bg-[var(--surface-2)] px-4 py-3 text-base text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] [color-scheme:dark]"
        />
      </div>

      {/* Type */}
      <div className="space-y-1.5">
        <label className="text-sm font-semibold text-[var(--muted-text)]">Formato</label>
        <div className="grid grid-cols-2 gap-3">
          {(
            [
              { value: "KING_OF_THE_BEACH", label: "King of the Beach", icon: Crown },
              { value: "BRACKETS", label: "Brackets", icon: Trophy },
            ] as const
          ).map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => setType(value)}
              className={cn(
                "flex min-h-[4rem] flex-col items-center justify-center gap-1 rounded-2xl border-2 p-3 text-sm font-semibold transition-colors",
                type === value
                  ? "border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]"
                  : "border-[var(--border)] bg-[var(--surface-2)] text-[var(--muted-text)]",
              )}
            >
              <Icon className="h-5 w-5" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Players */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-semibold text-[var(--muted-text)]">
            Giocatori
          </label>
          <span className="text-xs text-[var(--muted-text)]">
            {selectedPlayerIds.length} selezionati (min. 4)
          </span>
        </div>

        {players.length === 0 ? (
          <div className="rounded-2xl bg-[var(--surface-2)] p-6 text-center text-sm text-[var(--muted-text)]">
            <Users className="mx-auto mb-2 h-8 w-8 opacity-50" />
            Nessun giocatore disponibile.{" "}
            <a href="/players" className="text-[var(--accent)] underline">
              Aggiungi giocatori
            </a>{" "}
            prima.
          </div>
        ) : (
          <div className="space-y-2">
            {players.map((player) => {
              const selected = selectedPlayerIds.includes(player.id)
              return (
                <button
                  key={player.id}
                  type="button"
                  onClick={() => togglePlayer(player.id)}
                  className={cn(
                    "flex min-h-[3.5rem] w-full items-center gap-3 rounded-2xl px-4 text-left transition-colors",
                    selected
                      ? "bg-[var(--accent)]/15 ring-1 ring-[var(--accent)]"
                      : "bg-[var(--surface-2)]",
                  )}
                >
                  <div
                    className={cn(
                      "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2",
                      selected
                        ? "border-[var(--accent)] bg-[var(--accent)]"
                        : "border-[var(--muted)]",
                    )}
                  >
                    {selected && <Check className="h-3.5 w-3.5 text-black" />}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">{player.name}</p>
                    <p className="text-xs text-[var(--muted-text)]">
                      {player.preferredRole === "BLOCKER" ? "Attaccante" : "Difensore"}
                    </p>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {error && (
        <p
          role="alert"
          className="rounded-xl bg-[var(--danger)]/15 px-4 py-3 text-sm font-medium text-[var(--danger)]"
        >
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending || selectedPlayerIds.length < 4}
        className="flex min-h-[3.5rem] w-full items-center justify-center gap-2 rounded-2xl bg-[var(--accent)] font-bold text-black transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {isPending ? (
          <>
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-black border-t-transparent" />
            Creazione...
          </>
        ) : (
          <>
            Crea Torneo
            <ChevronRight className="h-5 w-5" />
          </>
        )}
      </button>
    </form>
  )
}
