"use client"

import { useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { CalendarClock, Plus } from "lucide-react"
import { toast } from "sonner"
import { setMyAvailability, type AvailabilityGroup } from "@/actions/availability"
import type { AvailabilitySlotValue } from "@/lib/validators/availability.schema"
import { cn } from "@/lib/utils"

/* Monday first, as anyone in Italy reads a week. Values match Date.getDay(). */
const DAYS = [
  { value: 1, label: "Lun" },
  { value: 2, label: "Mar" },
  { value: 3, label: "Mer" },
  { value: 4, label: "Gio" },
  { value: 5, label: "Ven" },
  { value: 6, label: "Sab" },
  { value: 0, label: "Dom" },
]

const SLOTS: { value: AvailabilitySlotValue; label: string; short: string }[] = [
  { value: "MORNING", label: "Mattina", short: "Mattina" },
  { value: "AFTERNOON", label: "Pomeriggio", short: "Pome" },
  { value: "EVENING", label: "Sera", short: "Sera" },
]

const DAY_LABEL: Record<number, string> = {
  0: "Domenica", 1: "Lunedì", 2: "Martedì", 3: "Mercoledì",
  4: "Giovedì", 5: "Venerdì", 6: "Sabato",
}
const SLOT_LABEL: Record<AvailabilitySlotValue, string> = {
  MORNING: "mattina",
  AFTERNOON: "pomeriggio",
  EVENING: "sera",
}

const key = (weekday: number, slot: AvailabilitySlotValue) => `${weekday}-${slot}`

interface Props {
  initial: { weekday: number; slot: AvailabilitySlotValue }[]
  groups: AvailabilityGroup[]
}

export function AvailabilityBoard({ initial, groups }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const initialKeys = useMemo(
    () => new Set(initial.map((s) => key(s.weekday, s.slot))),
    [initial],
  )
  const [selected, setSelected] = useState<Set<string>>(initialKeys)

  const dirty =
    selected.size !== initialKeys.size ||
    [...selected].some((k) => !initialKeys.has(k))

  function toggle(weekday: number, slot: AvailabilitySlotValue) {
    setSelected((prev) => {
      const next = new Set(prev)
      const k = key(weekday, slot)
      if (next.has(k)) next.delete(k)
      else next.add(k)
      return next
    })
  }

  function save() {
    startTransition(async () => {
      const slots = [...selected].map((k) => {
        const [weekday, slot] = k.split("-")
        return { weekday: Number(weekday), slot: slot as AvailabilitySlotValue }
      })
      const res = await setMyAvailability({ slots })
      if (res.ok) {
        toast.success("Disponibilità salvata")
        router.refresh()
      } else {
        toast.error(res.error)
      }
    })
  }

  return (
    <section className="px-4 pb-5">
      <div className="rounded-2xl bg-[var(--surface-1)] p-4">
        <div className="flex items-center gap-2">
          <CalendarClock className="h-5 w-5 text-[var(--accent)]" aria-hidden="true" />
          <h2 className="text-base font-black text-white">Quando sei libero</h2>
        </div>
        <p className="mt-1 text-sm text-[var(--muted-text)]">
          Segna le tue fasce e scopri chi al tuo livello è libero negli stessi momenti.
        </p>

        {/* Payoff first: who is free when you are. */}
        {groups.length > 0 ? (
          <div className="mt-4 space-y-3">
            {groups.map((g) => (
              <div key={`${g.weekday}-${g.slot}`}>
                <p className="text-xs font-bold uppercase tracking-wider text-[var(--accent)]">
                  {DAY_LABEL[g.weekday]} {SLOT_LABEL[g.slot]} · {g.peers.length}{" "}
                  {g.peers.length === 1 ? "giocatore" : "giocatori"}
                </p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {g.peers.map((p) => (
                    <Link
                      key={p.id}
                      href={`/players/${p.id}`}
                      className="flex items-center gap-1.5 rounded-full bg-[var(--surface-2)] px-3 py-1.5 text-sm font-semibold text-white"
                    >
                      {p.name}
                      {p.complementary && (
                        <span className="text-[0.65rem] font-black text-[var(--accent)]">
                          ideale
                        </span>
                      )}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
            <Link
              href="/sessions/new"
              className="flex min-h-[3.5rem] w-full items-center justify-center gap-2 rounded-2xl font-black text-black"
              style={{ background: "var(--accent)" }}
            >
              <Plus className="h-5 w-5" aria-hidden="true" />
              Organizza una partita
            </Link>
          </div>
        ) : (
          <p className="mt-3 rounded-xl bg-[var(--surface-2)] px-4 py-3 text-sm text-[var(--muted-text)]">
            {selected.size === 0
              ? "Non hai ancora segnato nessuna fascia. Aprine una qui sotto: è il modo più veloce per trovare compagni."
              : "Nessuno al tuo livello è ancora libero in queste fasce. Riprova fra qualche giorno — o organizza tu la partita."}
          </p>
        )}

        {/* Editor kept collapsed: a 7x3 grid of proper touch targets would
            otherwise push the actual answer off the screen. */}
        <details className="mt-4">
          <summary className="cursor-pointer text-sm font-bold text-[var(--accent)]">
            {selected.size > 0 ? `Le tue fasce (${selected.size})` : "Scegli le tue fasce"}
          </summary>

          <div className="mt-3 space-y-1.5">
            {DAYS.map((d) => (
              <div key={d.value} className="flex items-center gap-1.5">
                <span className="w-10 shrink-0 text-xs font-bold text-[var(--muted-text)]">
                  {d.label}
                </span>
                {SLOTS.map((s) => {
                  const on = selected.has(key(d.value, s.value))
                  return (
                    <button
                      key={s.value}
                      type="button"
                      onClick={() => toggle(d.value, s.value)}
                      aria-pressed={on}
                      aria-label={`${DAY_LABEL[d.value]} ${s.label}`}
                      className={cn(
                        "flex min-h-[3.5rem] flex-1 items-center justify-center rounded-xl text-sm font-bold transition-colors",
                        on
                          ? "bg-[var(--accent)] text-black"
                          : "bg-[var(--surface-2)] text-[var(--muted-text)]",
                      )}
                    >
                      {s.short}
                    </button>
                  )
                })}
              </div>
            ))}
          </div>

          {dirty && (
            <button
              type="button"
              onClick={save}
              disabled={isPending}
              className="mt-3 flex min-h-[3.5rem] w-full items-center justify-center rounded-2xl font-black text-black disabled:opacity-60"
              style={{ background: "var(--accent)" }}
            >
              {isPending ? (
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-black border-t-transparent" />
              ) : (
                "Salva disponibilità"
              )}
            </button>
          )}
        </details>
      </div>
    </section>
  )
}
