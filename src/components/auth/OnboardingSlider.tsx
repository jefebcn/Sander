"use client"

import { useState, useRef } from "react"
import Image from "next/image"
import { Trophy, TrendingUp, Users, ChevronRight } from "lucide-react"
import { AuthForm } from "@/components/auth/AuthForm"
import { cn } from "@/lib/utils"

interface OnboardingSliderProps {
  callbackUrl: string
}

const SLIDES = [
  {
    icon: Trophy,
    accent: true,
    title: "Torna in campo",
    subtitle:
      "Partite, tornei e match storici — tutta la tua vita sportiva in un'unica app.",
  },
  {
    icon: TrendingUp,
    accent: false,
    title: "Scala il ranking",
    subtitle:
      "Il tuo rating cresce partita dopo partita. Affronta i migliori e diventa il re della spiaggia.",
  },
  {
    icon: Users,
    accent: false,
    title: "La tua community",
    subtitle:
      "Organizza tornei, trova avversari e connettiti con la community del beach volley.",
  },
]

export function OnboardingSlider({ callbackUrl }: OnboardingSliderProps) {
  const [current, setCurrent] = useState(0)
  const [showAuth, setShowAuth] = useState(false)
  const touchStart = useRef<number | null>(null)

  const isLast = current === SLIDES.length - 1

  function next() {
    if (isLast) {
      setShowAuth(true)
    } else {
      setCurrent((c) => c + 1)
    }
  }

  function handleTouchStart(e: React.TouchEvent) {
    touchStart.current = e.touches[0].clientX
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStart.current === null) return
    const delta = touchStart.current - e.changedTouches[0].clientX
    touchStart.current = null
    if (delta > 50 && !isLast) setCurrent((c) => c + 1)
    if (delta < -50 && current > 0) setCurrent((c) => c - 1)
  }

  if (showAuth) {
    return (
      <div className="flex flex-col gap-6 px-2 py-8">
        {/* Logo */}
        <div className="flex flex-col items-center gap-3 mb-2">
          <Image
            src="/sander-logo.png"
            alt="SANDER"
            width={72}
            height={72}
            className="object-contain"
          />
          <div className="text-center">
            <h1 className="text-2xl font-black text-white">Entra nel campo.</h1>
            <p className="text-sm text-[var(--muted-text)] mt-0.5">
              Accedi o crea un account per continuare
            </p>
          </div>
        </div>

        <AuthForm callbackUrl={callbackUrl} />

        <p className="text-center text-xs text-[var(--muted-text)]">
          Accedendo accetti i nostri{" "}
          <a href="/terms" className="underline">Termini di Servizio</a>
        </p>
      </div>
    )
  }

  const Slide = SLIDES[current]
  const Icon = Slide.icon

  return (
    <div
      className="flex flex-col items-center gap-0 select-none"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Slide area */}
      <div className="flex flex-col items-center gap-6 px-4 py-14 text-center">
        {/* Icon */}
        <div
          className="flex h-24 w-24 items-center justify-center rounded-3xl"
          style={{
            background: current === 0
              ? "var(--accent)"
              : "var(--surface-2)",
          }}
        >
          <Icon
            className="h-12 w-12"
            style={{ color: current === 0 ? "#000" : "var(--accent)" }}
          />
        </div>

        {/* Text */}
        <div className="space-y-3 max-w-xs">
          <h2 className="text-3xl font-black text-white leading-tight">
            {Slide.title}
          </h2>
          <p className="text-base text-[var(--muted-text)] leading-relaxed">
            {Slide.subtitle}
          </p>
        </div>
      </div>

      {/* Dots */}
      <div className="flex items-center gap-2 mb-8">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={cn(
              "rounded-full transition-all",
              i === current
                ? "w-6 h-2 bg-[var(--accent)]"
                : "w-2 h-2 bg-[var(--surface-2)]",
            )}
            aria-label={`Slide ${i + 1}`}
          />
        ))}
      </div>

      {/* CTA */}
      <div className="w-full px-2 space-y-3">
        <button
          onClick={next}
          className="flex min-h-[4rem] w-full items-center justify-center gap-2 rounded-2xl bg-[var(--accent)] text-xl font-black text-black transition-all active:scale-[0.98]"
        >
          {isLast ? "Inizia" : "Avanti"}
          <ChevronRight className="h-6 w-6" />
        </button>

        {!isLast && (
          <button
            onClick={() => setShowAuth(true)}
            className="w-full py-3 text-sm text-[var(--muted-text)] font-medium"
          >
            Ho già un account — Accedi
          </button>
        )}
      </div>
    </div>
  )
}
