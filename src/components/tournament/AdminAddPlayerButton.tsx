"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { UserPlus } from "lucide-react"
import { AdminAddPlayerSheet } from "./AdminAddPlayerSheet"

interface AdminAddPlayerButtonProps {
  tournamentId: string
  existingPlayerIds: string[]
}

export function AdminAddPlayerButton({
  tournamentId,
  existingPlayerIds,
}: AdminAddPlayerButtonProps) {
  const [open, setOpen] = useState(false)
  const router = useRouter()

  function handleDone() {
    setOpen(false)
    router.refresh()
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex min-h-[3rem] w-full items-center justify-center gap-2 rounded-2xl border border-[var(--accent)]/30 bg-[var(--surface-1)] font-semibold text-[var(--accent)] transition-all active:scale-[0.98] hover:bg-[var(--accent)]/10"
      >
        <UserPlus className="h-4 w-4" aria-hidden="true" />
        Aggiungi giocatore
      </button>

      {open && (
        <AdminAddPlayerSheet
          tournamentId={tournamentId}
          existingPlayerIds={existingPlayerIds}
          onClose={() => setOpen(false)}
          onDone={handleDone}
        />
      )}
    </>
  )
}
