"use client"

import { Copy } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

/** Copies a piece of text (a verification code) with one tap. */
export function CopyTextButton({ text, label = "Copia", className }: { text: string; label?: string; className?: string }) {
  return (
    <button
      type="button"
      onClick={() => navigator.clipboard?.writeText(text).then(() => toast.success("Copiato"), () => toast.error(text))}
      className={cn("btn btn-secondary gap-2", className)}
    >
      <Copy className="h-5 w-5" aria-hidden="true" /> {label}
    </button>
  )
}
