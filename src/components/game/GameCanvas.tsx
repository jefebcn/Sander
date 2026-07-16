"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import type { PointerEvent as ReactPointerEvent } from "react"
import { Pause, Play, RotateCcw, Home, Zap } from "lucide-react"
import {
  createGameState,
  step,
  STEP,
  COURT_W,
  COURT_L,
  NET_Z,
  type GameState,
  type GameEvent,
  type PlayerInput,
} from "@/lib/game/engine"
import {
  statsToParams,
  cpuStatsForDifficulty,
  cpuProfileForDifficulty,
  type GameStats,
} from "@/lib/game/stats"

/* ────────────────────────────────────────────────────────────────────────── */
/*  SANDER Arcade — vertical pseudo-3D court (Beach Volley Clash style).       */
/*  One finger: drag to aim during slow-mo, release to spike.                  */
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

// Logical viewport (portrait) + court projection anchors
const VIEW = { W: 420, H: 700, cx: 210, nearY: 645, farY: 150, nearHalf: 196, farHalf: 104 }
const NET_H = 55

function proj(x: number, z: number, y: number) {
  const t = z / COURT_L // 0 = your baseline (bottom), 1 = far baseline (top)
  const half = VIEW.nearHalf + (VIEW.farHalf - VIEW.nearHalf) * t
  const scale = half / VIEW.nearHalf
  const sx = VIEW.cx + ((x - COURT_W / 2) / (COURT_W / 2)) * half
  const sy = VIEW.nearY + (VIEW.farY - VIEW.nearY) * t - y * scale
  return { sx, sy, scale }
}

const STAT_ROWS: { key: keyof GameStats; label: string }[] = [
  { key: "velocita", label: "Velocità" },
  { key: "potenza", label: "Potenza" },
  { key: "salto", label: "Salto" },
  { key: "difesa", label: "Difesa" },
  { key: "controllo", label: "Controllo" },
]

export function GameCanvas({ player }: { player: ArcadePlayer }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Hot-path refs
  const stateRef = useRef<GameState | null>(null)
  const inputRef = useRef<PlayerInput>({ aimX: COURT_W / 2, aimZ: NET_Z + 130, release: false })
  const draggingRef = useRef(false)
  const lastPtRef = useRef({ x: 0, y: 0 })
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

  // Avatar (drawn as your players' heads)
  useEffect(() => {
    if (!player.avatarUrl) return
    const img = new window.Image()
    img.crossOrigin = "anonymous"
    img.onload = () => {
      avatarImgRef.current = img
    }
    img.src = player.avatarUrl
  }, [player.avatarUrl])

  // Keyboard fallback: arrows nudge the aim, space/enter releases
  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      const inp = inputRef.current
      switch (e.key) {
        case "ArrowLeft":
          inp.aimX -= 14
          break
        case "ArrowRight":
          inp.aimX += 14
          break
        case "ArrowUp":
          inp.aimZ += 16
          break
        case "ArrowDown":
          inp.aimZ -= 16
          break
        case " ":
        case "Enter":
          inp.release = true
          break
        default:
          return
      }
      e.preventDefault()
    }
    window.addEventListener("keydown", onDown)
    return () => window.removeEventListener("keydown", onDown)
  }, [])

  function startMatch() {
    const mine = statsToParams(player.stats)
    const cpu = statsToParams(cpuStatsForDifficulty(difficulty))
    const profile = cpuProfileForDifficulty(difficulty)
    matchDiffRef.current = difficulty
    stateRef.current = createGameState(mine, cpu, profile, target, Math.floor(Math.random() * 2 ** 31))
    inputRef.current = { aimX: COURT_W / 2, aimZ: NET_Z + 130, release: false }
    trailRef.current = []
    shakeRef.current = 0
    flashRef.current = 0
    setScore([0, 0])
    setWinner(null)
    setScreen("play")
  }

  const handleEvent = useCallback((ev: GameEvent, st: GameState) => {
    switch (ev.type) {
      case "aim":
        if (ev.side === 0) {
          // your turn: reset the reticle to the engine default, clear stale release
          inputRef.current.aimX = st.aimX
          inputRef.current.aimZ = st.aimZ
          inputRef.current.release = false
        }
        break
      case "spike":
      case "serve":
        shakeRef.current = ev.side === 0 ? 9 : 6
        trailRef.current = []
        break
      case "receive":
        shakeRef.current = Math.max(shakeRef.current, 3)
        break
      case "dive":
        shakeRef.current = Math.max(shakeRef.current, 6)
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

  // ── Pointer aiming ──────────────────────────────────────────────────────
  const onPointerDown = useCallback((e: ReactPointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    draggingRef.current = true
    lastPtRef.current = { x: e.clientX, y: e.clientY }
    inputRef.current.release = false
  }, [])

  const onPointerMove = useCallback((e: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!draggingRef.current) return
    const rect = e.currentTarget.getBoundingClientRect()
    const dx = e.clientX - lastPtRef.current.x
    const dy = e.clientY - lastPtRef.current.y
    lastPtRef.current = { x: e.clientX, y: e.clientY }
    // drag right → aim right; drag UP → aim deeper (larger z)
    inputRef.current.aimX += dx * (COURT_W / rect.width) * 1.2
    inputRef.current.aimZ -= dy * (COURT_L / rect.height) * 1.2
  }, [])

  const onPointerUp = useCallback(() => {
    if (!draggingRef.current) return
    draggingRef.current = false
    inputRef.current.release = true
  }, [])

  // ── Renderer ────────────────────────────────────────────────────────────
  const render = useCallback(
    (st: GameState) => {
      const canvas = canvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext("2d")
      if (!ctx) return

      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      if (canvas.width !== VIEW.W * dpr) {
        canvas.width = VIEW.W * dpr
        canvas.height = VIEW.H * dpr
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      // Screen shake
      if (shakeRef.current > 0.5) {
        ctx.translate(
          (Math.random() - 0.5) * shakeRef.current,
          (Math.random() - 0.5) * shakeRef.current,
        )
        shakeRef.current *= 0.86
      }

      // Sky
      const sky = ctx.createLinearGradient(0, 0, 0, VIEW.H)
      sky.addColorStop(0, "#0d1209")
      sky.addColorStop(0.45, "#090b09")
      sky.addColorStop(1, "#0b0a07")
      ctx.fillStyle = sky
      ctx.fillRect(-12, -12, VIEW.W + 24, VIEW.H + 24)
      const glow = ctx.createRadialGradient(VIEW.cx, 40, 20, VIEW.cx, 40, 360)
      glow.addColorStop(0, "rgba(201,243,29,0.10)")
      glow.addColorStop(1, "rgba(201,243,29,0)")
      ctx.fillStyle = glow
      ctx.fillRect(0, 0, VIEW.W, VIEW.H)

      // Court (sand trapezoid + lines)
      const c00 = proj(0, 0, 0)
      const c10 = proj(COURT_W, 0, 0)
      const c11 = proj(COURT_W, COURT_L, 0)
      const c01 = proj(0, COURT_L, 0)
      ctx.fillStyle = "#8a7a55"
      ctx.beginPath()
      ctx.moveTo(c00.sx, c00.sy)
      ctx.lineTo(c10.sx, c10.sy)
      ctx.lineTo(c11.sx, c11.sy)
      ctx.lineTo(c01.sx, c01.sy)
      ctx.closePath()
      ctx.fill()
      // beach outside the lines, slightly darker
      ctx.strokeStyle = "rgba(255,255,255,0.75)"
      ctx.lineWidth = 3
      ctx.stroke()
      // centre (net) line
      const n0 = proj(0, NET_Z, 0)
      const n1 = proj(COURT_W, NET_Z, 0)
      ctx.strokeStyle = "rgba(255,255,255,0.4)"
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(n0.sx, n0.sy)
      ctx.lineTo(n1.sx, n1.sy)
      ctx.stroke()

      // Aim reticle (only while YOU aim)
      if (st.phase === "aim" && st.aimSide === 0) {
        const r = proj(st.aimX, st.aimZ, 0)
        const pulse = 1 + Math.sin(st.aimT * 8) * 0.12
        ctx.strokeStyle = ME_COLOR
        ctx.lineWidth = 3
        ctx.beginPath()
        ctx.ellipse(r.sx, r.sy, 26 * r.scale * pulse, 11 * r.scale * pulse, 0, 0, Math.PI * 2)
        ctx.stroke()
        ctx.fillStyle = "rgba(201,243,29,0.25)"
        ctx.beginPath()
        ctx.ellipse(r.sx, r.sy, 12 * r.scale, 5 * r.scale, 0, 0, Math.PI * 2)
        ctx.fill()
      }

      // ── Depth-ordered entities: far half → net → near half ──
      const drawPlayer = (side: 0 | 1, idx: 0 | 1) => {
        const p = st.players[side][idx]
        const pr = proj(p.x, p.z, 0)
        const s = pr.scale
        const color = side === 0 ? ME_COLOR : CPU_COLOR
        const isAttacker =
          st.phase === "aim" && st.aimSide === side && st.attackerIdx[side] === idx

        // shadow
        ctx.fillStyle = "rgba(0,0,0,0.35)"
        ctx.beginPath()
        ctx.ellipse(pr.sx, pr.sy + 3 * s, 16 * s, 5 * s, 0, 0, Math.PI * 2)
        ctx.fill()

        // attacker glow ring
        if (isAttacker) {
          ctx.strokeStyle = color
          ctx.lineWidth = 2
          ctx.beginPath()
          ctx.ellipse(pr.sx, pr.sy + 3 * s, 20 * s, 7 * s, 0, 0, Math.PI * 2)
          ctx.stroke()
        }

        // body
        const bh = 40 * s
        const bw = 22 * s
        ctx.fillStyle = color
        ctx.beginPath()
        ctx.ellipse(pr.sx, pr.sy - bh * 0.45, bw / 2, bh / 2, 0, 0, Math.PI * 2)
        ctx.fill()

        // head (your side wears your avatar)
        const hr = 9 * s
        const hy = pr.sy - bh * 0.95 - hr * 0.4
        if (side === 0 && avatarImgRef.current) {
          ctx.save()
          ctx.beginPath()
          ctx.arc(pr.sx, hy, hr, 0, Math.PI * 2)
          ctx.clip()
          ctx.drawImage(avatarImgRef.current, pr.sx - hr, hy - hr, hr * 2, hr * 2)
          ctx.restore()
          ctx.strokeStyle = color
          ctx.lineWidth = 1.5
          ctx.beginPath()
          ctx.arc(pr.sx, hy, hr, 0, Math.PI * 2)
          ctx.stroke()
        } else {
          ctx.fillStyle = "#e8d6b8"
          ctx.beginPath()
          ctx.arc(pr.sx, hy, hr, 0, Math.PI * 2)
          ctx.fill()
        }
      }

      const drawBall = () => {
        const b = st.ball
        // shadow on the sand
        const sh = proj(b.x, b.z, 0)
        const shrink = Math.max(0.35, 1 - b.y / 320)
        ctx.fillStyle = "rgba(0,0,0,0.4)"
        ctx.beginPath()
        ctx.ellipse(sh.sx, sh.sy, 9 * sh.scale * shrink, 4 * sh.scale * shrink, 0, 0, Math.PI * 2)
        ctx.fill()

        // trail during flights
        if (st.phase === "flight") {
          const bp = proj(b.x, b.z, b.y)
          trailRef.current.push({ x: bp.sx, y: bp.sy })
          if (trailRef.current.length > 12) trailRef.current.shift()
          for (let i = 0; i < trailRef.current.length; i++) {
            const a = (i / trailRef.current.length) * 0.25
            ctx.fillStyle = `rgba(201,243,29,${a})`
            ctx.beginPath()
            ctx.arc(trailRef.current[i].x, trailRef.current[i].y, 3 + i * 0.5, 0, Math.PI * 2)
            ctx.fill()
          }
        }

        const bp = proj(b.x, b.z, b.y)
        const r = 10 * bp.scale
        ctx.fillStyle = "#f5f9e8"
        ctx.beginPath()
        ctx.arc(bp.sx, bp.sy, r, 0, Math.PI * 2)
        ctx.fill()
        ctx.strokeStyle = ME_COLOR
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.arc(bp.sx, bp.sy, r - 2.5, -0.6, 1.2)
        ctx.stroke()
      }

      // far half first
      const farOrder: [0 | 1, 0 | 1][] = [
        [1, 0],
        [1, 1],
      ]
      farOrder
        .sort((a, b2) => st.players[a[0]][a[1]].z - st.players[b2[0]][b2[1]].z)
        .reverse()
        .forEach(([s2, i2]) => drawPlayer(s2, i2))
      if (st.ball.z > NET_Z) drawBall()

      // net
      {
        const t0 = proj(0, NET_Z, 0)
        const t1 = proj(COURT_W, NET_Z, 0)
        const u0 = proj(0, NET_Z, NET_H)
        const u1 = proj(COURT_W, NET_Z, NET_H)
        ctx.fillStyle = "rgba(255,255,255,0.10)"
        ctx.beginPath()
        ctx.moveTo(t0.sx - 8, t0.sy)
        ctx.lineTo(t1.sx + 8, t1.sy)
        ctx.lineTo(u1.sx + 8, u1.sy)
        ctx.lineTo(u0.sx - 8, u0.sy)
        ctx.closePath()
        ctx.fill()
        // mesh lines
        ctx.strokeStyle = "rgba(255,255,255,0.18)"
        ctx.lineWidth = 1
        for (let i = 1; i < 5; i++) {
          const yy0 = t0.sy + (u0.sy - t0.sy) * (i / 5)
          const yy1 = t1.sy + (u1.sy - t1.sy) * (i / 5)
          ctx.beginPath()
          ctx.moveTo(t0.sx - 8, yy0)
          ctx.lineTo(t1.sx + 8, yy1)
          ctx.stroke()
        }
        // tape + posts
        ctx.strokeStyle = "rgba(255,255,255,0.9)"
        ctx.lineWidth = 3
        ctx.beginPath()
        ctx.moveTo(u0.sx - 8, u0.sy)
        ctx.lineTo(u1.sx + 8, u1.sy)
        ctx.stroke()
        ctx.strokeStyle = "rgba(255,255,255,0.5)"
        ctx.lineWidth = 3
        ctx.beginPath()
        ctx.moveTo(t0.sx - 8, t0.sy)
        ctx.lineTo(u0.sx - 8, u0.sy)
        ctx.moveTo(t1.sx + 8, t1.sy)
        ctx.lineTo(u1.sx + 8, u1.sy)
        ctx.stroke()
      }

      // near half
      const nearOrder: [0 | 1, 0 | 1][] = [
        [0, 0],
        [0, 1],
      ]
      nearOrder
        .sort((a, b2) => st.players[a[0]][a[1]].z - st.players[b2[0]][b2[1]].z)
        .reverse()
        .forEach(([s2, i2]) => drawPlayer(s2, i2))
      if (st.ball.z <= NET_Z) drawBall()

      // ── Overlays ──
      if (st.phase === "aim" && st.aimSide === 0) {
        // slow-mo vignette + timer bar
        ctx.fillStyle = "rgba(0,0,0,0.18)"
        ctx.fillRect(0, 0, VIEW.W, VIEW.H)
        const remain = Math.max(0, 1 - st.aimT / st.params[0].aimTime)
        ctx.fillStyle = "rgba(255,255,255,0.12)"
        ctx.fillRect(60, 24, VIEW.W - 120, 8)
        ctx.fillStyle = ME_COLOR
        ctx.fillRect(60, 24, (VIEW.W - 120) * remain, 8)
        ctx.textAlign = "center"
        ctx.fillStyle = "rgba(255,255,255,0.85)"
        ctx.font = "800 15px system-ui, sans-serif"
        ctx.fillText(st.isServe ? "SERVIZIO — trascina e mira" : "TRASCINA E MIRA", VIEW.cx, 52)
      } else if (st.phase === "aim" && st.aimSide === 1) {
        ctx.textAlign = "center"
        ctx.fillStyle = "rgba(255,255,255,0.5)"
        ctx.font = "800 14px system-ui, sans-serif"
        ctx.fillText("La CPU attacca…", VIEW.cx, 44)
      }

      if (st.phase === "point") {
        const mine = lastScorerRef.current === 0
        ctx.textAlign = "center"
        ctx.fillStyle = mine ? ME_COLOR : CPU_COLOR
        ctx.font = "900 40px system-ui, sans-serif"
        ctx.fillText(mine ? "PUNTO TUO! 🔥" : "PUNTO CPU", VIEW.cx, 120)
      }

      if (flashRef.current > 0.02) {
        ctx.fillStyle = `rgba(255,255,255,${flashRef.current * 0.14})`
        ctx.fillRect(0, 0, VIEW.W, VIEW.H)
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
      if (frame > 100) frame = 100
      lastTsRef.current = ts
      accRef.current += frame

      const stepMs = STEP * 1000
      while (accRef.current >= stepMs) {
        accRef.current -= stepMs
        const events = step(st, inputRef.current, STEP)
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
          <h1 className="mt-1 text-3xl font-black text-white">Beach Volley Clash</h1>
          <p className="mt-1 text-sm text-[var(--muted-text)]">
            Trascina per mirare in slow-mo, rilascia per schiacciare.
          </p>
        </div>

        {/* Your duo */}
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
              <p className="text-xs text-[var(--muted-text)]">La tua coppia in campo</p>
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
          Un dito solo: trascina il mirino dove vuoi colpire e rilascia. 🏐
        </p>
      </div>
    )
  }

  // ── Play / pause / over ─────────────────────────────────────────────────
  return (
    <div className="mx-auto flex max-w-md flex-col pb-4">
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
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          className="w-full rounded-2xl select-none"
          style={{ aspectRatio: `${VIEW.W}/${VIEW.H}`, touchAction: "none" }}
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
    </div>
  )
}
