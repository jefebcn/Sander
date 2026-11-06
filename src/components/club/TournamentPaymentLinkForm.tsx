"use client"

import { useState, useTransition } from "react"
import { Check, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { setTournamentPaymentLink } from "@/actions/clubs"

/** Staff: a payment link for this tournament only; empty uses the club's. */
export function TournamentPaymentLinkForm({ tournamentId, initial, clubLink }: { tournamentId: string; initial: string | null; clubLink: string | null }) {
  const [value, setValue] = useState(initial ?? "")
  const [pending, startTransition] = useTransition()
  return (
    <form
      className="flex flex-col gap-2 rounded-2xl bg-[var(--surface-2)] p-4"
      onSubmit={(e) => {
        e.preventDefault()
        startTransition(async () => {
          const res = await setTournamentPaymentLink({ tournamentId, paymentLink: value })
          if (!res.ok) return void toast.error(res.error)
          toast.success(value.trim() ? "Link di pagamento salvato" : "Si usa il link del club")
        })
      }}
    >
      <label htmlFor="t-pay" className="text-sm font-bold text-[var(--muted-text)]">Link di pagamento di questo torneo</label>
      <div className="flex gap-2">
        <input
          id="t-pay"
          type="url"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={clubLink ? "Vuoto: si usa quello del club" : "Es. https://paypal.me/vostroclub"}
          className="min-h-[3.5rem] min-w-0 flex-1 rounded-2xl bg-[var(--surface-1)] px-4 text-base text-white placeholder:text-[var(--muted-text)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
        />
        <button type="submit" disabled={pending} aria-label="Salva il link di pagamento" className="btn btn-primary min-h-[3.5rem] px-4">
          {pending ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> : <Check className="h-5 w-5" aria-hidden="true" />}
        </button>
      </div>
    </form>
  )
}
