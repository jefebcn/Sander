"use client"

import { Link2 } from "lucide-react"
import { toast } from "sonner"

/** Copies a sanderbv.it link (e.g. for the Instagram bio). */
export function CopyLinkButton({ path, label }: { path: string; label: string }) {
  return (
    <button
      type="button"
      onClick={() => {
        const url = `${window.location.origin}${path}`
        navigator.clipboard?.writeText(url).then(() => toast.success("Link copiato"), () => toast.error(url))
      }}
      className="btn btn-secondary w-full gap-2"
    >
      <Link2 className="h-5 w-5" aria-hidden="true" /> {label}
    </button>
  )
}
