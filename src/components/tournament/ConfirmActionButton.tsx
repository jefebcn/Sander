"use client"

import { useState, useTransition } from "react"
import { AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"

interface ConfirmActionButtonProps {
  action: () => Promise<void>
  label: string
  confirmLabel: string
  description: string
  className?: string
}

export function ConfirmActionButton({
  action,
  label,
  confirmLabel,
  description,
  className,
}: ConfirmActionButtonProps) {
  const [confirming, setConfirming] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleClick() {
    if (!confirming) {
      setConfirming(true)
      return
    }
    startTransition(async () => {
      await action()
      setConfirming(false)
    })
  }

  return (
    <div className="space-y-2">
      {confirming && (
        <p className="flex items-center gap-2 rounded-xl bg-[var(--danger)]/10 px-3 py-2 text-xs text-[var(--danger)]">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          {description}
        </p>
      )}
      <div className="flex gap-2">
        {confirming && (
          <button
            type="button"
            onClick={() => setConfirming(false)}
            className="flex min-h-[3.5rem] flex-1 items-center justify-center rounded-2xl bg-[var(--surface-2)] font-semibold text-[var(--muted-text)] transition-colors hover:bg-[var(--surface-3)]"
          >
            Annulla
          </button>
        )}
        <button
          type="button"
          onClick={handleClick}
          disabled={isPending}
          className={cn(
            "flex min-h-[3.5rem] flex-1 items-center justify-center gap-2 rounded-2xl font-semibold transition-all active:scale-[0.98] disabled:opacity-50",
            confirming
              ? "bg-[var(--danger)] text-white"
              : "bg-[var(--surface-2)] text-[var(--muted-text)] hover:bg-[var(--surface-3)]",
            className,
          )}
        >
          {isPending ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          ) : confirming ? (
            confirmLabel
          ) : (
            label
          )}
        </button>
      </div>
    </div>
  )
}
