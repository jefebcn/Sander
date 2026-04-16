"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { ChevronRight, Check, Trophy, Crown, Users, RotateCcw, Swords, Shuffle } from "lucide-react"
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
  const [type, setType] = useState<"KING_OF_THE_BEACH" | "BRACKETS" | "ROUND_ROBIN" | "DOUBLE_ELIMINATION" | "CHICECE">("KING_OF_THE_BEACH")
  const [chiceceMatchCount, setChiceceMatchCount] = useState<4 | 6>(4)
  const [numCourts, setNumCourts] = useState(2)
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)

  // Registration & payment fields
  const [isOpenForRegistration, setIsOpenForRegistration] = useState(false)
  const [location, setLocation] = useState("")
  const [description, setDescription] = useState("")
  const [registrationDeadline, setRegistrationDeadline] = useState("")
  const [prizePool, setPrizePool] = useState("")
  const [priceEuros, setPriceEuros] = useState("")

  function togglePlayer(id: string) {
    setSelectedPlayerIds((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id],
    )
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!isOpenForRegistration && selectedPlayerIds.length < 4) {
      setError("Seleziona almeno 4 giocatori (oppure abilita l'iscrizione libera)")
      return
    }

    if (!isOpenForRegistration && type === "ROUND_ROBIN" && selectedPlayerIds.length % 2 !== 0) {
      setError("Round Robin richiede un numero pari di giocatori")
      return
    }

    if (!isOpenForRegistration && type === "CHICECE" && selectedPlayerIds.length % 4 !== 0) {
      setError("Chicece richiede un numero di giocatori multiplo di 4")
      return
    }

    // Convert euros → cents
    const priceNumber = priceEuros.trim() === "" ? null : Number(priceEuros.replace(",", "."))
    if (priceNumber !== null && (Number.isNaN(priceNumber) || priceNumber < 0)) {
      setError("Prezzo non valido")
      return
    }
    const priceCents = priceNumber === null ? null : Math.round(priceNumber * 100)

    startTransition(async () => {
      const result = await createTournament({
        name,
        date: new Date(date),
        type,
        playerIds: selectedPlayerIds,
        numCourts,
        chiceceMatchCount: type === "CHICECE" ? chiceceMatchCount : undefined,
        location: location.trim() || null,
        description: description.trim() || null,
        registrationDeadline: registrationDeadline ? new Date(registrationDeadline) : null,
        prizePool: prizePool.trim() || null,
        priceCents,
        priceCurrency: "EUR",
        isOpenForRegistration,
      })
      if (!result.ok) {
        setError(result.error)
        return
      }
      router.push(`/tournaments/${result.id}`)
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
              { value: "BRACKETS", label: "Classico", icon: Trophy },
              { value: "ROUND_ROBIN", label: "Round Robin", icon: RotateCcw },
              { value: "DOUBLE_ELIMINATION", label: "Doppia Elim.", icon: Swords },
              { value: "CHICECE", label: "Chicece", icon: Shuffle },
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
        {type === "ROUND_ROBIN" && (
          <p className="text-xs text-[var(--muted-text)] pt-1">
            Coppie fisse — ogni coppia affronta tutte le altre una volta
          </p>
        )}
        {type === "DOUBLE_ELIMINATION" && (
          <p className="text-xs text-[var(--muted-text)] pt-1">
            Occorrono 2 sconfitte per essere eliminati — Winners e Losers Bracket
          </p>
        )}
        {type === "CHICECE" && (
          <div className="pt-1 space-y-2">
            <p className="text-xs text-[var(--muted-text)]">
              Gironi a coppie variabili — punteggio individuale +/−. Top 4 avanzano alla finale.
            </p>
            <div className="flex gap-2">
              {([4, 6] as const).map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setChiceceMatchCount(n)}
                  className={cn(
                    "flex-1 rounded-xl border-2 py-2 text-sm font-bold transition-colors",
                    chiceceMatchCount === n
                      ? "border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]"
                      : "border-[var(--border)] bg-[var(--surface-2)] text-[var(--muted-text)]",
                  )}
                >
                  {n} partite {n === 4 ? "(veloce)" : "(standard)"}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Courts */}
      <div className="space-y-1.5">
        <label className="text-sm font-semibold text-[var(--muted-text)]">Campi disponibili</label>
        <div className="grid grid-cols-4 gap-2">
          {[1, 2, 3, 4].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setNumCourts(n)}
              className={cn(
                "flex min-h-[3rem] flex-col items-center justify-center rounded-2xl border-2 text-sm font-bold transition-colors",
                numCourts === n
                  ? "border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]"
                  : "border-[var(--border)] bg-[var(--surface-2)] text-[var(--muted-text)]",
              )}
            >
              {n}
            </button>
          ))}
        </div>
        <p className="text-xs text-[var(--muted-text)]">
          Campi A–{["A","B","C","D"][numCourts - 1]} · onde AM e PM assegnate automaticamente
        </p>
      </div>

      {/* Iscrizioni & pagamenti */}
      <div className="space-y-3 rounded-2xl bg-[var(--surface-2)] p-4">
        <label className="flex items-center justify-between">
          <div className="flex-1 pr-3">
            <p className="text-sm font-semibold text-white">Iscrizione libera</p>
            <p className="text-xs text-[var(--muted-text)]">
              Chiunque può iscriversi (e pagare) da solo
            </p>
          </div>
          <input
            type="checkbox"
            checked={isOpenForRegistration}
            onChange={(e) => setIsOpenForRegistration(e.target.checked)}
            className="h-6 w-6 accent-[var(--accent)]"
          />
        </label>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-[var(--muted-text)]">Luogo</label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="es. Lido Sabbia d'oro, Rimini"
            className="w-full rounded-xl bg-[var(--surface-3)] px-3 py-2.5 text-sm text-white placeholder:text-[var(--muted-text)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-[var(--muted-text)]">Descrizione / regolamento</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Format, numero partite, orari, premi…"
            rows={3}
            className="w-full rounded-xl bg-[var(--surface-3)] px-3 py-2.5 text-sm text-white placeholder:text-[var(--muted-text)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[var(--muted-text)]">Deadline iscrizione</label>
            <input
              type="date"
              value={registrationDeadline}
              onChange={(e) => setRegistrationDeadline(e.target.value)}
              className="w-full rounded-xl bg-[var(--surface-3)] px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[var(--accent)] [color-scheme:dark]"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[var(--muted-text)]">Prezzo (€)</label>
            <input
              type="text"
              inputMode="decimal"
              value={priceEuros}
              onChange={(e) => setPriceEuros(e.target.value)}
              placeholder="0 = gratis"
              className="w-full rounded-xl bg-[var(--surface-3)] px-3 py-2.5 text-sm text-white placeholder:text-[var(--muted-text)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-[var(--muted-text)]">Montepremi</label>
          <input
            type="text"
            value={prizePool}
            onChange={(e) => setPrizePool(e.target.value)}
            placeholder="es. 1°: €500 · 2°: €250 · trofeo"
            className="w-full rounded-xl bg-[var(--surface-3)] px-3 py-2.5 text-sm text-white placeholder:text-[var(--muted-text)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
          />
        </div>
      </div>

      {/* Players */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-semibold text-[var(--muted-text)]">
            Giocatori
          </label>
          <span className="text-xs text-[var(--muted-text)]">
            {selectedPlayerIds.length} selezionati {isOpenForRegistration ? "(opzionale)" : "(min. 4)"}
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
        disabled={isPending || (!isOpenForRegistration && selectedPlayerIds.length < 4)}
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
