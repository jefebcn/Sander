"use client"

import { useState, useTransition } from "react"
import { Coins, Search, Plus } from "lucide-react"
import { adminAddCredits } from "@/actions/players"
import { TOP_UP_METHODS } from "@/lib/validators/player.schema"

interface PlayerRow {
  id: string
  name: string
  firstName: string | null
  sanderCredits: number
}

type Method = (typeof TOP_UP_METHODS)[number]

const METHOD_LABEL: Record<Method, string> = {
  PAYPAL: "PayPal",
  BONIFICO: "Bonifico",
  CONTANTI: "Contanti",
  OMAGGIO: "Omaggio",
}

/** SC are sold at 1 € = 10 SC, so the euros are pre-filled from the credits. */
const SC_PER_EURO = 10

interface Draft {
  credits: string
  euros: string
  /** Once the admin types an amount, stop overwriting it from the credits. */
  eurosTouched: boolean
  method: Method
}

const EMPTY: Draft = { credits: "", euros: "", eurosTouched: false, method: "PAYPAL" }

/** "10,50" or "10.5" → 1050. Returns null for anything that isn't a valid amount. */
function eurosToCents(value: string): number | null {
  const n = Number(value.trim().replace(",", "."))
  if (!value.trim() || !Number.isFinite(n) || n < 0) return null
  return Math.round(n * 100)
}

export function AdminCreditsManager({ players }: { players: PlayerRow[] }) {
  const [query, setQuery] = useState("")
  const [drafts, setDrafts] = useState<Record<string, Draft>>({})
  const [pending, setPending] = useState<Record<string, boolean>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [, startTransition] = useTransition()

  const filtered = players.filter((p) =>
    `${p.name} ${p.firstName ?? ""}`.toLowerCase().includes(query.toLowerCase())
  )

  function update(playerId: string, patch: Partial<Draft>) {
    setDrafts((prev) => {
      const next = { ...(prev[playerId] ?? EMPTY), ...patch }
      // Keep the euros in step with the credits until the admin overrides them.
      if (!next.eurosTouched && patch.credits !== undefined) {
        const sc = parseInt(next.credits, 10)
        next.euros = sc > 0 ? String(sc / SC_PER_EURO) : ""
      }
      return { ...prev, [playerId]: next }
    })
  }

  function handleAdd(playerId: string) {
    const d = drafts[playerId] ?? EMPTY
    const credits = parseInt(d.credits, 10)
    if (!credits || credits <= 0) return

    const amountCents = d.method === "OMAGGIO" ? 0 : eurosToCents(d.euros)
    if (amountCents === null || (d.method !== "OMAGGIO" && amountCents === 0)) {
      setErrors((prev) => ({ ...prev, [playerId]: "Inserisci l'importo ricevuto in euro" }))
      return
    }

    setPending((prev) => ({ ...prev, [playerId]: true }))
    setErrors((prev) => ({ ...prev, [playerId]: "" }))

    startTransition(async () => {
      try {
        await adminAddCredits({ playerId, credits, amountCents, method: d.method })
        setDrafts((prev) => ({ ...prev, [playerId]: { ...EMPTY, method: d.method } }))
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
      <p className="text-sm text-[var(--muted-text)]">
        Registra sempre quanto hai ricevuto: è da qui che si calcolano ricavi e ricarica media.
      </p>

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
        {filtered.map((p) => {
          const d = drafts[p.id] ?? EMPTY
          const isGift = d.method === "OMAGGIO"
          return (
            <div key={p.id} className="rounded-xl bg-[var(--surface-2)] px-4 py-3 flex flex-col gap-2">
              <div className="flex items-baseline justify-between gap-3">
                <p className="text-base font-bold text-white truncate">
                  {p.firstName ? `${p.firstName} ${p.name.split(" ").slice(-1)[0]}` : p.name}
                </p>
                <p className="text-sm text-[var(--muted-text)] shrink-0">
                  <span className="font-black text-[var(--accent)]">{p.sanderCredits}</span> SC
                </p>
              </div>

              <div className="flex items-stretch gap-2">
                <label className="flex-1 min-w-0">
                  <span className="sr-only">Crediti da aggiungere</span>
                  <input
                    type="number"
                    inputMode="numeric"
                    min="1"
                    step="1"
                    value={d.credits}
                    onChange={(e) => update(p.id, { credits: e.target.value })}
                    placeholder="SC"
                    className="w-full min-h-[3.5rem] rounded-lg bg-[var(--surface-3)] px-2 text-base text-center text-white focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                  />
                </label>
                <label className="flex-1 min-w-0">
                  <span className="sr-only">Euro ricevuti</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={isGift ? "0" : d.euros}
                    disabled={isGift}
                    onChange={(e) => update(p.id, { euros: e.target.value, eurosTouched: true })}
                    placeholder="€"
                    className="w-full min-h-[3.5rem] rounded-lg bg-[var(--surface-3)] px-2 text-base text-center text-white disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                  />
                </label>
                <label className="flex-1 min-w-0">
                  <span className="sr-only">Metodo di pagamento</span>
                  <select
                    value={d.method}
                    onChange={(e) => update(p.id, { method: e.target.value as Method })}
                    className="w-full min-h-[3.5rem] rounded-lg bg-[var(--surface-3)] px-2 text-base text-white focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                  >
                    {TOP_UP_METHODS.map((m) => (
                      <option key={m} value={m}>{METHOD_LABEL[m]}</option>
                    ))}
                  </select>
                </label>
                <button
                  onClick={() => handleAdd(p.id)}
                  disabled={pending[p.id] || !d.credits}
                  aria-label={`Aggiungi crediti a ${p.name}`}
                  className="flex min-h-[3.5rem] w-14 shrink-0 items-center justify-center rounded-lg bg-[var(--accent)] transition-opacity disabled:opacity-40"
                >
                  <Plus className="h-5 w-5 text-[var(--accent-fg)]" />
                </button>
              </div>

              {errors[p.id] && (
                <p className="text-sm text-[var(--danger)]">{errors[p.id]}</p>
              )}
            </div>
          )
        })}
        {filtered.length === 0 && (
          <p className="text-center text-sm text-[var(--muted-text)] py-4">
            Nessun giocatore trovato
          </p>
        )}
      </div>
    </div>
  )
}
