"use client"

import { useState, useEffect, useCallback } from "react"
import Image from "next/image"
import { X, Share, Plus } from "lucide-react"
import { usePathname } from "next/navigation"

const STORAGE_KEY = "pwa_install_dismissed"

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

function isIOS() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent)
}

function isInStandaloneMode() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in navigator && (navigator as { standalone?: boolean }).standalone === true)
  )
}

export function PWAInstallBanner() {
  const [show, setShow] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [isIos, setIsIos] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const pathname = usePathname()

  useEffect(() => {
    // Never show on auth pages
    if (pathname.startsWith("/auth/") || pathname === "/auth") return
    if (isInStandaloneMode()) return
    if (localStorage.getItem(STORAGE_KEY)) return

    const ios = isIOS()
    setIsIos(ios)

    if (ios) {
      const t = setTimeout(() => setShow(true), 1500)
      return () => clearTimeout(t)
    }

    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      const t = setTimeout(() => setShow(true), 1500)
      return () => clearTimeout(t)
    }
    window.addEventListener("beforeinstallprompt", handler)
    return () => window.removeEventListener("beforeinstallprompt", handler)
  }, [pathname])

  const dismiss = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, "1")
    setShow(false)
    setExpanded(false)
  }, [])

  const install = useCallback(async () => {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === "accepted") localStorage.setItem(STORAGE_KEY, "1")
    setShow(false)
    setExpanded(false)
  }, [deferredPrompt])

  if (!show) return null

  // Compact pill — tap to expand. Two sibling buttons (a button inside a
  // button is invalid HTML and the 14px close icon was impossible to hit).
  if (!expanded) {
    return (
      <div className="px-3 slide-up stagger-1">
        <div
          className="flex w-full items-center gap-1 rounded-2xl pl-4 pr-1"
          style={{
            background: "color-mix(in srgb, var(--surface-2) 97%, transparent)",
            border: "1px solid var(--accent-line)",
            backdropFilter: "blur(12px)",
            boxShadow: "var(--shadow-card)",
          }}
        >
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="flex min-h-[2.75rem] min-w-0 flex-1 items-center gap-3 text-left"
          >
            <Image
              src="/sander-logo-coral.png"
              alt=""
              width={24}
              height={24}
              className="rounded-lg object-contain shrink-0"
              style={{ background: "var(--accent-soft)" }}
            />
            <span className="flex-1 min-w-0 text-sm font-semibold text-white/80">
              Installa l&apos;app SANDER
            </span>
            <span className="shrink-0 rounded-lg px-2.5 py-1 text-xs font-black text-black" style={{ background: "var(--accent)" }}>
              Installa
            </span>
          </button>
          <button
            type="button"
            onClick={dismiss}
            aria-label="Chiudi"
            className="flex h-11 w-11 shrink-0 items-center justify-center text-[var(--muted-text)] hover:text-white transition-colors"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    )
  }

  // Expanded instructions (iOS) or install button (Android)
  return (
    <div className="px-3 slide-up stagger-1">
      <div
        className="rounded-2xl p-4"
        style={{
          background: "color-mix(in srgb, var(--surface-2) 97%, transparent)",
          border: "1px solid var(--accent-line)",
          backdropFilter: "blur(12px)",
          boxShadow: "var(--shadow-card)",
        }}
      >
        <div className="flex items-center gap-3 mb-3">
          <Image
            src="/sander-logo-coral.png"
            alt="Sander"
            width={36}
            height={36}
            className="rounded-xl object-contain"
            style={{ background: "var(--accent-soft)" }}
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-black text-white">Installa SANDER</p>
            <p className="text-xs text-[var(--muted-text)]">Aggiungila alla schermata home</p>
          </div>
          <button onClick={dismiss} className="-mr-2 flex h-11 w-11 shrink-0 items-center justify-center text-[var(--muted-text)] hover:text-white transition-colors" aria-label="Chiudi">
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        {isIos ? (
          <div className="space-y-2">
            <p className="text-xs text-[var(--muted-text)]">Per installare l&apos;app su iPhone:</p>
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg" style={{ background: "var(--accent-soft)" }}>
                <span className="text-xs font-black text-[var(--accent)]">1</span>
              </div>
              <p className="text-xs text-white/80 flex items-center gap-1">
                Tocca <Share className="inline h-3.5 w-3.5 text-[var(--accent)]" /> in Safari
              </p>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg" style={{ background: "var(--accent-soft)" }}>
                <span className="text-xs font-black text-[var(--accent)]">2</span>
              </div>
              <p className="text-xs text-white/80 flex items-center gap-1">
                Seleziona <strong className="text-white">&quot;Aggiungi a Home&quot;</strong> <Plus className="inline h-3.5 w-3.5 text-[var(--accent)]" />
              </p>
            </div>
            <button onClick={dismiss} className="mt-1 min-h-[2.75rem] w-full rounded-xl py-2.5 text-sm font-semibold text-[var(--muted-text)] transition-colors" style={{ border: "1px solid var(--border)" }}>
              Ho capito
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <button onClick={dismiss} className="min-h-[2.75rem] flex-1 rounded-xl py-2.5 text-sm font-semibold text-[var(--muted-text)]" style={{ border: "1px solid var(--border)" }}>
              Dopo
            </button>
            <button onClick={install} className="min-h-[2.75rem] flex-1 rounded-xl py-2.5 text-sm font-black text-black active:opacity-80" style={{ background: "var(--accent)" }}>
              Installa
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
