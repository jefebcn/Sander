"use client"

import { useState, useTransition, useEffect } from "react"
import { useRouter } from "next/navigation"
import { MapPin, ChevronRight, Banknote, Beer, Gift, Shuffle, Coins, ChevronDown } from "lucide-react"
import { createSession } from "@/actions/sessions"
import { POPULAR_BAGNI, bagnoLabel } from "@/lib/bagni"
import { cn } from "@/lib/utils"

const FORMATS = [
  { value: "TWO_VS_TWO",     label: "2 vs 2", sub: "4 gioc." },
  { value: "THREE_VS_THREE", label: "3 vs 3", sub: "6 gioc." },
  { value: "FOUR_VS_FOUR",   label: "4 vs 4", sub: "8 gioc." },
] as const

type Format = (typeof FORMATS)[number]["value"]
type PaymentType = "FREE" | "QUOTA" | "LOSER_PAYS" | "SC"

const PAYMENT_OPTIONS: { value: PaymentType; label: string; icon: React.ElementType }[] = [
  { value: "FREE",       label: "Gratis",   icon: Gift },
  { value: "QUOTA",      label: "A quota",  icon: Banknote },
  { value: "LOSER_PAYS", label: "Chi perde",icon: Beer },
  { value: "SC",         label: "SC",       icon: Coins },
]

interface Presets {
  format: string
  location: string
  paymentType: string
  quotaAmount: number | null
  loserPays: string | null
  matchMode: boolean
}

function nowIso() {
  const d = new Date()
  d.setSeconds(0, 0)
  return d.toISOString().slice(0, 16)
}

function formatDateLabel(iso: string) {
  const d = new Date(iso)
  const today = new Date()
  const isToday = d.toDateString() === today.toDateString()
  const time = d.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })
  if (isToday) return `Oggi, ${time}`
  return `${d.toLocaleDateString("it-IT", { day: "2-digit", month: "short" })}, ${time}`
}

const LOCATIONS_KEY = "sander_locations"

function saveLocation(location: string) {
  if (!location.trim()) return
  try {
    const stored = localStorage.getItem(LOCATIONS_KEY)
    const existing: string[] = stored ? (JSON.parse(stored) as string[]) : []
    const deduped = [location, ...existing.filter((l) => l !== location)].slice(0, 5)
    localStorage.setItem(LOCATIONS_KEY, JSON.stringify(deduped))
  } catch {
    // ignore
  }
}

function presetsToQuotaDisplay(presets: Presets): string {
  if (presets.quotaAmount == null) return ""
  if (presets.paymentType === "QUOTA") {
    // DB stores cents for QUOTA → convert to euros string
    return (presets.quotaAmount / 100).toFixed(2)
  }
  if (presets.paymentType === "SC") {
    // DB stores raw integer for SC
    return String(presets.quotaAmount)
  }
  return ""
}

export function CreateSessionForm({ presets }: { presets?: Presets }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const [format, setFormat] = useState<Format>(
    (presets?.format as Format | undefined) ?? "TWO_VS_TWO",
  )
  const [location, setLocation] = useState(presets?.location ?? "")
  const [date, setDate] = useState(nowIso)
  const [paymentType, setPaymentType] = useState<PaymentType>(
    (presets?.paymentType as PaymentType | undefined) ?? "FREE",
  )
  const [quotaAmount, setQuotaAmount] = useState(
    presets ? presetsToQuotaDisplay(presets) : "",
  )
  const [loserPays, setLoserPays] = useState(presets?.loserPays ?? "")
  const [matchMode, setMatchMode] = useState(presets?.matchMode ?? false)
  const [notes, setNotes] = useState("")
  const [showAdvanced, setShowAdvanced] = useState(false)

  const [recentLocations, setRecentLocations] = useState<string[]>([])

  useEffect(() => {
    try {
      const stored = localStorage.getItem(LOCATIONS_KEY)
      if (stored) {
        setRecentLocations(JSON.parse(stored) as string[])
      }
    } catch {
      // ignore
    }
  }, [])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      try {
        const session = await createSession({
          location,
          date: new Date(date),
          format,
          notes: notes || undefined,
          paymentType,
          quotaAmount:
            paymentType === "QUOTA" && quotaAmount
              ? Math.round(parseFloat(quotaAmount) * 100)
              : paymentType === "SC" && quotaAmount
              ? parseInt(quotaAmount, 10)
              : undefined,
          loserPays: paymentType === "LOSER_PAYS" && loserPays ? loserPays : undefined,
          matchMode: format === "TWO_VS_TWO" ? matchMode : false,
        })
        saveLocation(location)
        router.push(`/sessions/${session.id}`)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Errore durante la creazione")
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 px-4 pb-8">
      {/* Format — first and largest */}
      <div className="grid grid-cols-3 gap-2">
        {FORMATS.map(({ value, label, sub }) => (
          <button
            key={value}
            type="button"
            onClick={() => setFormat(value)}
            className={cn(
              "flex min-h-[5rem] flex-col items-center justify-center gap-1 rounded-2xl border-2 p-3 transition-colors",
              format === value
                ? "border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]"
                : "border-[var(--border)] bg-[var(--surface-2)] text-[var(--muted-text)]",
            )}
          >
            <span className="text-lg font-black">{label}</span>
            <span className="text-xs font-normal">{sub}</span>
          </button>
        ))}
      </div>

      {/* Location — optional */}
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-text)]" aria-hidden="true" />
        <input
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Bagno o campo (es. Bagno 26)"
          className="w-full rounded-xl bg-[var(--surface-2)] py-3 pl-9 pr-4 text-base text-[var(--foreground)] placeholder:text-[var(--muted-text)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
        />
      </div>

      {/* Popular bagni quick-pick — keeps locations clean & consistent */}
      <div className="flex flex-wrap gap-1.5">
        {POPULAR_BAGNI.map((n) => {
          const label = bagnoLabel(n)
          return (
            <button
              key={n}
              type="button"
              onClick={() => setLocation(label)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-bold transition-colors",
                location === label
                  ? "border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]"
                  : "border-[var(--border)] bg-[var(--surface-2)] text-[var(--muted-text)]",
              )}
            >
              🏖️ {n}
            </button>
          )
        })}
      </div>

      {/* Recent location pills */}
      {recentLocations.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {recentLocations.map((loc) => (
            <button
              key={loc}
              type="button"
              onClick={() => setLocation(loc)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-semibold transition-colors",
                location === loc
                  ? "border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]"
                  : "border-[var(--border)] bg-[var(--surface-2)] text-[var(--muted-text)]",
              )}
            >
              📍 {loc}
            </button>
          ))}
        </div>
      )}

      {/* Date — styled tap-target over a hidden native input */}
      <div className="relative">
        <div className="flex items-center gap-3 rounded-xl bg-[var(--surface-2)] px-4 py-3 pointer-events-none">
          <span className="text-base" aria-hidden="true">📅</span>
          <span className="flex-1 text-base font-semibold text-white">{formatDateLabel(date)}</span>
          <span className="text-xs font-semibold text-[var(--accent)]">Cambia</span>
        </div>
        <input
          type="datetime-local"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="absolute inset-0 opacity-0 cursor-pointer w-full"
          style={{ colorScheme: "dark" }}
        />
      </div>

      {/* Payment — 4 compact pills */}
      <div className="grid grid-cols-4 gap-1.5">
        {PAYMENT_OPTIONS.map(({ value, label, icon: Icon }) => (
          <button
            key={value}
            type="button"
            onClick={() => setPaymentType(value)}
            className={cn(
              "flex flex-col items-center gap-1.5 rounded-xl border-2 py-3 px-1 text-[0.65rem] font-bold transition-colors",
              paymentType === value
                ? "border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]"
                : "border-[var(--border)] bg-[var(--surface-2)] text-[var(--muted-text)]",
            )}
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
            {label}
          </button>
        ))}
      </div>

      {/* Conditional payment detail */}
      {paymentType === "QUOTA" && (
        <div className="flex items-center gap-3 rounded-xl bg-[var(--surface-2)] px-4 py-3">
          <Banknote className="h-5 w-5 shrink-0 text-[var(--accent)]" aria-hidden="true" />
          <input
            type="number"
            min="0"
            step="0.50"
            value={quotaAmount}
            onChange={(e) => setQuotaAmount(e.target.value)}
            placeholder="Quota a persona (€)"
            autoFocus
            className="flex-1 bg-transparent text-base font-semibold text-white focus:outline-none placeholder:text-[var(--muted-text)] placeholder:font-normal"
          />
          <span className="text-xl font-black text-[var(--accent)]">€</span>
        </div>
      )}
      {paymentType === "LOSER_PAYS" && (
        <div className="flex items-center gap-3 rounded-xl bg-[var(--surface-2)] px-4 py-3">
          <Beer className="h-5 w-5 shrink-0 text-[var(--accent)]" aria-hidden="true" />
          <input
            type="text"
            maxLength={60}
            value={loserPays}
            onChange={(e) => setLoserPays(e.target.value)}
            placeholder="Cosa paga chi perde? (es. 1 birra)"
            autoFocus
            className="flex-1 bg-transparent text-base font-semibold text-white focus:outline-none placeholder:text-[var(--muted-text)] placeholder:font-normal"
          />
        </div>
      )}
      {paymentType === "SC" && (
        <div className="flex items-center gap-3 rounded-xl bg-[var(--surface-2)] px-4 py-3">
          <Coins className="h-5 w-5 shrink-0 text-[var(--accent)]" aria-hidden="true" />
          <input
            type="number"
            min="1"
            step="1"
            value={quotaAmount}
            onChange={(e) => setQuotaAmount(e.target.value)}
            placeholder="Costo a persona (SC)"
            autoFocus
            className="flex-1 bg-transparent text-base font-semibold text-white focus:outline-none placeholder:text-[var(--muted-text)] placeholder:font-normal"
          />
          <span className="text-xl font-black text-[var(--accent)]">SC</span>
        </div>
      )}

      {/* Advanced — collapsible */}
      <button
        type="button"
        onClick={() => setShowAdvanced((v) => !v)}
        className="flex items-center gap-1.5 text-sm text-[var(--muted-text)] pt-1"
      >
        <ChevronDown
          className={cn("h-4 w-4 transition-transform", showAdvanced && "rotate-180")}
          aria-hidden="true"
        />
        Opzioni avanzate
      </button>

      {showAdvanced && (
        <div className="space-y-3">
          {format === "TWO_VS_TWO" && (
            <button
              type="button"
              onClick={() => setMatchMode((v) => !v)}
              className={cn(
                "flex w-full items-center gap-3 rounded-2xl border-2 px-4 py-3.5 text-left transition-colors",
                matchMode
                  ? "border-[var(--accent)] bg-[var(--accent)]/10"
                  : "border-[var(--border)] bg-[var(--surface-2)]",
              )}
            >
              <Shuffle className={cn("h-5 w-5 shrink-0", matchMode ? "text-[var(--accent)]" : "text-[var(--muted-text)]")} aria-hidden="true" />
              <div className="flex-1">
                <p className={cn("text-sm font-bold", matchMode ? "text-[var(--accent)]" : "text-white")}>
                  Modalità multi-partita
                </p>
                <p className="text-xs text-[var(--muted-text)]">Le coppie ruotano tra i gironi</p>
              </div>
              <div className={cn("h-6 w-10 rounded-full transition-colors", matchMode ? "bg-[var(--accent)]" : "bg-[var(--border)]")}>
                <div className={cn("mt-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform", matchMode ? "translate-x-4.5 ml-0.5" : "ml-0.5")} />
              </div>
            </button>
          )}
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Note (opzionale)"
            rows={2}
            maxLength={200}
            className="w-full resize-none rounded-xl bg-[var(--surface-2)] px-4 py-3 text-base text-[var(--foreground)] placeholder:text-[var(--muted-text)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
          />
        </div>
      )}

      {error && (
        <p role="alert" className="rounded-xl bg-[var(--danger)]/15 px-4 py-3 text-sm font-medium text-[var(--danger)]">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="flex min-h-[3.5rem] w-full items-center justify-center gap-2 rounded-2xl bg-[var(--accent)] font-bold text-black transition-all active:scale-[0.98] disabled:opacity-60"
      >
        {isPending ? (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-black border-t-transparent" />
        ) : (
          <>Crea Sessione <ChevronRight className="h-5 w-5" aria-hidden="true" /></>
        )}
      </button>
    </form>
  )
}
