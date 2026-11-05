"use client"

import { useState, useTransition } from "react"
import { Copy, Loader2, MessageCircle, UserPlus } from "lucide-react"
import { toast } from "sonner"
import { createStaffInvite } from "@/actions/clubs"

/** Owner: makes the staff link (a new one replaces the old) and shares it. */
export function StaffInviteButton({ clubId, clubSlug, clubName }: { clubId: string; clubSlug: string; clubName: string }) {
  const [token, setToken] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const link = () => `${window.location.origin}/c/${clubSlug}/staff/${token}`

  if (!token) {
    return (
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const res = await createStaffInvite(clubId)
            if (!res.ok) return void toast.error(res.error)
            setToken(res.token)
          })
        }
        className="btn btn-secondary w-full gap-2"
      >
        {pending ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> : <UserPlus className="h-5 w-5" aria-hidden="true" />}
        Invita nello staff
      </button>
    )
  }
  return (
    <div className="flex flex-col gap-2 rounded-2xl bg-[var(--surface-2)] p-4">
      <p className="text-base text-white">Manda il link a chi organizza con te: aprendolo entra nello staff. Il link precedente non vale più.</p>
      <button
        type="button"
        onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(`Entra nello staff di ${clubName} su SANDER: ${link()}`)}`, "_blank", "noopener,noreferrer")}
        className="btn btn-primary w-full gap-2"
      >
        <MessageCircle className="h-5 w-5" aria-hidden="true" /> Manda su WhatsApp
      </button>
      <button
        type="button"
        onClick={() => navigator.clipboard?.writeText(link()).then(() => toast.success("Link copiato"), () => toast.error(link()))}
        className="btn btn-secondary w-full gap-2"
      >
        <Copy className="h-5 w-5" aria-hidden="true" /> Copia il link
      </button>
    </div>
  )
}
