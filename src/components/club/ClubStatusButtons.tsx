"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { adminSetClubStatus } from "@/actions/clubs"

type Status = "PENDING" | "APPROVED" | "REJECTED" | "SUSPENDED"

/** Admin: approve, reject or suspend a club from /admin/club. */
export function ClubStatusButtons({ clubId, status }: { clubId: string; status: Status }) {
  const [pending, startTransition] = useTransition()
  const router = useRouter()
  const set = (next: "APPROVED" | "REJECTED" | "SUSPENDED") =>
    startTransition(async () => {
      const res = await adminSetClubStatus({ clubId, status: next })
      if (!res.ok) return void toast.error(res.error)
      router.refresh()
    })

  return (
    <div className="flex gap-2">
      {status !== "APPROVED" && (
        <button type="button" disabled={pending} onClick={() => set("APPROVED")} className="btn btn-primary min-h-[3.5rem] flex-1">
          Approva
        </button>
      )}
      {status === "PENDING" && (
        <button type="button" disabled={pending} onClick={() => set("REJECTED")} className="btn btn-secondary min-h-[3.5rem] flex-1">
          Rifiuta
        </button>
      )}
      {status === "APPROVED" && (
        <button type="button" disabled={pending} onClick={() => set("SUSPENDED")} className="btn btn-secondary min-h-[3.5rem] flex-1">
          Sospendi
        </button>
      )}
    </div>
  )
}
