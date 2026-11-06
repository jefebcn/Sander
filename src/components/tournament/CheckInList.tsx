"use client"

import { useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Banknote, Check, Loader2, Search } from "lucide-react"
import { toast } from "sonner"
import { setCheckIn } from "@/actions/registration"

export interface CheckInEntry {
  id: string
  name: string
  spectator: boolean
  arrived: boolean
  /** Fee still to pay at the court. */
  owes: boolean
  /** Tapped "Ho pagato" after paying through the club's link: check and confirm. */
  claimed: boolean
}

/** Organiser at the court: who arrived and who paid, one tap each. */
export function CheckInList({ entries, price }: { entries: CheckInEntry[]; price: string | null }) {
  const [q, setQ] = useState("")
  const [busy, setBusy] = useState<string | null>(null)
  const [, startTransition] = useTransition()
  const router = useRouter()

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return entries
      .filter((e) => !needle || e.name.toLowerCase().includes(needle))
      .sort((a, b) => Number(a.arrived) - Number(b.arrived) || Number(b.claimed) - Number(a.claimed) || a.name.localeCompare(b.name, "it"))
  }, [entries, q])

  const act = (e: CheckInEntry, checkedIn: boolean, markPaid: boolean) => {
    setBusy(e.id + (markPaid ? ":pay" : ""))
    startTransition(async () => {
      const res = await setCheckIn({ registrationId: e.id, checkedIn, markPaid })
      setBusy(null)
      if (!res.ok) return void toast.error(res.error)
      router.refresh()
    })
  }

  return (
    <div className="flex flex-col gap-2">
      <label className="relative block">
        <span className="sr-only">Cerca un giocatore</span>
        <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--muted-text)]" aria-hidden="true" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Cerca un giocatore"
          className="min-h-[3.5rem] w-full rounded-2xl bg-[var(--surface-2)] pl-12 pr-4 text-base text-white placeholder:text-[var(--muted-text)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
        />
      </label>
      <ul className="flex flex-col gap-2">
        {shown.map((e) => (
          <li key={e.id} className="flex items-center gap-2 rounded-2xl bg-[var(--surface-2)] p-2 pl-4">
            <div className="min-w-0 flex-1">
              <p className={`truncate text-base font-bold ${e.arrived ? "text-[var(--muted-text)]" : "text-white"}`}>{e.name}</p>
              <p className="text-sm text-[var(--muted-text)]">
                {e.claimed ? (
                  <span className="font-bold text-[var(--accent)]">Dice di aver pagato online · controlla</span>
                ) : e.spectator ? "Spettatore" : e.owes ? `Da pagare${price ? ` · ${price}` : ""}` : "Quota a posto"}
              </p>
            </div>
            {e.owes && (
              <button
                type="button"
                disabled={busy !== null}
                onClick={() => act(e, true, true)}
                aria-label={`${e.name}: arrivato e pagato`}
                className="flex min-h-[3.5rem] items-center gap-1 rounded-2xl bg-[var(--accent)] px-3 text-sm font-bold text-black disabled:opacity-60"
              >
                {busy === e.id + ":pay" ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> : <Banknote className="h-5 w-5" aria-hidden="true" />}
                Pagato
              </button>
            )}
            <button
              type="button"
              disabled={busy !== null}
              onClick={() => act(e, !e.arrived, false)}
              aria-pressed={e.arrived}
              aria-label={e.arrived ? `${e.name}: annulla arrivo` : `${e.name}: arrivato`}
              className={`flex min-h-[3.5rem] items-center gap-1 rounded-2xl px-3 text-sm font-bold disabled:opacity-60 ${
                e.arrived ? "bg-[var(--live)] text-black" : "bg-[var(--surface-1)] text-white"
              }`}
            >
              {busy === e.id ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> : <Check className="h-5 w-5" aria-hidden="true" />}
              {e.arrived ? "Arrivato" : "Arrivato?"}
            </button>
          </li>
        ))}
      </ul>
      {shown.length === 0 && <p className="p-4 text-center text-base text-[var(--muted-text)]">Nessun giocatore trovato.</p>}
    </div>
  )
}
