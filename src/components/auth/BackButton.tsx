"use client"

import { useRouter } from "next/navigation"
import { ChevronLeft } from "lucide-react"
import { canGoBackInApp } from "@/lib/navHistory"

/**
 * Goes back when there is an in-app page to go back to. Opened directly (a
 * shared link, a new tab, a push) router.back() would leave the app or land
 * on about:blank, so it goes to `fallback` instead.
 */
export function BackButton({ fallback = "/" }: { fallback?: string }) {
  const router = useRouter()
  return (
    <button
      type="button"
      onClick={() => (canGoBackInApp() ? router.back() : router.push(fallback))}
      aria-label="Indietro"
      className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--surface-2)] text-[var(--muted-text)] transition-colors active:bg-[var(--surface-3)]"
    >
      <ChevronLeft className="h-5 w-5" aria-hidden="true" />
    </button>
  )
}
