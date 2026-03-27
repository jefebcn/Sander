"use client"

import { useState, useEffect } from "react"
import { X, Zap } from "lucide-react"

const STORAGE_KEY = "sander_level_celebrated"

const LEVEL_MESSAGES: Record<number, string> = {
  2:  "Sei ufficialmente in gioco. Continua così! 🏐",
  3:  "Stai crescendo come giocatore. Rispetto.",
  5:  "Cinque stelle. La tua presenza si sente in campo.",
  10: "Doppia cifra. Sei un pilastro della community.",
  20: "Leggenda. Pochi arrivano dove sei tu.",
}
function getMessage(level: number) {
  // Find closest milestone message
  const keys = Object.keys(LEVEL_MESSAGES).map(Number).sort((a, b) => a - b)
  for (let i = keys.length - 1; i >= 0; i--) {
    if (level >= keys[i]) return LEVEL_MESSAGES[keys[i]]
  }
  return "Continua a giocare per salire ancora! 🔥"
}

interface LevelUpCelebrationProps {
  currentLevel: number
  playerName: string
}

export function LevelUpCelebration({ currentLevel, playerName }: LevelUpCelebrationProps) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const celebrated = parseInt(localStorage.getItem(STORAGE_KEY) ?? "1", 10)
    if (currentLevel > celebrated) setShow(true)
  }, [currentLevel])

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, String(currentLevel))
    setShow(false)
  }

  if (!show) return null

  return (
    // Backdrop
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-5"
      style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(6px)" }}
      onClick={dismiss}
    >
      {/* Card */}
      <div
        className="celebrate relative w-full max-w-sm rounded-3xl p-8 text-center"
        style={{
          background: "linear-gradient(145deg, #1a3a0f 0%, #0d1a0d 100%)",
          border: "2px solid var(--accent)",
          boxShadow: "0 0 60px rgba(201,243,29,0.25)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={dismiss}
          className="absolute right-4 top-4 text-[var(--muted-text)]"
          aria-label="Chiudi"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Icon */}
        <div
          className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl"
          style={{ background: "var(--accent)" }}
        >
          <Zap className="h-8 w-8 text-black" />
        </div>

        <p className="text-sm font-bold uppercase tracking-widest text-[var(--accent)] mb-1">
          Sei salito di livello!
        </p>

        <p className="text-6xl font-black text-white leading-tight mb-1">
          {currentLevel}
        </p>

        <p className="text-sm text-[var(--muted-text)] mb-1">
          {playerName.split(" ")[0]}, ora sei Livello {currentLevel}
        </p>

        <p className="text-sm text-white/70 leading-relaxed mb-6">
          {getMessage(currentLevel)}
        </p>

        {/* XP info */}
        <div
          className="rounded-xl px-4 py-3 mb-6 text-xs text-[var(--muted-text)]"
          style={{ background: "rgba(201,243,29,0.08)" }}
        >
          Ogni <strong className="text-[var(--accent)]">100 XP</strong> = +1 Livello.
          Gioca, vinci e ricevi Super Vote per salire.
        </div>

        <button
          onClick={dismiss}
          className="w-full rounded-2xl py-3.5 text-base font-black text-black"
          style={{ background: "var(--accent)" }}
        >
          Continua a giocare 🏐
        </button>
      </div>
    </div>
  )
}
