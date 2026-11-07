"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { Ban, Loader2, RotateCcw, Undo2 } from "lucide-react"
import { toast } from "sonner"
import { adminSetRankingExcluded, adminVoidSession } from "@/actions/adminFairPlay"

export function ExcludeButton({ playerId, name, excluded }: { playerId: string; name: string; excluded: boolean }) {
  const [pending, startTransition] = useTransition()
  const router = useRouter()
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (!excluded && !window.confirm(`Escludere ${name} da tutte le classifiche? Riceve una notifica.`)) return
        startTransition(async () => {
          const res = await adminSetRankingExcluded({ playerId, excluded: !excluded })
          if (!res.ok) return void toast.error(res.error)
          toast.success(res.message)
          router.refresh()
        })
      }}
      className={`flex min-h-[3.5rem] w-full items-center justify-center gap-2 rounded-2xl text-base font-bold ${excluded ? "bg-[var(--surface-3)] text-white" : "text-[var(--danger)] ring-1 ring-[var(--danger)]/40"}`}
    >
      {pending ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> : excluded ? <RotateCcw className="h-5 w-5" aria-hidden="true" /> : <Ban className="h-5 w-5" aria-hidden="true" />}
      {excluded ? "Riammetti in classifica" : "Escludi dalle classifiche"}
    </button>
  )
}

export function VoidSessionButton({ sessionId, title }: { sessionId: string; title: string }) {
  const [pending, startTransition] = useTransition()
  const router = useRouter()
  return (
    <button
      type="button"
      disabled={pending}
      aria-label={`Annulla il risultato di ${title}`}
      onClick={() => {
        if (!window.confirm(`Annullare "${title}"? Vittorie, sconfitte e rating di tutti i giocatori di quella partita tornano come prima.`)) return
        startTransition(async () => {
          const res = await adminVoidSession(sessionId)
          if (!res.ok) return void toast.error(res.error)
          toast.success(res.message)
          router.refresh()
        })
      }}
      className="flex min-h-[3rem] shrink-0 items-center gap-1 rounded-xl px-3 text-sm font-bold text-[var(--danger)] ring-1 ring-[var(--danger)]/40"
    >
      {pending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Undo2 className="h-4 w-4" aria-hidden="true" />} Annulla
    </button>
  )
}
