"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { Download, Share, Plus, ArrowRight } from "lucide-react"

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

function isIOS() {
  return typeof navigator !== "undefined" && /iphone|ipad|ipod/i.test(navigator.userAgent)
}

function isStandalone() {
  if (typeof window === "undefined") return false
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in navigator && (navigator as { standalone?: boolean }).standalone === true)
  )
}

export function InstallButton() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)
  const [ios, setIos] = useState(false)
  const [standalone, setStandalone] = useState(false)
  const [showIosHelp, setShowIosHelp] = useState(false)

  useEffect(() => {
    setIos(isIOS())
    setStandalone(isStandalone())
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferred(e as BeforeInstallPromptEvent)
    }
    window.addEventListener("beforeinstallprompt", handler)
    return () => window.removeEventListener("beforeinstallprompt", handler)
  }, [])

  const install = useCallback(async () => {
    if (!deferred) return
    await deferred.prompt()
    await deferred.userChoice
    setDeferred(null)
  }, [deferred])

  // Already installed → just open
  if (standalone) {
    return (
      <Link
        href="/"
        className="flex min-h-[3.5rem] w-full items-center justify-center gap-2 rounded-2xl font-black text-black"
        style={{ background: "var(--accent)" }}
      >
        Apri SANDER <ArrowRight className="h-5 w-5" />
      </Link>
    )
  }

  return (
    <div className="space-y-3">
      {/* Native install (Android/desktop Chrome) */}
      {deferred && (
        <button
          onClick={install}
          className="flex min-h-[3.5rem] w-full items-center justify-center gap-2 rounded-2xl font-black text-black"
          style={{ background: "var(--accent)" }}
        >
          <Download className="h-5 w-5" /> Installa l&apos;app
        </button>
      )}

      {/* iOS: instructions */}
      {ios && (
        <button
          onClick={() => setShowIosHelp((v) => !v)}
          className="flex min-h-[3.5rem] w-full items-center justify-center gap-2 rounded-2xl font-black text-black"
          style={{ background: "var(--accent)" }}
        >
          <Plus className="h-5 w-5" /> Aggiungi alla Home
        </button>
      )}

      {ios && showIosHelp && (
        <div className="rounded-2xl bg-[var(--surface-2)] p-4 text-sm text-white/80 leading-relaxed">
          <p className="flex items-center gap-2">
            1. Tocca <Share className="inline h-4 w-4 text-[var(--accent)]" /> Condividi in Safari
          </p>
          <p className="mt-1.5 flex items-center gap-2">
            2. Scegli <Plus className="inline h-4 w-4 text-[var(--accent)]" /> «Aggiungi alla schermata Home»
          </p>
          <p className="mt-1.5">3. Apri SANDER dall&apos;icona come una vera app.</p>
        </div>
      )}

      {/* Fallback: open in browser */}
      <Link
        href="/"
        className="flex min-h-[3.5rem] w-full items-center justify-center gap-2 rounded-2xl font-bold text-white"
        style={{ background: "var(--surface-2)" }}
      >
        Continua nel browser <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  )
}
