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

  // Compact pill — tap to expand
  if (!expanded) {
    return (
      <div className="px-3 slide-up stagger-1">
        <button
          onClick={() => setExpanded(true)}
          className="flex w-full items-center gap-3 rounded-2xl px-4 py-2.5 text-left"
          style={{
            background: "rgba(18,21,18,0.97)",
            border: "1px solid rgba(201,243,29,0.15)",
            backdropFilter: "blur(12px)",
            boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
          }}
        >
          <Image
            src="/sander-logo.png"
            alt="Sander"
            width={24}
            height={24}
            className="rounded-lg object-contain shrink-0"
            style={{ background: "rgba(201,243,29,0.1)" }}
          />
          <p className="flex-1 min-w-0 text-xs font-semibold text-white/80">
            Installa l&apos;app SANDER
          </p>
          <span className="shrink-0 rounded-lg px-2.5 py-1 text-[0.65rem] font-black text-black" style={{ background: "var(--accent)" }}>
            Installa
          </span>
          <button
            onClick={(e) => { e.stopPropagation(); dismiss() }}
            aria-label="Chiudi"
            className="shrink-0 text-[var(--muted-text)] hover:text-white transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </button>
      </div>
    )
  }

  // Expanded instructions (iOS) or install button (Android)
  return (
    <div className="px-3 slide-up stagger-1">
      <div
        className="rounded-2xl p-4"
        style={{
          background: "rgba(18,21,18,0.97)",
          border: "1px solid rgba(201,243,29,0.2)",
          backdropFilter: "blur(12px)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
        }}
      >
        <div className="flex items-center gap-3 mb-3">
          <Image
            src="/sander-logo.png"
            alt="Sander"
            width={36}
            height={36}
            className="rounded-xl object-contain"
            style={{ background: "rgba(201,243,29,0.1)" }}
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-black text-white">Installa SANDER</p>
            <p className="text-xs text-[var(--muted-text)]">Aggiungila alla schermata home</p>
          </div>
          <button onClick={dismiss} className="shrink-0 text-[var(--muted-text)] hover:text-white transition-colors" aria-label="Chiudi">
            <X className="h-4 w-4" />
          </button>
        </div>

        {isIos ? (
          <div className="space-y-2">
            <p className="text-xs text-[var(--muted-text)]">Per installare l&apos;app su iPhone:</p>
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg" style={{ background: "rgba(201,243,29,0.12)" }}>
                <span className="text-xs font-black text-[var(--accent)]">1</span>
              </div>
              <p className="text-xs text-white/80 flex items-center gap-1">
                Tocca <Share className="inline h-3.5 w-3.5 text-[var(--accent)]" /> in Safari
              </p>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg" style={{ background: "rgba(201,243,29,0.12)" }}>
                <span className="text-xs font-black text-[var(--accent)]">2</span>
              </div>
              <p className="text-xs text-white/80 flex items-center gap-1">
                Seleziona <strong className="text-white">&quot;Aggiungi a Home&quot;</strong> <Plus className="inline h-3.5 w-3.5 text-[var(--accent)]" />
              </p>
            </div>
            <button onClick={dismiss} className="mt-1 w-full rounded-xl py-2.5 text-sm font-semibold text-[var(--muted-text)] transition-colors" style={{ border: "1px solid rgba(255,255,255,0.1)" }}>
              Ho capito
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <button onClick={dismiss} className="flex-1 rounded-xl py-2.5 text-sm font-semibold text-[var(--muted-text)]" style={{ border: "1px solid rgba(255,255,255,0.1)" }}>
              Dopo
            </button>
            <button onClick={install} className="flex-1 rounded-xl py-2.5 text-sm font-black text-black active:opacity-80" style={{ background: "var(--accent)" }}>
              Installa
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
