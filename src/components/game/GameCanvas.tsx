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
/*  SANDER Arcade — sunny beach scene + cartoon characters (BVC style).        */
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
const VIEW = { W: 420, H: 700, cx: 210, nearY: 655, farY: 210, nearHalf: 196, farHalf: 110 }
const HORIZON_Y = 150
const NET_H = 55

// Team looks (jersey, shorts, skin, hair)
const LOOKS = [
  { jersey: ME_COLOR, shorts: "#1a1f1a", skin: "#eab883", hair: "#3a2a1a" },
  { jersey: CPU_COLOR, shorts: "#ffffff", skin: "#d9a066", hair: "#14100c" },
] as const

function proj(x: number, z: number, y: number) {
  const t = z / COURT_L // 0 = your baseline (bottom), 1 = far baseline (top)
  const half = VIEW.nearHalf + (VIEW.farHalf - VIEW.nearHalf) * t
  const scale = half / VIEW.nearHalf
  const sx = VIEW.cx + ((x - COURT_W / 2) / (COURT_W / 2)) * half
  const sy = VIEW.nearY + (VIEW.farY - VIEW.nearY) * t - y * scale
  return { sx, sy, scale }
}

interface AnimState {
  runPhase: number
  px: number
  pz: number
  dive: number
  spike: number
  facing: number
}

function freshAnims(): AnimState[][] {
  return [0, 1].map(() =>
    [0, 1].map(() => ({ runPhase: 0, px: -1, pz: -1, dive: 0, spike: 0, facing: 1 })),
  )
}

const STAT_ROWS: { key: keyof GameStats; label: string }[] = [
  { key: "velocita", label: "Velocità" },
  { key: "potenza", label: "Potenza" },
  { key: "salto", label: "Salto" },
  { key: "difesa", label: "Difesa" },
  { key: "controllo", label: "Controllo" },
]

/* ── Scene helpers (procedural, drawn each frame) ─────────────────────────── */

function drawCloud(ctx: CanvasRenderingContext2D, x: number, y: number, s: number) {
  ctx.fillStyle = "rgba(255,255,255,0.92)"
  ctx.beginPath()
  ctx.ellipse(x, y, 26 * s, 11 * s, 0, 0, Math.PI * 2)
  ctx.ellipse(x + 18 * s, y + 2 * s, 18 * s, 9 * s, 0, 0, Math.PI * 2)
  ctx.ellipse(x - 20 * s, y + 3 * s, 15 * s, 8 * s, 0, 0, Math.PI * 2)
  ctx.fill()
}

function drawPalm(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, flip: number) {
  // trunk
  ctx.strokeStyle = "#8a6238"
  ctx.lineWidth = 7 * s
  ctx.lineCap = "round"
  ctx.beginPath()
  ctx.moveTo(x, y)
  ctx.quadraticCurveTo(x + 10 * flip * s, y - 40 * s, x + 22 * flip * s, y - 72 * s)
  ctx.stroke()
  // fronds
  const tx = x + 22 * flip * s
  const ty = y - 72 * s
  ctx.fillStyle = "#2f9e44"
  for (let i = 0; i < 6; i++) {
    const ang = -Math.PI / 2 + (i - 2.5) * 0.5
    ctx.save()
    ctx.translate(tx, ty)
    ctx.rotate(ang)
    ctx.beginPath()
    ctx.ellipse(20 * s, 0, 22 * s, 6.5 * s, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }
  // coconuts
  ctx.fillStyle = "#6b4a2a"
  ctx.beginPath()
  ctx.arc(tx - 4 * s, ty + 4 * s, 3.5 * s, 0, Math.PI * 2)
  ctx.arc(tx + 4 * s, ty + 5 * s, 3.5 * s, 0, Math.PI * 2)
  ctx.fill()
}

function drawUmbrella(ctx: CanvasRenderingContext2D, x: number, y: number, s: number) {
  ctx.strokeStyle = "#9a9a9a"
  ctx.lineWidth = 3 * s
  ctx.beginPath()
  ctx.moveTo(x, y)
  ctx.lineTo(x, y - 34 * s)
  ctx.stroke()
  for (let i = 0; i < 4; i++) {
    ctx.fillStyle = i % 2 === 0 ? "#ff5a5a" : "#ffffff"
    ctx.beginPath()
    ctx.moveTo(x, y - 34 * s)
    const a0 = Math.PI + (i / 4) * Math.PI
    const a1 = Math.PI + ((i + 1) / 4) * Math.PI
    ctx.arc(x, y - 30 * s, 26 * s, a0, a1)
    ctx.closePath()
    ctx.fill()
  }
}

function drawVolleyball(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  spin: number,
) {
  const g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.35, r * 0.2, x, y, r)
  g.addColorStop(0, "#ffffff")
  g.addColorStop(1, "#d8d8d8")
  ctx.fillStyle = g
  ctx.beginPath()
  ctx.arc(x, y, r, 0, Math.PI * 2)
  ctx.fill()

  ctx.save()
  ctx.beginPath()
  ctx.arc(x, y, r - 0.5, 0, Math.PI * 2)
  ctx.clip()
  const colors = ["#2b6cb0", "#f6c026", "#2b6cb0"]
  for (let k = 0; k < 3; k++) {
    const a = spin + (k * Math.PI * 2) / 3
    ctx.strokeStyle = colors[k]
    ctx.lineWidth = r * 0.3
    ctx.beginPath()
    ctx.arc(x + Math.cos(a) * r * 0.85, y + Math.sin(a) * r * 0.85, r * 0.95, 0, Math.PI * 2)
    ctx.stroke()
  }
  ctx.restore()

  ctx.strokeStyle = "rgba(0,0,0,0.2)"
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.arc(x, y, r, 0, Math.PI * 2)
  ctx.stroke()
}

/* ── The character: articulated cartoon player ────────────────────────────── */

function drawCharacter(
  ctx: CanvasRenderingContext2D,
  opts: {
    sx: number
    sy: number
    s: number
    team: 0 | 1
    anim: AnimState
    moving: number // 0..1
    holding: boolean
    avatar: HTMLImageElement | null
  },
) {
  const { sx, sy, s, team, anim, moving, holding, avatar } = opts
  const look = LOOKS[team]
  const f = anim.facing

  // ground shadow (never rotates with the dive)
  ctx.fillStyle = "rgba(0,0,0,0.22)"
  ctx.beginPath()
  ctx.ellipse(sx, sy + 3 * s, 17 * s, 5.5 * s, 0, 0, Math.PI * 2)
  ctx.fill()

  ctx.save()
  ctx.translate(sx, sy)
  ctx.scale(s, s)

  // dive: tip the whole body toward the ball
  const diveP = Math.min(1, anim.dive / 0.5)
  if (diveP > 0) ctx.rotate(f * -1.05 * (1 - Math.pow(1 - diveP, 2)))

  const run = Math.sin(anim.runPhase)
  const legAmp = 0.55 * moving
  ctx.lineCap = "round"

  // legs (skin) + feet
  ctx.strokeStyle = look.skin
  ctx.lineWidth = 5
  for (const side of [-1, 1]) {
    const swing = run * legAmp * side
    const hx = side * 4
    const fx2 = hx + Math.sin(swing) * 14
    const fy2 = -2 + (1 - Math.cos(swing)) * -6
    ctx.beginPath()
    ctx.moveTo(hx, -32)
    ctx.lineTo(fx2, fy2)
    ctx.stroke()
  }

  // shorts
  ctx.fillStyle = look.shorts
  ctx.beginPath()
  ctx.roundRect(-8.5, -38, 17, 12, 4)
  ctx.fill()

  // torso (jersey)
  ctx.fillStyle = look.jersey
  ctx.beginPath()
  ctx.roundRect(-9, -62, 18, 27, 6)
  ctx.fill()

  // arms
  const spikeP = Math.min(1, anim.spike / 0.45)
  ctx.strokeStyle = look.skin
  ctx.lineWidth = 4.5
  if (diveP > 0.15) {
    // both arms stretched toward the ball
    ctx.beginPath()
    ctx.moveTo(f * 6, -58)
    ctx.lineTo(f * 27, -46)
    ctx.moveTo(f * 4, -54)
    ctx.lineTo(f * 25, -38)
    ctx.stroke()
  } else if (holding) {
    // both arms up (setting pose under the held ball)
    ctx.beginPath()
    ctx.moveTo(-8, -58)
    ctx.lineTo(-7, -82)
    ctx.moveTo(8, -58)
    ctx.lineTo(7, -82)
    ctx.stroke()
  } else if (spikeP > 0) {
    // attack arm swings from up-back to down-forward
    const swing = 1 - spikeP // 1 → 0
    const ax = f * (4 + 12 * (1 - swing))
    const ay = -86 + 34 * (1 - swing)
    ctx.beginPath()
    ctx.moveTo(f * 8, -58)
    ctx.lineTo(ax, ay)
    ctx.moveTo(-f * 8, -58)
    ctx.lineTo(-f * 12, -44)
    ctx.stroke()
  } else {
    // relaxed / running swing
    const sw = run * 0.5 * moving
    ctx.beginPath()
    ctx.moveTo(-8, -58)
    ctx.lineTo(-11 - Math.sin(sw) * 8, -38)
    ctx.moveTo(8, -58)
    ctx.lineTo(11 + Math.sin(sw) * 8, -38)
    ctx.stroke()
  }

  // head
  const hy = -72
  if (avatar) {
    ctx.save()
    ctx.beginPath()
    ctx.arc(0, hy, 10, 0, Math.PI * 2)
    ctx.clip()
    ctx.drawImage(avatar, -10, hy - 10, 20, 20)
    ctx.restore()
    ctx.strokeStyle = look.jersey
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.arc(0, hy, 10, 0, Math.PI * 2)
    ctx.stroke()
  } else {
    ctx.fillStyle = look.skin
    ctx.beginPath()
    ctx.arc(0, hy, 10, 0, Math.PI * 2)
    ctx.fill()
    // hair cap
    ctx.fillStyle = look.hair
    ctx.beginPath()
    ctx.arc(0, hy - 1.5, 10, Math.PI * 0.95, Math.PI * 2.05)
    ctx.fill()
    // eyes toward the ball
    ctx.fillStyle = "#20160e"
    ctx.beginPath()
    ctx.arc(f * 4.5, hy - 0.5, 1.4, 0, Math.PI * 2)
    ctx.arc(f * 1, hy - 0.5, 1.4, 0, Math.PI * 2)
    ctx.fill()
  }

  ctx.restore()
}

/* ────────────────────────────────────────────────────────────────────────── */

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
  const animsRef = useRef<AnimState[][]>(freshAnims())
  const spinRef = useRef(0)
  const screenRef = useRef<Screen>("menu")

  // UI state
  const [screen, setScreen] = useState<Screen>("menu")
  const [score, setScore] = useState<[number, number]>([0, 0])
  const [winner, setWinner] = useState<0 | 1 | null>(null)
  const [difficulty, setDifficulty] = useState(2)
  const [target, setTarget] = useState(7)

  screenRef.current = screen

  // Avatar (your players' faces)
  useEffect(() => {
    if (!player.avatarUrl) return
    const img = new window.Image()
    img.crossOrigin = "anonymous"
    img.onload = () => {
      avatarImgRef.current = img
    }
    img.src = player.avatarUrl
  }, [player.avatarUrl])

  // Keyboard fallback
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
    animsRef.current = freshAnims()
    trailRef.current = []
    shakeRef.current = 0
    flashRef.current = 0
    setScore([0, 0])
    setWinner(null)
    setScreen("play")
  }

  const handleEvent = useCallback((ev: GameEvent, st: GameState) => {
    const anims = animsRef.current
    switch (ev.type) {
      case "aim":
        if (ev.side === 0) {
          inputRef.current.aimX = st.aimX
          inputRef.current.aimZ = st.aimZ
          inputRef.current.release = false
        }
        break
      case "spike":
      case "serve":
        shakeRef.current = ev.side === 0 ? 9 : 6
        trailRef.current = []
        if (ev.side !== undefined && ev.idx !== undefined) anims[ev.side][ev.idx].spike = 0.45
        break
      case "receive":
        shakeRef.current = Math.max(shakeRef.current, 3)
        if (ev.side !== undefined && ev.idx !== undefined) anims[ev.side][ev.idx].dive = 0.3
        break
      case "dive":
        shakeRef.current = Math.max(shakeRef.current, 6)
        if (ev.side !== undefined && ev.idx !== undefined) anims[ev.side][ev.idx].dive = 0.55
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
    inputRef.current.aimX += dx * (COURT_W / rect.width) * 1.2
    inputRef.current.aimZ -= dy * (COURT_L / rect.height) * 1.2
  }, [])

  const onPointerUp = useCallback(() => {
    if (!draggingRef.current) return
    draggingRef.current = false
    inputRef.current.release = true
  }, [])

  // ── Renderer ────────────────────────────────────────────────────────────
  const render = useCallback((st: GameState) => {
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

    /* ── Sunny sky, sea, beach ── */
    const sky = ctx.createLinearGradient(0, 0, 0, HORIZON_Y)
    sky.addColorStop(0, "#5db4f0")
    sky.addColorStop(1, "#a8dcf8")
    ctx.fillStyle = sky
    ctx.fillRect(-12, -12, VIEW.W + 24, HORIZON_Y + 12)

    // sun
    const sun = ctx.createRadialGradient(352, 46, 6, 352, 46, 56)
    sun.addColorStop(0, "rgba(255,244,190,1)")
    sun.addColorStop(0.35, "rgba(255,230,140,0.85)")
    sun.addColorStop(1, "rgba(255,230,140,0)")
    ctx.fillStyle = sun
    ctx.fillRect(280, -20, 150, 140)

    drawCloud(ctx, 90, 44, 1)
    drawCloud(ctx, 250, 70, 0.7)

    // sea
    const sea = ctx.createLinearGradient(0, HORIZON_Y - 32, 0, HORIZON_Y + 14)
    sea.addColorStop(0, "#1f7ec2")
    sea.addColorStop(1, "#3fa9e8")
    ctx.fillStyle = sea
    ctx.fillRect(-12, HORIZON_Y - 32, VIEW.W + 24, 46)
    ctx.fillStyle = "rgba(255,255,255,0.5)"
    for (let i = 0; i < 7; i++) {
      ctx.fillRect(20 + i * 60 + (i % 2) * 18, HORIZON_Y - 20 + (i % 3) * 8, 22, 1.6)
    }

    // beach sand (everything below the sea)
    const sand = ctx.createLinearGradient(0, HORIZON_Y, 0, VIEW.H)
    sand.addColorStop(0, "#eed394")
    sand.addColorStop(1, "#dcb96e")
    ctx.fillStyle = sand
    ctx.fillRect(-12, HORIZON_Y + 14, VIEW.W + 24, VIEW.H - HORIZON_Y)

    // scenery
    drawPalm(ctx, 26, 196, 1, 1)
    drawPalm(ctx, 396, 188, 0.85, -1)
    drawUmbrella(ctx, 393, 320, 1)

    /* ── Court ── */
    const c00 = proj(0, 0, 0)
    const c10 = proj(COURT_W, 0, 0)
    const c11 = proj(COURT_W, COURT_L, 0)
    const c01 = proj(0, COURT_L, 0)
    // in-court sand slightly warmer
    ctx.fillStyle = "rgba(255,236,170,0.45)"
    ctx.beginPath()
    ctx.moveTo(c00.sx, c00.sy)
    ctx.lineTo(c10.sx, c10.sy)
    ctx.lineTo(c11.sx, c11.sy)
    ctx.lineTo(c01.sx, c01.sy)
    ctx.closePath()
    ctx.fill()
    // boundary lines (BVC-style red)
    ctx.strokeStyle = "#e04848"
    ctx.lineWidth = 4
    ctx.lineJoin = "round"
    ctx.stroke()
    // centre line under the net
    const n0 = proj(0, NET_Z, 0)
    const n1 = proj(COURT_W, NET_Z, 0)
    ctx.strokeStyle = "rgba(255,255,255,0.65)"
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(n0.sx, n0.sy)
    ctx.lineTo(n1.sx, n1.sy)
    ctx.stroke()

    /* ── Aim reticle (bullseye, only while YOU aim) ── */
    if (st.phase === "aim" && st.aimSide === 0) {
      const r = proj(st.aimX, st.aimZ, 0)
      const pulse = 1 + Math.sin(st.aimT * 8) * 0.1
      const rr = 26 * r.scale * pulse
      ctx.lineWidth = 3.5
      ctx.strokeStyle = "#ffffff"
      ctx.beginPath()
      ctx.ellipse(r.sx, r.sy, rr, rr * 0.42, 0, 0, Math.PI * 2)
      ctx.stroke()
      ctx.strokeStyle = "#e33"
      ctx.beginPath()
      ctx.ellipse(r.sx, r.sy, rr * 0.62, rr * 0.26, 0, 0, Math.PI * 2)
      ctx.stroke()
      ctx.fillStyle = "rgba(238,51,51,0.55)"
      ctx.beginPath()
      ctx.ellipse(r.sx, r.sy, rr * 0.22, rr * 0.1, 0, 0, Math.PI * 2)
      ctx.fill()
    }

    /* ── Entities (depth ordered: far → net → near) ── */
    spinRef.current += 0.06 + (st.phase === "flight" ? 0.18 : 0)

    const drawSidePlayer = (side: 0 | 1, idx: 0 | 1) => {
      const p = st.players[side][idx]
      const a = animsRef.current[side][idx]
      // advance run cycle from actual movement
      const d = a.px >= 0 ? Math.hypot(p.x - a.px, p.z - a.pz) : 0
      a.runPhase += d * 0.22
      const moving = Math.min(1, d / 2.2)
      a.facing = st.ball.x > p.x + 4 ? 1 : st.ball.x < p.x - 4 ? -1 : a.facing
      const pr = proj(p.x, p.z, 0)
      drawCharacter(ctx, {
        sx: pr.sx,
        sy: pr.sy,
        s: pr.scale,
        team: side,
        anim: a,
        moving,
        holding: st.phase === "aim" && st.aimSide === side && st.attackerIdx[side] === idx,
        avatar: side === 0 ? avatarImgRef.current : null,
      })
      a.px = p.x
      a.pz = p.z
      a.dive = Math.max(0, a.dive - 1 / 60)
      a.spike = Math.max(0, a.spike - 1 / 60)
    }

    const drawBallNow = () => {
      const b = st.ball
      const sh = proj(b.x, b.z, 0)
      const shrink = Math.max(0.35, 1 - b.y / 320)
      ctx.fillStyle = "rgba(0,0,0,0.28)"
      ctx.beginPath()
      ctx.ellipse(sh.sx, sh.sy, 9 * sh.scale * shrink, 4 * sh.scale * shrink, 0, 0, Math.PI * 2)
      ctx.fill()

      if (st.phase === "flight") {
        const bp0 = proj(b.x, b.z, b.y)
        trailRef.current.push({ x: bp0.sx, y: bp0.sy })
        if (trailRef.current.length > 12) trailRef.current.shift()
        for (let i = 0; i < trailRef.current.length; i++) {
          const a = (i / trailRef.current.length) * 0.3
          ctx.fillStyle = `rgba(255,255,255,${a})`
          ctx.beginPath()
          ctx.arc(trailRef.current[i].x, trailRef.current[i].y, 2.5 + i * 0.5, 0, Math.PI * 2)
          ctx.fill()
        }
      }

      const bp = proj(b.x, b.z, b.y)
      drawVolleyball(ctx, bp.sx, bp.sy, 10.5 * bp.scale, spinRef.current)
    }

    // far half (sorted deepest first)
    const farIdx: (0 | 1)[] = st.players[1][0].z >= st.players[1][1].z ? [0, 1] : [1, 0]
    farIdx.forEach((i) => drawSidePlayer(1, i))
    if (st.ball.z > NET_Z) drawBallNow()

    // net
    {
      const t0 = proj(0, NET_Z, 0)
      const t1 = proj(COURT_W, NET_Z, 0)
      const u0 = proj(0, NET_Z, NET_H)
      const u1 = proj(COURT_W, NET_Z, NET_H)
      ctx.fillStyle = "rgba(255,255,255,0.16)"
      ctx.beginPath()
      ctx.moveTo(t0.sx - 9, t0.sy)
      ctx.lineTo(t1.sx + 9, t1.sy)
      ctx.lineTo(u1.sx + 9, u1.sy)
      ctx.lineTo(u0.sx - 9, u0.sy)
      ctx.closePath()
      ctx.fill()
      ctx.strokeStyle = "rgba(255,255,255,0.35)"
      ctx.lineWidth = 1
      for (let i = 1; i < 5; i++) {
        const yy0 = t0.sy + (u0.sy - t0.sy) * (i / 5)
        const yy1 = t1.sy + (u1.sy - t1.sy) * (i / 5)
        ctx.beginPath()
        ctx.moveTo(t0.sx - 9, yy0)
        ctx.lineTo(t1.sx + 9, yy1)
        ctx.stroke()
      }
      for (let i = 1; i < 10; i++) {
        const xx0 = t0.sx - 9 + (t1.sx - t0.sx + 18) * (i / 10)
        const xx1 = u0.sx - 9 + (u1.sx - u0.sx + 18) * (i / 10)
        ctx.beginPath()
        ctx.moveTo(xx0, t0.sy + (t1.sy - t0.sy) * (i / 10))
        ctx.lineTo(xx1, u0.sy + (u1.sy - u0.sy) * (i / 10))
        ctx.stroke()
      }
      // white tape + wooden posts
      ctx.strokeStyle = "#ffffff"
      ctx.lineWidth = 4
      ctx.beginPath()
      ctx.moveTo(u0.sx - 9, u0.sy)
      ctx.lineTo(u1.sx + 9, u1.sy)
      ctx.stroke()
      ctx.strokeStyle = "#8a6238"
      ctx.lineWidth = 4
      ctx.beginPath()
      ctx.moveTo(t0.sx - 9, t0.sy + 2)
      ctx.lineTo(u0.sx - 9, u0.sy - 4)
      ctx.moveTo(t1.sx + 9, t1.sy + 2)
      ctx.lineTo(u1.sx + 9, u1.sy - 4)
      ctx.stroke()
    }

    // near half
    const nearIdx: (0 | 1)[] = st.players[0][0].z >= st.players[0][1].z ? [0, 1] : [1, 0]
    nearIdx.forEach((i) => drawSidePlayer(0, i))
    if (st.ball.z <= NET_Z) drawBallNow()

    /* ── Overlays ── */
    const outlined = (text: string, x: number, y: number, size: number, fill: string) => {
      ctx.textAlign = "center"
      ctx.font = `900 ${size}px system-ui, sans-serif`
      ctx.lineWidth = size / 8
      ctx.strokeStyle = "rgba(0,0,0,0.55)"
      ctx.strokeText(text, x, y)
      ctx.fillStyle = fill
      ctx.fillText(text, x, y)
    }

    if (st.phase === "aim" && st.aimSide === 0) {
      ctx.fillStyle = "rgba(10,20,45,0.22)"
      ctx.fillRect(0, 0, VIEW.W, VIEW.H)
      const remain = Math.max(0, 1 - st.aimT / st.params[0].aimTime)
      ctx.fillStyle = "rgba(0,0,0,0.35)"
      ctx.beginPath()
      ctx.roundRect(58, 20, VIEW.W - 116, 12, 6)
      ctx.fill()
      ctx.fillStyle = ME_COLOR
      ctx.beginPath()
      ctx.roundRect(60, 22, (VIEW.W - 120) * remain, 8, 4)
      ctx.fill()
      outlined(st.isServe ? "SERVIZIO — TRASCINA E MIRA" : "TRASCINA E MIRA", VIEW.cx, 56, 16, "#ffffff")
    } else if (st.phase === "aim" && st.aimSide === 1) {
      outlined("La CPU attacca…", VIEW.cx, 48, 15, "rgba(255,255,255,0.9)")
    }

    if (st.phase === "point") {
      const mine = lastScorerRef.current === 0
      outlined(mine ? "PUNTO TUO! 🔥" : "PUNTO CPU", VIEW.cx, 120, 38, mine ? ME_COLOR : "#7db4ff")
    }

    if (flashRef.current > 0.02) {
      ctx.fillStyle = `rgba(255,255,255,${flashRef.current * 0.16})`
      ctx.fillRect(0, 0, VIEW.W, VIEW.H)
      flashRef.current *= 0.9
    }
  }, [])

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
