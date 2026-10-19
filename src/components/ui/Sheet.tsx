"use client"

import * as RadixDialog from "@radix-ui/react-dialog"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * Bottom sheet: the one overlay for choices made with a thumb. Above the
 * navbar (z-60), safe-area aware, closes on swipe-down of the backdrop tap.
 */
export function Sheet({
  open,
  onOpenChange,
  title,
  description,
  children,
  className,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="fade-in fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm" />
        <RadixDialog.Content
          className={cn(
            "sheet-up fixed inset-x-0 bottom-0 z-[61] mx-auto max-h-[92dvh] max-w-lg overflow-y-auto rounded-t-[1.75rem] border-t border-[var(--border)] bg-[var(--surface-1)] px-4 pt-3 outline-none",
            className,
          )}
          style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 1.25rem)" }}
        >
          <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-[var(--muted)]" aria-hidden="true" />
          <div className="mb-4 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <RadixDialog.Title className="font-hand text-[1.9rem] leading-tight text-white">{title}</RadixDialog.Title>
              {description ? (
                <RadixDialog.Description className="mt-1 text-sm text-[var(--muted-text)]">{description}</RadixDialog.Description>
              ) : (
                <RadixDialog.Description className="sr-only">{title}</RadixDialog.Description>
              )}
            </div>
            <RadixDialog.Close
              aria-label="Chiudi"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--surface-2)] text-white"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </RadixDialog.Close>
          </div>
          {children}
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  )
}
