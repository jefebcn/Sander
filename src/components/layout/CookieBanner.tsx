"use client"

import { useState, useEffect } from "react"
import { X } from "lucide-react"
import { usePathname } from "next/navigation"

const STORAGE_KEY = "cookie_consent"

export function CookieBanner() {
  const [visible, setVisible] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    // Never show on auth pages
    if (pathname.startsWith("/auth/") || pathname === "/auth") return
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
          background: "rgba(18,21,18,0.97)",
          border: "1px solid rgba(255,255,255,0.08)",
          backdropFilter: "blur(12px)",
          boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
        }}
      >
        <span className="text-base leading-none" aria-hidden="true">🍪</span>
        <p className="flex-1 min-w-0 text-xs text-[var(--muted-text)] leading-snug">
          Utilizziamo cookie tecnici per il funzionamento del sito.
        </p>
        <button
          onClick={accept}
          className="shrink-0 rounded-lg px-3 py-1.5 text-xs font-black text-black transition-opacity active:opacity-80"
          style={{ background: "var(--accent)" }}
        >
          OK
        </button>
        <button
          onClick={reject}
          aria-label="Rifiuta"
          className="shrink-0 text-[var(--muted-text)] hover:text-white transition-colors"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}
