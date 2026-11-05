"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { Loader2, UserMinus } from "lucide-react"
import { toast } from "sonner"
import { removeStaffMember } from "@/actions/clubs"

export function RemoveStaffButton({ clubId, playerId, name }: { clubId: string; playerId: string; name: string }) {
  const [pending, startTransition] = useTransition()
  const router = useRouter()
  return (
    <button
      type="button"
      disabled={pending}
      aria-label={`Togli ${name} dallo staff`}
      onClick={() => {
        if (!window.confirm(`Togliere ${name} dallo staff?`)) return
        startTransition(async () => {
          const res = await removeStaffMember({ clubId, playerId })
          if (!res.ok) return void toast.error(res.error)
          toast.success(`${name} non è più nello staff`)
          router.refresh()
        })
      }}
      className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-[var(--muted-text)]"
    >
      {pending ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> : <UserMinus className="h-5 w-5" aria-hidden="true" />}
    </button>
  )
}
