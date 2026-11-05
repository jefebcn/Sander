"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { Banknote, Check, Loader2, Undo2 } from "lucide-react"
import { toast } from "sonner"
import { setCheckIn } from "@/actions/registration"

/** What the organiser sees after scanning a player's QR. */
export function CheckInActions({ registrationId, arrived, owes, price }: { registrationId: string; arrived: boolean; owes: boolean; price: string | null }) {
  const [pending, startTransition] = useTransition()
  const router = useRouter()
  const act = (checkedIn: boolean, markPaid: boolean) =>
    startTransition(async () => {
      const res = await setCheckIn({ registrationId, checkedIn, markPaid })
      if (!res.ok) return void toast.error(res.error)
      toast.success(checkedIn ? "Check-in fatto" : "Check-in annullato")
      router.refresh()
    })

  if (arrived) {
    return (
      <div className="flex flex-col gap-2">
        {owes && (
          <button type="button" disabled={pending} onClick={() => act(true, true)} className="btn btn-primary w-full gap-2">
            <Banknote className="h-5 w-5" aria-hidden="true" /> Segna la quota pagata{price ? ` (${price})` : ""}
          </button>
        )}
        <button type="button" disabled={pending} onClick={() => act(false, false)} className="btn btn-secondary w-full gap-2">
          <Undo2 className="h-5 w-5" aria-hidden="true" /> Annulla il check-in
        </button>
      </div>
    )
  }
  return (
    <div className="flex flex-col gap-2">
      {owes && (
        <button type="button" disabled={pending} onClick={() => act(true, true)} className="btn btn-primary w-full gap-2">
          {pending ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> : <Banknote className="h-5 w-5" aria-hidden="true" />}
          Arrivato e pagato{price ? ` (${price})` : ""}
        </button>
      )}
      <button type="button" disabled={pending} onClick={() => act(true, false)} className={`btn w-full gap-2 ${owes ? "btn-secondary" : "btn-primary"}`}>
        {pending && !owes ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> : <Check className="h-5 w-5" aria-hidden="true" />}
        {owes ? "Arrivato, paga dopo" : "Segna arrivato"}
      </button>
    </div>
  )
}
