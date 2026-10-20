"use client"

import { useTransition } from "react"
import { Check } from "lucide-react"
import { adminDismissError } from "@/actions/adminSystem"

export function DismissErrorButton({ id }: { id: string }) {
  const [pending, start] = useTransition()
  return (
    <button
      onClick={() => start(() => adminDismissError(id))}
      disabled={pending}
      aria-label="Segna come risolto"
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--surface-3)] text-white disabled:opacity-50"
    >
      <Check className="h-5 w-5" aria-hidden="true" />
    </button>
  )
}
