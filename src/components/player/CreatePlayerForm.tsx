"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Shield, Swords } from "lucide-react"
import { createPlayer } from "@/actions/players"
import { cn } from "@/lib/utils"

export function CreatePlayerForm() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [name, setName] = useState("")
  const [role, setRole] = useState<"BLOCKER" | "DEFENDER">("DEFENDER")
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      try {
        const player = await createPlayer({ name, preferredRole: role })
        router.push(`/players/${player.id}`)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Errore durante la creazione")
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 px-4 pb-8">
      {/* Name */}
      <div className="space-y-1.5">
        <label className="text-sm font-semibold text-[var(--muted-text)]">Nome</label>
        <input
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="es. Marco Rossi"
          className="w-full rounded-xl bg-[var(--surface-2)] px-4 py-3 text-base text-[var(--foreground)] placeholder:text-[var(--muted-text)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
        />
      </div>

      {/* Role */}
      <div className="space-y-1.5">
        <label className="text-sm font-semibold text-[var(--muted-text)]">
          Ruolo Preferito
        </label>
        <div className="grid grid-cols-2 gap-3">
          {(
            [
              {
                value: "DEFENDER" as const,
                label: "Difensore",
                icon: Shield,
                color: "orange",
              },
              {
                value: "BLOCKER" as const,
                label: "Attaccante",
                icon: Swords,
                color: "blue",
              },
            ]
          ).map(({ value, label, icon: Icon, color }) => (
            <button
              key={value}
              type="button"
              onClick={() => setRole(value)}
              className={cn(
                "flex min-h-[4rem] flex-col items-center justify-center gap-1.5 rounded-2xl border-2 p-3 text-sm font-semibold transition-colors",
                role === value
                  ? color === "orange"
                    ? "border-orange-500 bg-orange-900/20 text-orange-400"
                    : "border-blue-500 bg-blue-900/20 text-blue-400"
                  : "border-[var(--border)] bg-[var(--surface-2)] text-[var(--muted-text)]",
              )}
            >
              <Icon className="h-5 w-5" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <p className="rounded-xl bg-red-900/30 px-4 py-3 text-sm font-medium text-red-400">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending || name.length < 2}
        className="flex min-h-[3.5rem] w-full items-center justify-center rounded-2xl bg-[var(--accent)] font-bold text-black disabled:opacity-40"
      >
        {isPending ? "Creazione..." : "Crea Giocatore"}
      </button>
    </form>
  )
}
