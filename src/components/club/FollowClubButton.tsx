"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { BellPlus, Check } from "lucide-react"
import { toast } from "sonner"
import { followClub } from "@/actions/clubs"

/** Follow a club: new tournaments arrive as notifications. Guests go to sign in. */
export function FollowClubButton({ clubId, following, signedIn, slug }: { clubId: string; following: boolean; signedIn: boolean; slug: string }) {
  const [on, setOn] = useState(following)
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  function toggle() {
    if (!signedIn) {
      router.push(`/auth/signin?callbackUrl=/c/${slug}`)
      return
    }
    startTransition(async () => {
      const res = await followClub({ clubId, follow: !on })
      if (!res.ok) return void toast.error(res.error)
      setOn(!on)
      if (!on) toast.success("Ti avvisiamo quando esce un torneo")
    })
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      aria-pressed={on}
      className={on ? "btn btn-secondary w-full gap-2" : "btn btn-primary w-full gap-2"}
    >
      {on ? <Check className="h-5 w-5" aria-hidden="true" /> : <BellPlus className="h-5 w-5" aria-hidden="true" />}
      {on ? "Segui già" : "Segui il club"}
    </button>
  )
}
