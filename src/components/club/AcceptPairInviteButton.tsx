"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Users } from "lucide-react"
import { toast } from "sonner"
import { acceptPairInvite } from "@/actions/registration"

export function AcceptPairInviteButton({ token }: { token: string }) {
  const [pending, startTransition] = useTransition()
  const router = useRouter()
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const res = await acceptPairInvite(token)
          if (!res.ok) return void toast.error(res.error)
          toast.success("Siete iscritti!")
          router.push(`/tournaments/${res.tournamentId}`)
        })
      }
      className="btn btn-primary w-full gap-2"
    >
      {pending ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> : <Users className="h-5 w-5" aria-hidden="true" />}
      Accetto, facciamo coppia
    </button>
  )
}
