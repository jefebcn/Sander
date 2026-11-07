"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Power } from "lucide-react"
import { toast } from "sonner"
import { closeClub } from "@/actions/clubs"

/** Owner: close the club (hidden from the app; past tournaments stay). */
export function CloseClubButton({ clubId, name }: { clubId: string; name: string }) {
  const [pending, startTransition] = useTransition()
  const router = useRouter()
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (!window.confirm(`Chiudere ${name}? Il club sparisce da SANDER (i tornei passati restano). Per riaprirlo dovrai scriverci.`)) return
        startTransition(async () => {
          const res = await closeClub(clubId)
          if (!res.ok) return void toast.error(res.error)
          toast.success("Club chiuso")
          router.replace(`/c/${res.slug}`)
        })
      }}
      className="flex min-h-[3.5rem] w-full items-center justify-center gap-2 rounded-2xl text-base font-bold text-[var(--danger)] ring-1 ring-[var(--danger)]/40"
    >
      {pending ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> : <Power className="h-5 w-5" aria-hidden="true" />}
      Chiudi il club
    </button>
  )
}
