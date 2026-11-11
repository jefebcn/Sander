"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { Sheet } from "@/components/ui/Sheet"

/** A button that opens a bottom sheet with whatever the page puts inside (share options, stat editor…). */
export function SheetButton({
  label,
  title,
  description,
  icon,
  primary,
  className,
  children,
}: {
  label: string
  title: string
  description?: string
  icon?: React.ReactNode
  primary?: boolean
  className?: string
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "flex min-h-[3.5rem] flex-1 items-center justify-center gap-2 rounded-full text-base font-extrabold transition-transform active:scale-[0.98]",
          primary ? "bg-[var(--accent)] text-black" : "bg-[var(--surface-2)] text-white",
          className,
        )}
      >
        {icon}
        {label}
      </button>
      <Sheet open={open} onOpenChange={setOpen} title={title} description={description}>
        {children}
      </Sheet>
    </>
  )
}
