"use client"

import { useState, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Sun, Volleyball, Star, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface OnboardingCarouselProps {
  onComplete: () => void
}

const SCREENS = [
  {
    id: 0,
    bg: "from-[#0a0a0a] via-[#111008] to-[#0a0a0a]",
    glow: "radial-gradient(ellipse 60% 40% at 50% 60%, rgba(255,214,0,0.12) 0%, transparent 70%)",
    Icon: Sun,
    eyebrow: null,
    title: "Scendi\nin campo.",
    subtitle: "Beach Volleyball.\nOgni giorno.",
    cta: "Inizia",
    secondary: null,
  },
  {
    id: 1,
    bg: "from-[#0a0a0a] via-[#080c0f] to-[#0a0a0a]",
    glow: "radial-gradient(ellipse 60% 40% at 50% 40%, rgba(0,180,240,0.10) 0%, transparent 70%)",
    Icon: Volleyball,
    eyebrow: "Partite",
    title: "Trovale.\nUnisciti.",
    subtitle: "Scopri le partite di SANDER\nnella tua zona e gioca subito.",
    cta: "Avanti",
    secondary: null,
  },
  {
    id: 2,
    bg: "from-[#0a0a0a] via-[#0c0a10] to-[#0a0a0a]",
    glow: "radial-gradient(ellipse 60% 40% at 50% 40%, rgba(168,85,247,0.10) 0%, transparent 70%)",
    Icon: Star,
    eyebrow: "SanderCard",
    title: "Sali\ndi livello.",
    subtitle: "Traccia XP, costruisci il tuo\nSanderCard e sfida i migliori.",
    cta: "Registrati o Accedi",
    secondary: "Salta per ora",
  },
]

// Volleyball net SVG pattern for visual interest
function NetPattern({ opacity = 0.04 }: { opacity?: number }) {
  return (
    <svg
      className="absolute inset-0 h-full w-full"
      xmlns="http://www.w3.org/2000/svg"
      style={{ opacity }}
      aria-hidden="true"
    >
      <defs>
        <pattern id="net" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#net)" />
    </svg>
  )
}

export function OnboardingCarousel({ onComplete }: OnboardingCarouselProps) {
  const router = useRouter()
  const [current, setCurrent] = useState(0)
  const [animating, setAnimating] = useState(false)
  const [direction, setDirection] = useState<"left" | "right">("left")

  const touchStartX = useRef<number | null>(null)
  const touchStartY = useRef<number | null>(null)

  const goTo = useCallback(
    (next: number, dir: "left" | "right" = "left") => {
      if (animating) return
      setDirection(dir)
      setAnimating(true)
      setTimeout(() => {
        setCurrent(next)
        setAnimating(false)
      }, 300)
    },
    [animating],
  )

  function handleCta() {
    if (current < SCREENS.length - 1) {
      goTo(current + 1, "left")
      return
    }
    // Last screen — go to auth
    onComplete()
    router.push("/auth/signin?callbackUrl=/sessions")
  }

  function handleSkip() {
    onComplete()
    router.push("/sessions")
  }

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null || touchStartY.current === null) return
    const dx = e.changedTouches[0].clientX - touchStartX.current
    const dy = e.changedTouches[0].clientY - touchStartY.current
    if (Math.abs(dx) < Math.abs(dy) || Math.abs(dx) < 40) return // vertical or too small
    if (dx < 0 && current < SCREENS.length - 1) {
      goTo(current + 1, "left")
    } else if (dx > 0 && current > 0) {
      goTo(current - 1, "right")
    }
    touchStartX.current = null
    touchStartY.current = null
  }

  const screen = SCREENS[current]

  return (
    <div
      className="fixed inset-0 z-[200] overflow-hidden bg-[#0a0a0a]"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      role="region"
      aria-label="Benvenuto in SANDER"
    >
      {/* Background */}
      <div
        className={cn("absolute inset-0 bg-gradient-to-b transition-all duration-500", screen.bg)}
      />
      <div
        className="absolute inset-0 transition-all duration-500"
        style={{ background: screen.glow }}
      />
      <NetPattern opacity={0.03} />

      {/* Skip button — top right */}
      {current < SCREENS.length - 1 && (
        <button
          onClick={handleSkip}
          className="absolute right-5 top-safe-top z-10 mt-12 text-sm font-medium text-[var(--muted-text)] transition-colors active:text-[var(--foreground)]"
          style={{ top: "calc(env(safe-area-inset-top, 0px) + 3rem)" }}
        >
          Salta
        </button>
      )}

      {/* Content — slides in from direction */}
      <div
        className={cn(
          "absolute inset-0 flex flex-col items-center justify-between px-8 pb-16 pt-24 transition-all duration-300",
          animating && direction === "left" && "-translate-x-8 opacity-0",
          animating && direction === "right" && "translate-x-8 opacity-0",
        )}
      >
        {/* Top section: icon + text */}
        <div className="flex flex-1 flex-col items-center justify-center gap-8 text-center">
          {/* Icon ring */}
          <div className="relative">
            <div
              className="flex h-24 w-24 items-center justify-center rounded-3xl"
              style={{
                background:
                  "linear-gradient(135deg, rgba(255,214,0,0.15) 0%, rgba(255,214,0,0.05) 100%)",
                border: "1px solid rgba(255,214,0,0.2)",
              }}
            >
              <screen.Icon className="h-12 w-12 text-[var(--accent)]" aria-hidden="true" />
            </div>
            {/* Glow ring */}
            <div
              className="pointer-events-none absolute inset-0 rounded-3xl"
              style={{ boxShadow: "0 0 40px 8px rgba(255,214,0,0.08)" }}
            />
          </div>

          {/* Eyebrow */}
          {screen.eyebrow && (
            <span className="rounded-full bg-[var(--accent)]/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-[var(--accent)]">
              {screen.eyebrow}
            </span>
          )}

          {/* Title */}
          <h1
            className="text-[3.25rem] font-black leading-[1.05] tracking-tight text-[var(--foreground)]"
            style={{ whiteSpace: "pre-line" }}
          >
            {screen.title}
          </h1>

          {/* Subtitle */}
          <p
            className="text-base leading-relaxed text-[var(--muted-text)]"
            style={{ whiteSpace: "pre-line" }}
          >
            {screen.subtitle}
          </p>
        </div>

        {/* Bottom section: dots + buttons */}
        <div className="w-full max-w-sm space-y-4">
          {/* Dot navigation */}
          <div className="flex items-center justify-center gap-2" aria-label="Pagina corrente">
            {SCREENS.map((s) => (
              <button
                key={s.id}
                onClick={() => goTo(s.id, s.id > current ? "left" : "right")}
                aria-label={`Schermata ${s.id + 1}`}
                aria-current={s.id === current}
                className={cn(
                  "h-2 rounded-full transition-all duration-300",
                  s.id === current
                    ? "w-6 bg-[var(--accent)]"
                    : "w-2 bg-[var(--muted)]",
                )}
              />
            ))}
          </div>

          {/* Primary CTA */}
          <button
            onClick={handleCta}
            className="flex min-h-[3.5rem] w-full items-center justify-center gap-2 rounded-2xl bg-[var(--accent)] font-bold text-black transition-all active:scale-[0.97]"
          >
            <span>{screen.cta}</span>
            <ChevronRight className="h-5 w-5" aria-hidden="true" />
          </button>

          {/* Secondary link */}
          {screen.secondary && (
            <button
              onClick={handleSkip}
              className="flex min-h-[3rem] w-full items-center justify-center text-sm font-medium text-[var(--muted-text)] transition-colors active:text-[var(--foreground)]"
            >
              {screen.secondary}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
