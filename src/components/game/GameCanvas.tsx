"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Pause, Play, RotateCcw, Home, Zap } from "lucide-react"
import {
  createGameState,
  step,
  predictLandingX,
  STEP,
  FIELD_W,
  FIELD_H,
  GROUND_Y,
  NET_X,
  NET_TOP,
  NET_HALF_W,
  BALL_R,
  PLAYER_BODY,
  type GameState,
  type GameEvent,
  type Inputs,
} from "@/lib/game/engine"
import {
  statsToParams,
  cpuStatsForDifficulty,
  type GameStats,
} from "@/lib/game/stats"
import { cpuInput, createAiMemory, type AiMemory } from "@/lib/game/ai"
import { Controls } from "./Controls"

/* ────────────────────────────────────────────────────────────────────────── */
/*  SANDER Arcade — canvas, fixed-timestep loop, input, juice, HUD.            */
/* ────────────────────────────────────────────────────────────────────────── */

export interface ArcadePlayer {
  name: string
  avatarUrl: string | null
  stats: GameStats
}

type Screen = "menu" | "play" | "pause" | "over"

const DIFF_LABELS = ["Facile", "Media", "Difficile", "Pro", "Leggenda"]
const ME_COLOR = "#c9f31d"
const CPU_COLOR = "#3b82f6"

const STAT_ROWS: { key: keyof GameStats; label: string }[] = [
  { key: "velocita", label: "Velocità" },
  { key: "potenza", label: "Potenza" },
  { key: "salto", label: "Salto" },
  { key: "difesa", label: "Difesa" },
  { key: "controllo", label: "Controllo" },
]

export function GameCanvas({ player }: { player: ArcadePlayer }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Game refs (no re-renders on the hot path)
  const stateRef = useRef<GameState | null>(null)
  const inputRef = useRef<Inputs>({ left: false, right: false, jump: false, spike: false })
  const aiMemRef = useRef<AiMemory>(createAiMemory())
  const matchDiffRef = useRef(2)
  const rafRef = useRef(0)
  const lastTsRef = useRef(0)
  const accRef = useRef(0)
  const trailRef = useRef<{ x: number; y: number }[]>([])
  const shakeRef = useRef(0)
  const flashRef = useRef(0)
  const lastScorerRef = useRef<0 | 1>(0)
  const avatarImgRef = useRef<HTMLImageElement | null>(null)
  const screenRef = useRef<Screen>("menu")

  // UI state
  const [screen, setScreen] = useState<Screen>("menu")
  const [score, setScore] = useState<[number, number]>([0, 0])
  const [winner, setWinner] = useState<0 | 1 | null>(null)
  const [difficulty, setDifficulty] = useState(2)
  const [target, setTarget] = useState(7)

  screenRef.current = screen

  // Avatar image (drawn on the player's head)
  useEffect(() => {
    if (!player.avatarUrl) return
    const img = new window.Image()
    img.crossOrigin = "anonymous"
    img.onload = () => {
      avatarImgRef.current = img
    }
    img.src = player.avatarUrl
  }, [player.avatarUrl])

  // Keyboard
  useEffect(() => {
    const map = (e: KeyboardEvent, down: boolean): boolean => {
      switch (e.key) {
        case "ArrowLeft":
        case "a":
          inputRef.current.left = down
          return true
        case "ArrowRight":
        case "d":
          inputRef.current.right = down
          return true
        case "ArrowUp":
        case "w":
        case " ":
          inputRef.current.jump = down
          return true
        case "x":
        case "X":
        case "Shift":
          inputRef.current.spike = down
          return true
      }
      return false
    }
    const onDown = (e: KeyboardEvent) => {
      if (map(e, true)) e.preventDefault()
    }
    const onUp = (e: KeyboardEvent) => {
      if (map(e, false)) e.preventDefault()
    }
    window.addEventListener("keydown", onDown)
    window.addEventListener("keyup", onUp)
    return () => {
      window.removeEventListener("keydown", onDown)
      window.removeEventListener("keyup", onUp)
    }
  }, [])

  function startMatch() {
    const mine = statsToParams(player.stats)
    const cpu = statsToParams(cpuStatsForDifficulty(difficulty))
    matchDiffRef.current = difficulty
    stateRef.current = createGameState(mine, cpu, target, Math.floor(Math.random() * 2 ** 31))
    aiMemRef.current = createAiMemory()
    trailRef.current = []
    shakeRef.current = 0
    flashRef.current = 0
    setScore([0, 0])
    setWinner(null)
    setScreen("play")
  }

  const handleEvent = useCallback((ev: GameEvent, st: GameState) => {
    switch (ev.type) {
      case "spike":
        shakeRef.current = 9
        break
      case "touch":
        shakeRef.current = Math.max(shakeRef.current, 2)
        break
      case "point":
        flashRef.current = 1
        lastScorerRef.current = ev.side ?? 0
        setScore([st.score[0], st.score[1]])
        break
      case "over":
        setWinner(ev.side ?? null)
        screenRef.current = "over"
        setScreen("over")
        break
    }
  }, [])

  // ── Render ──────────────────────────────────────────────────────────────
  const render = useCallback(
    (st: GameState) => {
      const canvas = canvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext("2d")
      if (!ctx) return

      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      if (canvas.width !== FIELD_W * dpr) {
        canvas.width = FIELD_W * dpr
        canvas.height = FIELD_H * dpr
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      // Screen shake
      if (shakeRef.current > 0.5) {
        ctx.translate(
          (Math.random() - 0.5) * shakeRef.current,
          (Math.random() - 0.5) * shakeRef.current,
        )
        shakeRef.current *= 0.85
      }

      // Sky
      const sky = ctx.createLinearGradient(0, 0, 0, FIELD_H)
      sky.addColorStop(0, "#0d1209")
      sky.addColorStop(0.6, "#090b09")
      sky.addColorStop(1, "#050604")
      ctx.fillStyle = sky
      ctx.fillRect(-10, -10, FIELD_W + 20, FIELD_H + 20)

      // Lime glow
      const glow = ctx.createRadialGradient(FIELD_W * 0.8, 0, 40, FIELD_W * 0.8, 0, 380)
      glow.addColorStop(0, "rgba(201,243,29,0.10)")
      glow.addColorStop(1, "rgba(201,243,29,0)")
      ctx.fillStyle = glow
      ctx.fillRect(0, 0, FIELD_W, FIELD_H)

      // Sand
      ctx.fillStyle = "#8a7a55"
      ctx.fillRect(-10, GROUND_Y, FIELD_W + 20, FIELD_H - GROUND_Y + 10)
      ctx.fillStyle = "rgba(255,255,255,0.14)"
      ctx.fillRect(-10, GROUND_Y, FIELD_W + 20, 3)

      // Landing shadow (predicted spot)
      if (st.phase === "rally") {
        const lx = predictLandingX(st.ball)
        ctx.fillStyle = "rgba(201,243,29,0.28)"
        ctx.beginPath()
        ctx.ellipse(lx, GROUND_Y + 5, 16, 4, 0, 0, Math.PI * 2)
        ctx.fill()
      }

      // Net
      ctx.fillStyle = "#1a1f1a"
      ctx.fillRect(NET_X - NET_HALF_W, NET_TOP, NET_HALF_W * 2, GROUND_Y - NET_TOP)
      ctx.fillStyle = "rgba(255,255,255,0.35)"
      for (let y = NET_TOP + 10; y < GROUND_Y; y += 14) {
        ctx.fillRect(NET_X - NET_HALF_W, y, NET_HALF_W * 2, 1)
      }
      ctx.fillStyle = "#ffffff"
      ctx.fillRect(NET_X - NET_HALF_W - 2, NET_TOP - 3, NET_HALF_W * 2 + 4, 4)

      // Ball trail
      const trail = trailRef.current
      trail.push({ x: st.ball.x, y: st.ball.y })
      if (trail.length > 10) trail.shift()
      for (let i = 0; i < trail.length; i++) {
        const a = (i / trail.length) * 0.22
        ctx.fillStyle = `rgba(201,243,29,${a})`
        ctx.beginPath()
        ctx.arc(trail[i].x, trail[i].y, BALL_R * (0.4 + (i / trail.length) * 0.5), 0, Math.PI * 2)
        ctx.fill()
      }

      // Players
      for (let i = 0 as 0 | 1; i <= 1; i = (i + 1) as 0 | 1) {
        const p = st.players[i]
        const color = i === 0 ? ME_COLOR : CPU_COLOR

        // shadow under player
        ctx.fillStyle = "rgba(0,0,0,0.35)"
        ctx.beginPath()
        ctx.ellipse(p.x, GROUND_Y + 6, PLAYER_BODY * 0.8, 5, 0, 0, Math.PI * 2)
        ctx.fill()

        // dome body
        ctx.fillStyle = color
        ctx.beginPath()
        ctx.arc(p.x, p.y, PLAYER_BODY, Math.PI, 0)
        ctx.closePath()
        ctx.fill()

        // eye looking at the ball
        const ex = p.x + (i === 0 ? 12 : -12)
        const ey = p.y - 16
        const ang = Math.atan2(st.ball.y - ey, st.ball.x - ex)
        ctx.fillStyle = "#ffffff"
        ctx.beginPath()
        ctx.arc(ex, ey, 7, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = "#0a0d0a"
        ctx.beginPath()
        ctx.arc(ex + Math.cos(ang) * 3, ey + Math.sin(ang) * 3, 3.5, 0, Math.PI * 2)
        ctx.fill()

        // avatar (me) floating above the dome
        if (i === 0 && avatarImgRef.current) {
          const r = 15
          const ay = p.y - PLAYER_BODY - r - 4
          ctx.save()
          ctx.beginPath()
          ctx.arc(p.x, ay, r, 0, Math.PI * 2)
          ctx.clip()
          ctx.drawImage(avatarImgRef.current, p.x - r, ay - r, r * 2, r * 2)
          ctx.restore()
          ctx.strokeStyle = color
          ctx.lineWidth = 2
          ctx.beginPath()
          ctx.arc(p.x, ay, r, 0, Math.PI * 2)
          ctx.stroke()
        }
      }

      // Ball (stretched along its velocity for a sense of speed)
      {
        const b = st.ball
        const sp = Math.hypot(b.vx, b.vy)
        const stretch = Math.min(0.25, sp / 4500)
        ctx.save()
        ctx.translate(b.x, b.y)
        ctx.rotate(Math.atan2(b.vy, b.vx))
        ctx.scale(1 + stretch, 1 - stretch)
        ctx.fillStyle = "#f5f9e8"
        ctx.beginPath()
        ctx.arc(0, 0, BALL_R, 0, Math.PI * 2)
        ctx.fill()
        ctx.strokeStyle = ME_COLOR
        ctx.lineWidth = 2.5
        ctx.beginPath()
        ctx.arc(0, 0, BALL_R - 3, -0.6, 1.2)
        ctx.stroke()
        ctx.restore()
      }

      // Point banner
      if (st.phase === "point") {
        const mine = lastScorerRef.current === 0
        ctx.textAlign = "center"
        ctx.fillStyle = mine ? ME_COLOR : CPU_COLOR
        ctx.font = "900 44px system-ui, sans-serif"
        ctx.fillText(mine ? "PUNTO TUO! 🔥" : "PUNTO CPU", NET_X, 150)
      }

      // White flash on point
      if (flashRef.current > 0.02) {
        ctx.fillStyle = `rgba(255,255,255,${flashRef.current * 0.14})`
        ctx.fillRect(0, 0, FIELD_W, FIELD_H)
        flashRef.current *= 0.9
      }
    },
    [],
  )

  // ── Fixed-timestep loop ─────────────────────────────────────────────────
  useEffect(() => {
    if (screen !== "play") return
    lastTsRef.current = 0
    accRef.current = 0

    const loop = (ts: number) => {
      if (screenRef.current !== "play") return
      const st = stateRef.current
      if (!st) return

      if (lastTsRef.current === 0) lastTsRef.current = ts
      let frame = ts - lastTsRef.current
      if (frame > 100) frame = 100 // tab was hidden — never spiral
      lastTsRef.current = ts
      accRef.current += frame

      const stepMs = STEP * 1000
      while (accRef.current >= stepMs) {
        accRef.current -= stepMs
        const cpu = cpuInput(st, aiMemRef.current, matchDiffRef.current, STEP)
        const events = step(st, inputRef.current, cpu, STEP)
        for (const ev of events) handleEvent(ev, st)
      }

      render(st)
      rafRef.current = requestAnimationFrame(loop)
    }

    rafRef.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(rafRef.current)
  }, [screen, handleEvent, render])

  // ── Menu ────────────────────────────────────────────────────────────────
  if (screen === "menu") {
    return (
      <div className="mx-auto flex max-w-md flex-col gap-5 px-5 pb-10 pt-4">
        <div className="text-center">
          <p className="text-xs font-black uppercase tracking-[0.3em] text-[var(--accent)]">
            SANDER Arcade
          </p>
          <h1 className="mt-1 text-3xl font-black text-white">1v1 in spiaggia</h1>
          <p className="mt-1 text-sm text-[var(--muted-text)]">
            La tua carta scende in campo: le stat contano davvero.
          </p>
        </div>

        {/* Your fighter */}
        <div className="rounded-3xl bg-[var(--surface-2)] p-5">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-[var(--accent)] text-base font-black text-black">
              {player.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={player.avatarUrl} alt={player.name} className="h-full w-full object-cover" />
              ) : (
                player.name.slice(0, 2).toUpperCase()
              )}
            </div>
            <div>
              <p className="font-black text-white">{player.name}</p>
              <p className="text-xs text-[var(--muted-text)]">Il tuo giocatore</p>
            </div>
          </div>
          <div className="space-y-2.5">
            {STAT_ROWS.map(({ key, label }) => (
              <div key={key} className="flex items-center gap-3">
                <span className="w-20 text-xs font-bold text-[var(--muted-text)]">{label}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-[var(--surface-1)]">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${player.stats[key]}%`, background: "var(--accent)" }}
                  />
                </div>
                <span className="w-7 text-right text-sm font-black text-white">
                  {player.stats[key]}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Difficulty */}
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-[var(--muted-text)]">
            Difficoltà CPU
          </p>
          <div className="flex gap-1.5">
            {DIFF_LABELS.map((label, i) => (
              <button
                key={label}
                onClick={() => setDifficulty(i + 1)}
                className="flex-1 rounded-xl py-2.5 text-[0.7rem] font-black transition-colors"
                style={
                  difficulty === i + 1
                    ? { background: "var(--accent)", color: "#000" }
                    : { background: "var(--surface-2)", color: "var(--muted-text)" }
                }
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Set length */}
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-[var(--muted-text)]">
            Punti per vincere (scarto di 2)
          </p>
          <div className="flex gap-1.5">
            {[7, 11, 21].map((t) => (
              <button
                key={t}
                onClick={() => setTarget(t)}
                className="flex-1 rounded-xl py-2.5 text-sm font-black transition-colors"
                style={
                  target === t
                    ? { background: "var(--accent)", color: "#000" }
                    : { background: "var(--surface-2)", color: "var(--muted-text)" }
                }
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={startMatch}
          className="flex min-h-[3.5rem] w-full items-center justify-center gap-2 rounded-2xl text-lg font-black text-black"
          style={{ background: "var(--accent)" }}
        >
          <Zap className="h-5 w-5" /> Gioca
        </button>

        <p className="text-center text-xs text-[var(--muted-text)]">
          Tastiera: ← → muovi · ↑/Spazio salto · X schiaccia
        </p>
      </div>
    )
  }

  // ── Play / pause / over ─────────────────────────────────────────────────
  return (
    <div className="mx-auto flex max-w-3xl flex-col pb-2">
      {/* HUD */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full" style={{ background: ME_COLOR }} />
          <span className="max-w-[7rem] truncate text-sm font-black text-white">
            {player.name}
          </span>
        </div>
        <div className="flex items-center gap-3 text-2xl font-black tabular-nums">
          <span style={{ color: ME_COLOR }}>{score[0]}</span>
          <span className="text-[var(--muted-text)]">—</span>
          <span style={{ color: CPU_COLOR }}>{score[1]}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-black text-white">
            CPU · {DIFF_LABELS[matchDiffRef.current - 1]}
          </span>
          <span className="h-3 w-3 rounded-full" style={{ background: CPU_COLOR }} />
        </div>
      </div>

      {/* Court */}
      <div className="relative px-2">
        <canvas
          ref={canvasRef}
          className="w-full rounded-2xl"
          style={{ aspectRatio: `${FIELD_W}/${FIELD_H}`, touchAction: "none" }}
        />

        {/* Pause button */}
        {screen === "play" && (
          <button
            onClick={() => setScreen("pause")}
            aria-label="Pausa"
            className="absolute right-4 top-2 flex h-10 w-10 items-center justify-center rounded-xl bg-black/40 text-white backdrop-blur-sm"
          >
            <Pause className="h-4 w-4" />
          </button>
        )}

        {/* Pause overlay */}
        {screen === "pause" && (
          <div className="absolute inset-2 z-10 flex flex-col items-center justify-center gap-4 rounded-2xl bg-black/80 backdrop-blur-sm">
            <p className="text-2xl font-black text-white">Pausa</p>
            <button
              onClick={() => setScreen("play")}
              className="flex min-h-[3.25rem] w-52 items-center justify-center gap-2 rounded-2xl font-black text-black"
              style={{ background: "var(--accent)" }}
            >
              <Play className="h-5 w-5" /> Riprendi
            </button>
            <button
              onClick={() => setScreen("menu")}
              className="flex min-h-[3.25rem] w-52 items-center justify-center gap-2 rounded-2xl bg-[var(--surface-2)] font-black text-white"
            >
              <Home className="h-5 w-5" /> Menu
            </button>
          </div>
        )}

        {/* Match over overlay */}
        {screen === "over" && (
          <div className="absolute inset-2 z-10 flex flex-col items-center justify-center gap-4 rounded-2xl bg-black/85 px-6 text-center backdrop-blur-sm">
            <p className="text-5xl">{winner === 0 ? "🏆" : "😤"}</p>
            <div>
              <p
                className="text-3xl font-black"
                style={{ color: winner === 0 ? ME_COLOR : CPU_COLOR }}
              >
                {winner === 0 ? "Hai vinto!" : "Vince la CPU"}
              </p>
              <p className="mt-1 text-lg font-bold text-white tabular-nums">
                {score[0]} — {score[1]}
              </p>
            </div>
            <button
              onClick={startMatch}
              className="flex min-h-[3.25rem] w-56 items-center justify-center gap-2 rounded-2xl font-black text-black"
              style={{ background: "var(--accent)" }}
            >
              <RotateCcw className="h-5 w-5" /> Rivincita
            </button>
            <button
              onClick={() => setScreen("menu")}
              className="flex min-h-[3.25rem] w-56 items-center justify-center gap-2 rounded-2xl bg-[var(--surface-2)] font-black text-white"
            >
              <Home className="h-5 w-5" /> Menu
            </button>
          </div>
        )}
      </div>

      {/* Touch controls */}
      <Controls inputRef={inputRef} />
    </div>
  )
}
