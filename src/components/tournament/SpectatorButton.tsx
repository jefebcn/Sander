"use client"

import { useTransition, useState } from "react"
import { Beer, Loader2, CheckCircle } from "lucide-react"
import { registerAsSpectator } from "@/actions/registration"
import { formatPrice } from "@/lib/utils"

interface Props {
  tournamentId: string
  alreadyRegistered: boolean
  spectatorPriceCents: number | null
  priceCurrency: string
}

export function SpectatorButton({ tournamentId, alreadyRegistered, spectatorPriceCents, priceCurrency }: Props) {
  const [pending, startTransition] = useTransition()
  const [done, setDone] = useState(alreadyRegistered)
  const [error, setError] = useState<string | null>(null)

  if (done) {
    return (
      <div className="flex items-center gap-2 rounded-2xl bg-[var(--surface-2)] px-4 py-3 text-sm text-[var(--muted-text)]">
        <CheckCircle className="h-4 w-4 text-[var(--live)] shrink-0" />
        Sei nella lista dei bevitori 🍺
      </div>
    )
  }

  const label = spectatorPriceCents
    ? `Spettatore che BEVE · ${formatPrice(spectatorPriceCents, priceCurrency)}`
    : "Spettatore che BEVE (gratuito)"

  return (
    <div className="flex flex-col gap-1">
      <button
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const res = await registerAsSpectator(tournamentId)
            if (res.ok) setDone(true)
            else setError(res.error)
          })
        }
        className="flex min-h-[3rem] w-full items-center justify-center gap-2 rounded-2xl bg-[var(--surface-2)] text-sm font-semibold text-[var(--muted-text)] transition-colors hover:text-white disabled:opacity-50"
      >
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Beer className="h-4 w-4" />}
        {label}
      </button>
      {error && <p className="text-xs text-[var(--danger)] text-center">{error}</p>}
    </div>
  )
}
