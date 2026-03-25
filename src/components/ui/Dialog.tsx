"use client"

import * as RadixDialog from "@radix-ui/react-dialog"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

export const Dialog = RadixDialog.Root
export const DialogTrigger = RadixDialog.Trigger
export const DialogClose = RadixDialog.Close

export function DialogContent({
  children,
  className,
  title,
  description,
}: {
  children: React.ReactNode
  className?: string
  title?: string
  description?: string
}) {
  return (
    <RadixDialog.Portal>
      <RadixDialog.Overlay className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
      <RadixDialog.Content
        className={cn(
          "fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-3xl bg-[var(--surface-1)] p-6 shadow-2xl border border-[var(--border)]",
          "data-[state=open]:animate-in data-[state=closed]:animate-out",
          "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
          "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
          "data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%]",
          "data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]",
          className,
        )}
      >
        {(title || description) && (
          <div className="mb-5">
            {title && (
              <RadixDialog.Title className="text-xl font-black text-[var(--foreground)]">
                {title}
              </RadixDialog.Title>
            )}
            {description && (
              <RadixDialog.Description className="mt-1.5 text-sm text-[var(--muted-text)]">
                {description}
              </RadixDialog.Description>
            )}
          </div>
        )}
        {children}
        <RadixDialog.Close className="absolute right-4 top-4 rounded-lg p-1.5 text-[var(--muted-text)] hover:bg-[var(--surface-3)] hover:text-[var(--foreground)] transition-colors">
          <X className="h-4 w-4" />
          <span className="sr-only">Chiudi</span>
        </RadixDialog.Close>
      </RadixDialog.Content>
    </RadixDialog.Portal>
  )
}
