"use client"

import { useRouter } from "next/navigation"
import { ChevronLeft } from "lucide-react"

export function BackButton() {
  const router = useRouter()
  return (
    <button
      type="button"
      onClick={() => router.back()}
      aria-label="Indietro"
      className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--surface-2)] text-[var(--muted-text)] transition-colors active:bg-[var(--surface-3)]"
    >
      <ChevronLeft className="h-5 w-5" aria-hidden="true" />
    </button>
  )
}
