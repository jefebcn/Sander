"use client"

import { useState, useEffect } from "react"
import { X } from "lucide-react"
import { usePathname } from "next/navigation"

const STORAGE_KEY = "cookie_consent"

export function CookieBanner() {
  const [visible, setVisible] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    // Never on sign-up/sign-in or the profile step: it sat on top of their
    // main button ("Conferma") at the exact moment people are signing up.
    if (pathname.startsWith("/auth") || pathname.startsWith("/onboarding")) {
      setVisible(false)
      return
    }
    if (!localStorage.getItem(STORAGE_KEY)) {
      const t = setTimeout(() => setVisible(true), 800)
      return () => clearTimeout(t)
    }
  }, [pathname])

  function accept() {
    localStorage.setItem(STORAGE_KEY, "accepted")
    setVisible(false)
  }

  function reject() {
    localStorage.setItem(STORAGE_KEY, "rejected")
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="px-3 slide-up">
      <div
        className="flex items-center gap-3 rounded-2xl px-4 py-2.5"
        style={{
          background: "color-mix(in srgb, var(--surface-2) 96%, transparent)",
          border: "1px solid var(--border)",
          backdropFilter: "blur(12px)",
          boxShadow: "var(--shadow-card)",
        }}
      >
        <span className="text-base leading-none" aria-hidden="true">🍪</span>
        <p className="flex-1 min-w-0 text-xs text-[var(--muted-text)] leading-snug">
          Utilizziamo cookie tecnici per il funzionamento del sito.
        </p>
        <button
          onClick={accept}
          className="min-h-[2.75rem] shrink-0 rounded-xl px-4 text-sm font-black text-black transition-opacity active:opacity-80"
          style={{ background: "var(--accent)" }}
        >
          OK
        </button>
        <button
          onClick={reject}
          aria-label="Rifiuta"
          className="flex h-11 w-11 shrink-0 items-center justify-center text-[var(--muted-text)] hover:text-white transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
