"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { adminHidePhoto, adminKeepPhoto, adminSuspend, adminUnsuspend, adminCloseReport, adminResolveAbsence, adminReviewSelfie } from "@/actions/scopriAdmin"
import { cn } from "@/lib/utils"

type Action =
  | { kind: "hidePhoto"; photoId: string }
  | { kind: "keepPhoto"; photoId: string }
  | { kind: "suspend"; playerId: string; reason: string }
  | { kind: "unsuspend"; playerId: string }
  | { kind: "close"; reportId: string }
  | { kind: "keepAbsence"; eventId: string }
  | { kind: "cancelAbsence"; eventId: string }
  | { kind: "approveSelfie"; checkId: string }
  | { kind: "rejectSelfie"; checkId: string }

const LABEL: Record<Action["kind"], string> = {
  hidePhoto: "Rimuovi foto",
  keepPhoto: "Va bene",
  suspend: "Sospendi",
  unsuspend: "Riattiva",
  close: "Archivia",
  keepAbsence: "Confermo l'assenza",
  cancelAbsence: "Annulla l'assenza",
  approveSelfie: "È la stessa persona",
  rejectSelfie: "Non corrisponde",
}

const DONE: Record<Action["kind"], string> = {
  hidePhoto: "Foto rimossa",
  keepPhoto: "Foto approvata",
  suspend: "Profilo sospeso",
  unsuspend: "Profilo riattivato",
  close: "Segnalazione archiviata",
  keepAbsence: "Assenza confermata",
  cancelAbsence: "Assenza annullata",
  approveSelfie: "Foto verificata",
  rejectSelfie: "Verifica rifiutata",
}

/** One admin moderation button; destructive ones ask for confirmation. */
export function ModerationButton({ action, className }: { action: Action; className?: string }) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const danger = action.kind === "hidePhoto" || action.kind === "suspend" || action.kind === "rejectSelfie"

  function run() {
    if (danger && !window.confirm(`${LABEL[action.kind]}?`)) return
    start(async () => {
      try {
        if (action.kind === "hidePhoto") await adminHidePhoto({ photoId: action.photoId })
        else if (action.kind === "keepPhoto") await adminKeepPhoto({ photoId: action.photoId })
        else if (action.kind === "suspend") await adminSuspend({ playerId: action.playerId, reason: action.reason })
        else if (action.kind === "unsuspend") await adminUnsuspend({ playerId: action.playerId })
        else if (action.kind === "close") await adminCloseReport({ reportId: action.reportId })
        else if (action.kind === "approveSelfie" || action.kind === "rejectSelfie")
          await adminReviewSelfie({ checkId: action.checkId, approve: action.kind === "approveSelfie" })
        else await adminResolveAbsence({ eventId: action.eventId, keep: action.kind === "keepAbsence" })
        toast.success(DONE[action.kind])
        router.refresh()
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Non riuscito")
      }
    })
  }

  return (
    <button
      type="button"
      onClick={run}
      disabled={pending}
      className={cn(
        "min-h-[2.75rem] rounded-full px-4 text-sm font-extrabold disabled:opacity-50",
        danger ? "bg-[var(--danger)] text-white" : "bg-[var(--surface-4)] text-white",
        className,
      )}
    >
      {LABEL[action.kind]}
    </button>
  )
}
