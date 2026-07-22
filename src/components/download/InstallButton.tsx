"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { Download, Share, Plus, ArrowRight } from "lucide-react"
import { trackEvent } from "@/lib/analytics"

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
    trackEvent("install_click", { platform: "android" })
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

      {/* iOS: no native prompt exists — show the "Add to Home" steps, always
          visible and clear that they only work in Safari (the #1 gotcha). */}
      {ios && (
        <div
          className="rounded-2xl p-4"
          style={{ background: "var(--surface-2)", border: "1px solid rgba(201,243,29,0.3)" }}
        >
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
              style={{ background: "rgba(201,243,29,0.14)" }}
            >
              <Plus className="h-5 w-5 text-[var(--accent)]" />
            </div>
            <p className="text-base font-black text-white">Installa su iPhone</p>
          </div>

          <p className="mt-3 text-sm leading-relaxed text-white/80">
            Apri questa pagina in{" "}
            <span className="font-bold text-[var(--accent)]">Safari</span> (non da Chrome o
            Instagram), poi:
          </p>

          <ol className="mt-3 space-y-2.5">
            {[
              <>Tocca <Share className="inline h-4 w-4 text-[var(--accent)]" /> Condividi, in basso</>,
              <>Scegli <Plus className="inline h-4 w-4 text-[var(--accent)]" /> «Aggiungi alla schermata Home»</>,
              <>Apri SANDER dall&apos;icona, come una vera app</>,
            ].map((step, i) => (
              <li key={i} className="flex items-start gap-3 text-sm leading-relaxed text-white/85">
                <span
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-black text-black"
                  style={{ background: "var(--accent)" }}
                >
                  {i + 1}
                </span>
                <span className="pt-0.5">{step}</span>
              </li>
            ))}
          </ol>
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
