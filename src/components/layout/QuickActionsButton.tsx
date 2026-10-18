"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { QuickActionsSheet } from "./QuickActionsSheet"

/** The "+" that opens the quick actions (create, find, score, invite). */
export function QuickActionsButton({ className }: { className?: string }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Azioni rapide: crea, trova, segna, invita"
        aria-haspopup="dialog"
        aria-expanded={open}
        className={cn(
          "flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[var(--surface-2)] text-white ring-1 ring-[var(--border)] transition-transform active:scale-90",
          className,
        )}
      >
        <Plus className={cn("h-6 w-6 transition-transform duration-300", open && "rotate-45")} strokeWidth={2.5} aria-hidden="true" />
      </button>
      <QuickActionsSheet open={open} onOpenChange={setOpen} />
    </>
  )
}
