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
        className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold text-[var(--accent)] transition-colors hover:bg-[var(--accent)]/10"
      >
        <UserPlus className="h-3.5 w-3.5" aria-hidden="true" />
        Aggiungi
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
