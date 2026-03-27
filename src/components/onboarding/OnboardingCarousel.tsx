"use client"

import { useState, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

interface OnboardingCarouselProps {
  onComplete: () => void
}

const SCREENS = [
  { id: 0, slogan: "Scendi in campo.", cta: "Avanti" },
  { id: 1, slogan: "Trova la partita.", cta: "Avanti" },
  { id: 2, slogan: "Sali di livello.", cta: "Accedi o Registrati" },
]

export function OnboardingCarousel({ onComplete }: OnboardingCarouselProps) {
  const router = useRouter()
  const [current, setCurrent] = useState(0)
  const [leaving, setLeaving] = useState(false)

  const touchStartX = useRef<number | null>(null)
  const touchStartY = useRef<number | null>(null)

  const advance = useCallback(
    (next: number) => {
      if (leaving) return
      setLeaving(true)
      setTimeout(() => {
        setCurrent(next)
        setLeaving(false)
      }, 220)
    },
    [leaving],
  )

  function handleCta() {
    if (current < SCREENS.length - 1) {
      advance(current + 1)
      return
    }
    router.push("/auth/signin")
  }

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null || touchStartY.current === null) return
    const dx = e.changedTouches[0].clientX - touchStartX.current
    const dy = Math.abs(e.changedTouches[0].clientY - (touchStartY.current ?? 0))
    touchStartX.current = null
    touchStartY.current = null
    if (dy > Math.abs(dx) || Math.abs(dx) < 40) return
    if (dx < 0 && current < SCREENS.length - 1) advance(current + 1)
  }

  const screen = SCREENS[current]

  return (
    <div
      className="fixed inset-0 z-[200] flex flex-col overflow-hidden bg-black"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      role="region"
      aria-label="Benvenuto in SANDER"
    >
      {/* ── Video background ─────────────────────────────────── */}
      <div className="absolute inset-0">
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 h-full w-full object-cover"
          style={{ filter: "grayscale(100%) brightness(0.65)" }}
          aria-hidden="true"
        >
          <source src="/beach-volley.mp4" type="video/mp4" />
          {/* Fallback gradient when video not yet provided */}
        </video>
        {/* Gradient: darker at top & bottom, lighter in middle */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.15) 35%, rgba(0,0,0,0.15) 55%, rgba(0,0,0,0.72) 82%, rgba(0,0,0,0.92) 100%)",
          }}
          aria-hidden="true"
        />
      </div>

      {/* ── Dot navigation — top ─────────────────────────────── */}
      <div
        className="relative z-10 flex items-center justify-center gap-[7px]"
        style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 3.5rem)" }}
        aria-label="Passaggio corrente"
      >
        {SCREENS.map((s) => (
          <div
            key={s.id}
            className={cn(
              "h-[5px] rounded-full transition-all duration-300",
              s.id === current ? "w-8 bg-[#c9f31d]" : "w-3.5 bg-white/35",
            )}
          />
        ))}
      </div>

      {/* ── Logo + slogan — centre ────────────────────────────── */}
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center gap-10 px-8">
        {/* Logo — swap /sander-logo.png for the provided file */}
        <div
          className={cn(
            "transition-all duration-200",
            leaving ? "opacity-0 scale-95" : "opacity-100 scale-100",
          )}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/sander-logo.png"
            alt="SANDER"
            width={260}
            height={260}
            className="object-contain drop-shadow-[0_0_40px_rgba(201,243,29,0.15)]"
            draggable={false}
          />
        </div>

        {/* Slogan */}
        <p
          className={cn(
            "w-full text-left text-[2.6rem] font-black leading-[1.1] text-white transition-all duration-200",
            leaving ? "opacity-0 translate-x-4" : "opacity-100 translate-x-0",
          )}
          style={{ textShadow: "0 2px 24px rgba(0,0,0,0.6)" }}
        >
          {screen.slogan}
        </p>
      </div>

      {/* ── CTA — flat full-width bar at bottom ──────────────── */}
      <button
        onClick={handleCta}
        className={cn(
          "relative z-10 flex w-full flex-shrink-0 items-center justify-center font-black text-black text-lg transition-opacity active:opacity-80",
          leaving ? "opacity-70" : "opacity-100",
        )}
        style={{
          backgroundColor: "#c9f31d",
          minHeight: "4rem",
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
          borderRadius: 0,
        }}
      >
        {screen.cta}
      </button>
    </div>
  )
}
