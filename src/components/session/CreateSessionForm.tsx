"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { MapPin, ChevronRight, Banknote, Beer, Gift } from "lucide-react"
import { createSession } from "@/actions/sessions"
import { cn } from "@/lib/utils"

const FORMATS = [
  { value: "TWO_VS_TWO", label: "2 vs 2", sub: "4 giocatori" },
  { value: "THREE_VS_THREE", label: "3 vs 3", sub: "6 giocatori" },
  { value: "FOUR_VS_FOUR", label: "4 vs 4", sub: "8 giocatori" },
] as const

type Format = (typeof FORMATS)[number]["value"]
type PaymentType = "FREE" | "QUOTA" | "LOSER_PAYS"

const PAYMENT_OPTIONS: { value: PaymentType; label: string; sub: string; icon: React.ElementType }[] = [
  { value: "FREE",        label: "Gratis",        sub: "Nessuna quota",         icon: Gift },
  { value: "QUOTA",       label: "A quota",        sub: "Ognuno paga la sua parte", icon: Banknote },
  { value: "LOSER_PAYS",  label: "Chi perde paga", sub: "Birra, cena…",          icon: Beer },
]

export function CreateSessionForm() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const [title, setTitle] = useState("")
  const [location, setLocation] = useState("")
  const [date, setDate] = useState(new Date().toISOString().slice(0, 16))
  const [format, setFormat] = useState<Format>("TWO_VS_TWO")
  const [notes, setNotes] = useState("")

  const [paymentType, setPaymentType] = useState<PaymentType>("FREE")
  const [quotaAmount, setQuotaAmount] = useState("")
  const [loserPays, setLoserPays] = useState("")

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      try {
        const session = await createSession({
          title,
          location,
          date: new Date(date),
          format,
          notes: notes || undefined,
          paymentType,
          quotaAmount: paymentType === "QUOTA" && quotaAmount
            ? Math.round(parseFloat(quotaAmount) * 100)
            : undefined,
          loserPays: paymentType === "LOSER_PAYS" && loserPays ? loserPays : undefined,
        })
        router.push(`/sessions/${session.id}`)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Errore durante la creazione")
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 px-4 pb-8">
      {/* Title */}
      <div className="space-y-1.5">
        <label className="text-sm font-semibold text-[var(--muted-text)]">Titolo</label>
        <input
          type="text"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="es. Sessione serale — Copacabana"
          className="w-full rounded-xl bg-[var(--surface-2)] px-4 py-3 text-base text-[var(--foreground)] placeholder:text-[var(--muted-text)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
        />
      </div>

      {/* Location */}
      <div className="space-y-1.5">
        <label className="text-sm font-semibold text-[var(--muted-text)]">Campo / Location</label>
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-text)]" aria-hidden="true" />
          <input
            type="text"
            required
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="es. Lido Milano Nord, Campo 3"
            className="w-full rounded-xl bg-[var(--surface-2)] py-3 pl-9 pr-4 text-base text-[var(--foreground)] placeholder:text-[var(--muted-text)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
          />
        </div>
      </div>

      {/* Date & time */}
      <div className="space-y-1.5">
        <label className="text-sm font-semibold text-[var(--muted-text)]">Data e ora</label>
        <input
          type="datetime-local"
          required
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full rounded-xl bg-[var(--surface-2)] px-4 py-3 text-base text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] [color-scheme:dark]"
        />
      </div>

      {/* Format */}
      <div className="space-y-1.5">
        <label className="text-sm font-semibold text-[var(--muted-text)]">Formato</label>
        <div className="grid grid-cols-3 gap-2">
          {FORMATS.map(({ value, label, sub }) => (
            <button
              key={value}
              type="button"
              onClick={() => setFormat(value)}
              className={cn(
                "flex min-h-[4rem] flex-col items-center justify-center gap-0.5 rounded-2xl border-2 p-3 text-sm font-bold transition-colors",
                format === value
                  ? "border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]"
                  : "border-[var(--border)] bg-[var(--surface-2)] text-[var(--muted-text)]",
              )}
            >
              {label}
              <span className="text-xs font-normal">{sub}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Payment type */}
      <div className="space-y-2">
        <label className="text-sm font-semibold text-[var(--muted-text)]">Modalità di pagamento</label>
        <div className="grid grid-cols-3 gap-2">
          {PAYMENT_OPTIONS.map(({ value, label, sub, icon: Icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => setPaymentType(value)}
              className={cn(
                "flex min-h-[5rem] flex-col items-center justify-center gap-1 rounded-2xl border-2 p-3 text-xs font-bold transition-colors",
                paymentType === value
                  ? "border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]"
                  : "border-[var(--border)] bg-[var(--surface-2)] text-[var(--muted-text)]",
              )}
            >
              <Icon className="h-5 w-5" />
              {label}
              <span className="text-[0.65rem] font-normal text-center leading-tight opacity-70">{sub}</span>
            </button>
          ))}
        </div>

        {/* QUOTA — amount input */}
        {paymentType === "QUOTA" && (
          <div className="flex items-center gap-3 rounded-2xl bg-[var(--surface-2)] px-4 py-3">
            <Banknote className="h-5 w-5 shrink-0 text-[var(--accent)]" />
            <div className="flex-1">
              <p className="text-xs text-[var(--muted-text)] mb-1">Quota a persona (€)</p>
              <input
                type="number"
                min="0"
                step="0.50"
                value={quotaAmount}
                onChange={(e) => setQuotaAmount(e.target.value)}
                placeholder="es. 8.00"
                className="w-full bg-transparent text-lg font-black text-white focus:outline-none placeholder:text-[var(--muted-text)] placeholder:font-normal placeholder:text-base"
              />
            </div>
            <span className="text-2xl font-black text-[var(--accent)]">€</span>
          </div>
        )}

        {/* LOSER_PAYS — description input */}
        {paymentType === "LOSER_PAYS" && (
          <div className="flex items-center gap-3 rounded-2xl bg-[var(--surface-2)] px-4 py-3">
            <Beer className="h-5 w-5 shrink-0 text-[var(--accent)]" />
            <div className="flex-1">
              <p className="text-xs text-[var(--muted-text)] mb-1">Cosa paga chi perde?</p>
              <input
                type="text"
                maxLength={60}
                value={loserPays}
                onChange={(e) => setLoserPays(e.target.value)}
                placeholder="es. 1 birra a testa, una cena…"
                className="w-full bg-transparent text-base font-semibold text-white focus:outline-none placeholder:text-[var(--muted-text)] placeholder:font-normal"
              />
            </div>
          </div>
        )}
      </div>

      {/* Notes */}
      <div className="space-y-1.5">
        <label className="text-sm font-semibold text-[var(--muted-text)]">
          Note <span className="font-normal opacity-60">— opzionale</span>
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="es. Portate le vostre palline, si inizia alle 18:30"
          rows={2}
          maxLength={200}
          className="w-full resize-none rounded-xl bg-[var(--surface-2)] px-4 py-3 text-base text-[var(--foreground)] placeholder:text-[var(--muted-text)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
        />
      </div>

      {error && (
        <p role="alert" className="rounded-xl bg-[var(--danger)]/15 px-4 py-3 text-sm font-medium text-[var(--danger)]">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending || title.trim().length < 2 || location.trim().length < 2}
        className="flex min-h-[3.5rem] w-full items-center justify-center gap-2 rounded-2xl bg-[var(--accent)] font-bold text-black transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
      >
        {isPending ? (
          <>
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-black border-t-transparent" />
            Creazione...
          </>
        ) : (
          <>
            Crea Sessione
            <ChevronRight className="h-5 w-5" />
          </>
        )}
      </button>
    </form>
  )
}
