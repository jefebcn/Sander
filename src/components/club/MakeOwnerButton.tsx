"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { Crown, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { transferClubOwnership } from "@/actions/clubs"

/** Owner: hand the club to a staff member (the owner stays in the staff). */
export function MakeOwnerButton({ clubId, playerId, name }: { clubId: string; playerId: string; name: string }) {
  const [pending, startTransition] = useTransition()
  const router = useRouter()
  return (
    <button
      type="button"
      disabled={pending}
      aria-label={`Rendi ${name} proprietario`}
      onClick={() => {
        if (!window.confirm(`Passare il club a ${name}? Tu resti nello staff, ma non potrai più invitare o togliere persone.`)) return
        startTransition(async () => {
          const res = await transferClubOwnership({ clubId, playerId })
          if (!res.ok) return void toast.error(res.error)
          toast.success(`${name} ora è il proprietario`)
          router.refresh()
        })
      }}
      className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-[var(--muted-text)]"
    >
      {pending ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> : <Crown className="h-5 w-5" aria-hidden="true" />}
    </button>
  )
}
