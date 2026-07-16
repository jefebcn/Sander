/* ────────────────────────────────────────────────────────────────────────── */
/*  SANDER Arcade — "aim & rally" engine (Beach Volley Clash style).           */
/*                                                                             */
/*  Vertical pseudo-3D court: you at the bottom, opponent at the top.          */
/*  Players auto-run to receive; the interactive moment is AIMING the attack   */
/*  in slow-motion (drag a target on the opponent court, release to spike).    */
/*                                                                             */
/*  This module is PURE and deterministic: no DOM, no Date, no Math.random     */
/*  (seeded LCG in state). Fixed timestep. Rendering/input live elsewhere.     */
/* ────────────────────────────────────────────────────────────────────────── */

// ── Court (logical units) ────────────────────────────────────────────────────
export const COURT_W = 360
export const COURT_L = 480
export const NET_Z = COURT_L / 2 // side 0 (you) = z < NET_Z, side 1 = z > NET_Z
export const HOLD_Y = 120 // ball height while an attacker holds/aims
export const STEP = 1 / 60

const POINT_PAUSE = 1.15
const DIVE_MARGIN = 34 // beyond catchRadius, a dive can still save it
const DIVE_CHANCE = 0.55
const AIM_MARGIN_X = 26
const AIM_MARGIN_Z = 16
const AIM_NET_GAP = 22

// ── Types ────────────────────────────────────────────────────────────────────
export interface SideParams {
  runSpeed: number // auto-defense movement (units/s)
  catchRadius: number // receive reach
  shotSpeed: number // attack flight speed (units/s)
  arcHeight: number // attack arc apex (lower = flatter/meaner)
  aimTime: number // seconds of slow-mo aiming
  aimNoise: number // max scatter applied on release
}

export interface CpuProfile {
  noise: number // extra scatter on CPU aim
  delay: number // seconds the CPU "thinks" before releasing
  flub: number // chance the CPU drops a reachable ball
}

export interface PlayerPos {
  x: number
  z: number
  tx: number
  tz: number
}

export interface BallPos {
  x: number
  z: number
  y: number
}

interface Segment {
  x0: number
  z0: number
  y0: number
  x1: number
  z1: number
  y1: number
  h: number // arc apex added on top of the y-lerp
  T: number
  t: number
}

export type GamePhase = "aim" | "flight" | "point" | "over"
type OnLand = "resolve" | "toSet" | "toAim"

export interface GameEvent {
  type: "aim" | "serve" | "spike" | "receive" | "dive" | "point" | "over"
  side?: 0 | 1
}

export interface PlayerInput {
  aimX: number
  aimZ: number
  release: boolean
}

export interface GameState {
  players: [[PlayerPos, PlayerPos], [PlayerPos, PlayerPos]]
  ball: BallPos
  params: [SideParams, SideParams]
  cpu: CpuProfile

  phase: GamePhase
  phaseT: number

  // aim phase
  aimSide: 0 | 1
  aimX: number
  aimZ: number
  aimT: number
  isServe: boolean
  attackerIdx: [0 | 1, 0 | 1] // who holds/attacks per side
  cpuAimX: number
  cpuAimZ: number

  // flight phase
  seg: Segment | null
  onLand: OnLand
  segSide: 0 | 1 // attacking side of the current flight

  score: [number, number]
  target: number
  server: 0 | 1
  winner: 0 | 1 | null
  seed: number
}

// ── Seeded randomness ────────────────────────────────────────────────────────
function rand(state: GameState): number {
  state.seed = (state.seed * 1664525 + 1013904223) >>> 0
  return state.seed / 4294967296
}

function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v
}

function basePositions(side: 0 | 1): [PlayerPos, PlayerPos] {
  const z1 = side === 0 ? 80 : COURT_L - 80
  const z2 = side === 0 ? 165 : COURT_L - 165
  return [
    { x: 120, z: z1, tx: 120, tz: z1 },
    { x: 240, z: z2, tx: 240, tz: z2 },
  ]
}

/** Clamp an aim target inside the half attacked by `side`. */
export function clampAim(side: 0 | 1, x: number, z: number): { x: number; z: number } {
  const cx = clamp(x, AIM_MARGIN_X, COURT_W - AIM_MARGIN_X)
  const cz =
    side === 0
      ? clamp(z, NET_Z + AIM_NET_GAP, COURT_L - AIM_MARGIN_Z)
      : clamp(z, AIM_MARGIN_Z, NET_Z - AIM_NET_GAP)
  return { x: cx, z: cz }
}

function defaultAim(side: 0 | 1): { x: number; z: number } {
  return side === 0 ? { x: COURT_W / 2, z: NET_Z + 130 } : { x: COURT_W / 2, z: NET_Z - 130 }
}

// ── State construction ───────────────────────────────────────────────────────
export function createGameState(
  paramsA: SideParams,
  paramsB: SideParams,
  cpu: CpuProfile,
  target = 7,
  seed = 12345,
): GameState {
  const state: GameState = {
    players: [basePositions(0), basePositions(1)],
    ball: { x: COURT_W / 2, z: 20, y: HOLD_Y },
    params: [paramsA, paramsB],
    cpu,
    phase: "aim",
    phaseT: 0,
    aimSide: 0,
    aimX: 0,
    aimZ: 0,
    aimT: 0,
    isServe: true,
    attackerIdx: [0, 0],
    cpuAimX: 0,
    cpuAimZ: 0,
    seg: null,
    onLand: "resolve",
    segSide: 0,
    score: [0, 0],
    target,
    server: 0,
    winner: null,
    seed: seed >>> 0,
  }
  setupServe(state)
  return state
}

function setupServe(state: GameState): void {
  const s = state.server
  state.players = [basePositions(0), basePositions(1)]
  // the server stands at their baseline centre
  const srv = state.players[s][0]
  srv.x = COURT_W / 2
  srv.z = s === 0 ? 18 : COURT_L - 18
  srv.tx = srv.x
  srv.tz = srv.z
  state.attackerIdx[s] = 0
  state.ball = { x: srv.x, z: srv.z, y: HOLD_Y }
  enterAim(state, s, true)
}

function enterAim(state: GameState, side: 0 | 1, isServe: boolean): void {
  state.phase = "aim"
  state.aimSide = side
  state.aimT = 0
  state.isServe = isServe
  const d = defaultAim(side)
  state.aimX = d.x
  state.aimZ = d.z
  if (side === 1) chooseCpuAim(state)
}

/** CPU picks the candidate spot farthest from your players, plus noise. */
function chooseCpuAim(state: GameState): void {
  const candidates = [
    { x: 52, z: 42 },
    { x: COURT_W - 52, z: 42 },
    { x: 52, z: NET_Z - 44 },
    { x: COURT_W - 52, z: NET_Z - 44 },
    { x: COURT_W / 2, z: 120 },
  ]
  let best = candidates[0]
  let bestScore = -1
  for (const c of candidates) {
    let minD = Infinity
    for (const p of state.players[0]) {
      minD = Math.min(minD, Math.hypot(p.x - c.x, p.z - c.z))
    }
    if (minD > bestScore) {
      bestScore = minD
      best = c
    }
  }
  const n = state.cpu.noise
  const aimed = clampAim(
    1,
    best.x + (rand(state) - 0.5) * 2 * n,
    best.z + (rand(state) - 0.5) * 2 * n,
  )
  state.cpuAimX = aimed.x
  state.cpuAimZ = aimed.z
}

// ── Release: turn the aim into a ballistic flight ────────────────────────────
function release(state: GameState, events: GameEvent[]): void {
  const side = state.aimSide
  const prm = state.params[side]

  let { x: tx, z: tz } = clampAim(side, state.aimX, state.aimZ)
  if (side === 0) {
    // player scatter shrinks with the control stat
    const n = prm.aimNoise
    const aimed = clampAim(
      0,
      tx + (rand(state) - 0.5) * 2 * n,
      tz + (rand(state) - 0.5) * 2 * n,
    )
    tx = aimed.x
    tz = aimed.z
  }

  const b = state.ball
  const dist = Math.hypot(tx - b.x, tz - b.z, b.y)
  const speed = state.isServe ? prm.shotSpeed * 0.8 : prm.shotSpeed
  const T = clamp(dist / speed, 0.55, 1.6)
  const h = state.isServe ? prm.arcHeight + 50 : prm.arcHeight

  state.seg = { x0: b.x, z0: b.z, y0: b.y, x1: tx, z1: tz, y1: 0, h, T, t: 0 }
  state.onLand = "resolve"
  state.segSide = side
  state.phase = "flight"
  events.push({ type: state.isServe ? "serve" : "spike", side })

  // Defenders react: nearest runs to the landing spot, partner covers centre
  const D = (1 - side) as 0 | 1
  const dps = state.players[D]
  const d0 = Math.hypot(dps[0].x - tx, dps[0].z - tz)
  const d1 = Math.hypot(dps[1].x - tx, dps[1].z - tz)
  const nearest = d0 <= d1 ? 0 : 1
  dps[nearest].tx = tx
  dps[nearest].tz = tz
  const other = dps[1 - nearest]
  other.tx = COURT_W / 2
  other.tz = D === 0 ? NET_Z - 70 : NET_Z + 70
  state.attackerIdx[D] = nearest as 0 | 1 // receiver becomes the attacker
}

// ── Landing resolution ───────────────────────────────────────────────────────
function resolveLanding(state: GameState, events: GameEvent[]): void {
  const seg = state.seg!
  const D = (seg.z1 < NET_Z ? 0 : 1) as 0 | 1
  const prm = state.params[D]

  let nearestIdx: 0 | 1 = 0
  let best = Infinity
  for (let i = 0 as 0 | 1; i <= 1; i = (i + 1) as 0 | 1) {
    const p = state.players[D][i]
    const d = Math.hypot(p.x - seg.x1, p.z - seg.z1)
    if (d < best) {
      best = d
      nearestIdx = i
    }
  }
  const nearest = state.players[D][nearestIdx]
  state.attackerIdx[D] = nearestIdx // whoever received becomes the attacker

  let saved = false
  if (best <= prm.catchRadius) {
    saved = !(D === 1 && rand(state) < state.cpu.flub)
  } else if (best <= prm.catchRadius + DIVE_MARGIN) {
    saved = rand(state) < DIVE_CHANCE
    if (saved) events.push({ type: "dive", side: D })
  }

  if (!saved) {
    const scorer = (1 - D) as 0 | 1
    state.score[scorer] += 1
    state.server = scorer // rally point: the winner serves
    state.phase = "point"
    state.phaseT = POINT_PAUSE
    state.seg = null
    events.push({ type: "point", side: scorer })
    const s = state.score
    if (s[scorer] >= state.target && s[scorer] - s[D] >= 2) state.winner = scorer
    return
  }

  events.push({ type: "receive", side: D })

  // Bump toward the setter (the partner of the receiver)
  const setter = state.players[D][1 - nearestIdx]
  setter.tx = clamp(setter.x, 90, COURT_W - 90)
  setter.tz = D === 0 ? NET_Z - 70 : NET_Z + 70
  state.seg = {
    x0: seg.x1,
    z0: seg.z1,
    y0: 6,
    x1: setter.tx,
    z1: setter.tz,
    y1: 50,
    h: 95,
    T: 0.5,
    t: 0,
  }
  state.onLand = "toSet"
  nearest.tx = clamp(seg.x1, 60, COURT_W - 60) // receiver heads to the attack spot
  nearest.tz = D === 0 ? NET_Z - 40 : NET_Z + 40
}

// ── Step ─────────────────────────────────────────────────────────────────────
export function step(state: GameState, input: PlayerInput, dt: number): GameEvent[] {
  const events: GameEvent[] = []
  if (state.phase === "over") return events

  if (state.phase === "point") {
    state.phaseT -= dt
    if (state.phaseT <= 0) {
      if (state.winner !== null) {
        state.phase = "over"
        events.push({ type: "over", side: state.winner })
      } else {
        setupServe(state)
        events.push({ type: "aim", side: state.aimSide })
      }
    }
    return events
  }

  // Off-ball movement (slowed while YOU aim — the slow-mo moment)
  const moveDt = state.phase === "aim" && state.aimSide === 0 ? dt * 0.35 : dt
  for (let s = 0 as 0 | 1; s <= 1; s = (s + 1) as 0 | 1) {
    const speed = state.params[s].runSpeed
    for (const p of state.players[s]) {
      const dx = p.tx - p.x
      const dz = p.tz - p.z
      const d = Math.hypot(dx, dz)
      if (d > 1) {
        const stepLen = Math.min(d, speed * moveDt)
        p.x += (dx / d) * stepLen
        p.z += (dz / d) * stepLen
      }
    }
  }

  if (state.phase === "aim") {
    const side = state.aimSide
    // Ball hovers above the attacker (with a light bob)
    const att = state.players[side][state.attackerIdx[side]]
    state.ball.x = att.x
    state.ball.z = att.z
    state.ball.y = HOLD_Y + Math.sin(state.aimT * 6) * 6

    state.aimT += dt

    if (side === 0) {
      const aimed = clampAim(0, input.aimX, input.aimZ)
      state.aimX = aimed.x
      state.aimZ = aimed.z
      if (input.release || state.aimT >= state.params[0].aimTime) {
        release(state, events)
      }
    } else {
      state.aimX = state.cpuAimX
      state.aimZ = state.cpuAimZ
      if (state.aimT >= state.cpu.delay) release(state, events)
    }
    return events
  }

  // phase === "flight"
  const seg = state.seg
  if (!seg) return events
  seg.t += dt
  const u = Math.min(1, seg.t / seg.T)
  state.ball.x = seg.x0 + (seg.x1 - seg.x0) * u
  state.ball.z = seg.z0 + (seg.z1 - seg.z0) * u
  state.ball.y = seg.y0 + (seg.y1 - seg.y0) * u + seg.h * 4 * u * (1 - u)

  if (u >= 1) {
    if (state.onLand === "resolve") {
      resolveLanding(state, events)
    } else if (state.onLand === "toSet") {
      // Set: lift the ball above the attack spot near the net
      const D = (seg.z1 < NET_Z ? 0 : 1) as 0 | 1
      const att = state.players[D][state.attackerIdx[D]]
      state.seg = {
        x0: seg.x1,
        z0: seg.z1,
        y0: seg.y1,
        x1: clamp(att.tx, 60, COURT_W - 60),
        z1: D === 0 ? NET_Z - 40 : NET_Z + 40,
        y1: HOLD_Y,
        h: 55,
        T: 0.6,
        t: 0,
      }
      state.onLand = "toAim"
    } else {
      // Ball reaches the attacker's hands → their aim turn begins
      const D = (seg.z1 < NET_Z ? 0 : 1) as 0 | 1
      state.seg = null
      enterAim(state, D, false)
      events.push({ type: "aim", side: D })
    }
  }

  return events
}
