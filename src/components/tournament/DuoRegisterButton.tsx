"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { Users, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { registerDuoForTournament } from "@/actions/registration"

/** "Iscrivi la coppia": you and your Scopri partner, side by side. */
export function DuoRegisterButton({ tournamentId, duoName }: { tournamentId: string; duoName: string }) {
  const router = useRouter()
  const [pending, start] = useTransition()
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        start(async () => {
          const res = await registerDuoForTournament({ tournamentId })
          if (res.ok) {
            toast.success(`${duoName} è iscritta`)
            router.refresh()
          } else toast.error(res.error)
        })
      }
      className="tone-social flex min-h-[3.5rem] w-full items-center justify-center gap-2 rounded-2xl bg-[var(--tone-soft)] text-base font-extrabold text-[var(--tone)] ring-1 ring-[var(--tone-line)] disabled:opacity-60"
    >
      {pending ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> : <Users className="h-5 w-5" aria-hidden="true" />}
      Iscrivi la coppia {duoName}
    </button>
  )
}
