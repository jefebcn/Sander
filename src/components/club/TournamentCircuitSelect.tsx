"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { setTournamentCircuit } from "@/actions/clubs"

/** Which circuit a club tournament counts for (or none). */
export function TournamentCircuitSelect({ tournamentId, circuitId, circuits }: { tournamentId: string; circuitId: string | null; circuits: { id: string; name: string }[] }) {
  const [pending, startTransition] = useTransition()
  const router = useRouter()
  return (
    <label className="flex flex-col gap-1 text-sm font-semibold text-[var(--muted-text)]">
      Tappa del circuito
      <select
        value={circuitId ?? ""}
        disabled={pending}
        onChange={(e) =>
          startTransition(async () => {
            const res = await setTournamentCircuit({ tournamentId, circuitId: e.target.value || null })
            if (!res.ok) return void toast.error(res.error)
            router.refresh()
          })
        }
        className="min-h-[3.5rem] rounded-2xl bg-[var(--surface-3)] px-3 text-base text-white"
      >
        <option value="">Nessun circuito</option>
        {circuits.map((c) => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>
    </label>
  )
}
