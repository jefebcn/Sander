"use client"

import { useState, useEffect } from "react"
import { X } from "lucide-react"

const STORAGE_KEY = "cookie_consent"

export function CookieBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      // Small delay so it doesn't flash on initial render
      const t = setTimeout(() => setVisible(true), 800)
      return () => clearTimeout(t)
    }
  }, [])

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
    <div className="px-3 slide-up stagger-2">
      <div
        className="rounded-2xl px-4 py-3 flex items-start gap-3"
        style={{
          background: "rgba(18,21,18,0.97)",
          border: "1px solid rgba(255,255,255,0.1)",
          backdropFilter: "blur(12px)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
        }}
      >
        {/* Text */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white leading-snug mb-0.5">
            Usiamo i cookie 🍪
          </p>
          <p className="text-xs text-[var(--muted-text)] leading-relaxed">
            Utilizziamo cookie tecnici per il funzionamento del sito. Accettando ci aiuti a migliorare l&apos;esperienza.
          </p>
        </div>

        {/* Dismiss */}
        <button
          onClick={reject}
          className="shrink-0 mt-0.5 text-[var(--muted-text)] hover:text-white transition-colors"
          aria-label="Chiudi"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Buttons row */}
      <div className="mt-2 flex gap-2">
        <button
          onClick={reject}
          className="flex-1 rounded-xl py-2.5 text-sm font-semibold text-[var(--muted-text)] transition-colors"
          style={{ background: "rgba(18,21,18,0.97)", border: "1px solid rgba(255,255,255,0.1)" }}
        >
          Rifiuta
        </button>
        <button
          onClick={accept}
          className="flex-1 rounded-xl py-2.5 text-sm font-black text-black transition-opacity active:opacity-80"
          style={{ background: "var(--accent)" }}
        >
          Accetta
        </button>
      </div>
    </div>
  )
}
