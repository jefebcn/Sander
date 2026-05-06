"use client"

import { useState, useTransition } from "react"
import { Coins, Search, Plus } from "lucide-react"
import { adminAddCredits } from "@/actions/players"
import { cn } from "@/lib/utils"

interface PlayerRow {
  id: string
  name: string
  firstName: string | null
  sanderCredits: number
}

export function AdminCreditsManager({ players }: { players: PlayerRow[] }) {
  const [query, setQuery] = useState("")
  const [amounts, setAmounts] = useState<Record<string, string>>({})
  const [pending, setPending] = useState<Record<string, boolean>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [, startTransition] = useTransition()

  const filtered = players.filter((p) =>
    `${p.name} ${p.firstName ?? ""}`.toLowerCase().includes(query.toLowerCase())
  )

  function handleAdd(playerId: string) {
    const raw = amounts[playerId] ?? ""
    const amount = parseInt(raw, 10)
    if (!amount || amount <= 0) return

    setPending((prev) => ({ ...prev, [playerId]: true }))
    setErrors((prev) => ({ ...prev, [playerId]: "" }))

    startTransition(async () => {
      try {
        await adminAddCredits(playerId, amount)
        setAmounts((prev) => ({ ...prev, [playerId]: "" }))
      } catch (e) {
        setErrors((prev) => ({
          ...prev,
          [playerId]: e instanceof Error ? e.message : "Errore",
        }))
      } finally {
        setPending((prev) => ({ ...prev, [playerId]: false }))
      }
    })
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Coins className="h-4 w-4 text-[var(--accent)]" />
        <p className="text-xs font-bold uppercase tracking-wider text-[var(--accent)]">
          Gestione SanderCredits
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-text)]" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Cerca giocatore…"
          className="w-full rounded-xl bg-[var(--surface-2)] py-2.5 pl-9 pr-4 text-sm text-white placeholder:text-[var(--muted-text)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
        />
      </div>

      {/* Player list */}
      <div className="flex flex-col gap-2">
        {filtered.map((p) => (
          <div
            key={p.id}
            className="rounded-xl bg-[var(--surface-2)] px-4 py-3 flex items-center gap-3"
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white truncate">
                {p.firstName ? `${p.firstName} ${p.name.split(" ").slice(-1)[0]}` : p.name}
              </p>
              <p className="text-xs text-[var(--muted-text)]">
                <span className="font-black text-[var(--accent)]">{p.sanderCredits}</span> SC
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <input
                type="number"
                min="1"
                step="1"
                value={amounts[p.id] ?? ""}
                onChange={(e) =>
                  setAmounts((prev) => ({ ...prev, [p.id]: e.target.value }))
                }
                onKeyDown={(e) => e.key === "Enter" && handleAdd(p.id)}
                placeholder="SC"
                className="w-16 rounded-lg bg-[var(--surface-3)] px-2 py-1.5 text-sm text-center text-white focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              />
              <button
                onClick={() => handleAdd(p.id)}
                disabled={pending[p.id] || !amounts[p.id]}
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-lg transition-opacity disabled:opacity-40",
                )}
                style={{ background: "var(--accent)" }}
              >
                <Plus className="h-4 w-4 text-black" />
              </button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="text-center text-sm text-[var(--muted-text)] py-4">
            Nessun giocatore trovato
          </p>
        )}
      </div>

      {/* Errors */}
      {Object.entries(errors).map(([id, msg]) =>
        msg ? (
          <p key={id} className="text-xs text-[var(--danger)]">
            {msg}
          </p>
        ) : null
      )}
    </div>
  )
}
