"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { Loader2, ShieldCheck } from "lucide-react"
import { toast } from "sonner"
import { acceptStaffInvite } from "@/actions/clubs"

export function StaffJoinButton({ token }: { token: string }) {
  const [pending, startTransition] = useTransition()
  const router = useRouter()
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const res = await acceptStaffInvite(token)
          if (!res.ok) return void toast.error(res.error)
          toast.success("Sei nello staff!")
          router.replace(`/c/${res.slug}/gestione`)
        })
      }
      className="btn btn-primary w-full gap-2"
    >
      {pending ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> : <ShieldCheck className="h-5 w-5" aria-hidden="true" />}
      Entra nello staff
    </button>
  )
}
