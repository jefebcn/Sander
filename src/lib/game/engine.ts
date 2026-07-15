/* ────────────────────────────────────────────────────────────────────────── */
/*  SANDER Arcade — pure game engine.                                          */
/*                                                                             */
/*  Side-view 1v1 beach volley (slime-style). This module is PURE and          */
/*  deterministic: no DOM, no Date, no Math.random (seeded LCG in state).      */
/*  All physics run on a fixed timestep so behaviour never depends on the      */
/*  frame rate. Rendering, input and AI live elsewhere.                        */
/* ────────────────────────────────────────────────────────────────────────── */

// ── Field & physics constants (logical units = px on an 800×450 court) ──────
export const FIELD_W = 800
export const FIELD_H = 450
export const GROUND_Y = 400
export const NET_X = FIELD_W / 2
export const NET_TOP = GROUND_Y - 130
export const NET_HALF_W = 4
export const GRAVITY = 1400
export const BALL_R = 12
export const PLAYER_BODY = 34 // visual dome radius
export const STEP = 1 / 60 // fixed timestep (s)

const BOUNCE = 0.78
const NET_BOUNCE = 0.6
const MAX_BALL_SPEED = 1300
const TOUCH_SPEED = 520
const SPIKE_SPEED = 760
const POINT_PAUSE = 1.15 // seconds frozen after a point
const HIT_CENTER_DY = 24 // hit-circle centre sits this far above the feet

// Home/serve positions per side
const HOME_X: [number, number] = [200, 600]
const SERVE_X: [number, number] = [160, 640]
const SERVE_BALL_Y = 140

// ── Types ────────────────────────────────────────────────────────────────────
export interface GameParams {
  moveSpeed: number // px/s horizontal
  jumpVel: number // initial jump velocity (px/s, upward)
  spikeBoost: number // multiplier on spike speed
  hitRadius: number // ball-contact radius
  control: number // 0..1 — reduces random deviation on touches
}

export interface PlayerState {
  x: number
  y: number // FEET y (GROUND_Y when standing)
  vy: number
  onGround: boolean
}

export interface BallState {
  x: number
  y: number
  vx: number
  vy: number
}

export interface Inputs {
  left: boolean
  right: boolean
  jump: boolean
  spike: boolean
}

export type GamePhase = "rally" | "point" | "over"

export interface GameEvent {
  type: "touch" | "spike" | "bounce" | "point" | "over"
  side?: 0 | 1 // for touch/spike: who hit; for point/over: who scored/won
}

export interface GameState {
  ball: BallState
  players: [PlayerState, PlayerState]
  params: [GameParams, GameParams]
  score: [number, number]
  target: number // points to win (win by 2)
  server: 0 | 1 // side that serves the next rally
  phase: GamePhase
  phaseT: number // countdown inside "point" phase
  winner: 0 | 1 | null
  lastTouch: 0 | 1 | null
  seed: number // LCG state — keeps the engine deterministic
}

export const NO_INPUT: Inputs = { left: false, right: false, jump: false, spike: false }

// ── Seeded randomness (deterministic) ───────────────────────────────────────
function rand(state: GameState): number {
  state.seed = (state.seed * 1664525 + 1013904223) >>> 0
  return state.seed / 4294967296
}

// ── State construction ───────────────────────────────────────────────────────
export function createGameState(
  paramsA: GameParams,
  paramsB: GameParams,
  target = 7,
  seed = 12345,
): GameState {
  const state: GameState = {
    ball: { x: SERVE_X[0], y: SERVE_BALL_Y, vx: 0, vy: 0 },
    players: [
      { x: HOME_X[0], y: GROUND_Y, vy: 0, onGround: true },
      { x: HOME_X[1], y: GROUND_Y, vy: 0, onGround: true },
    ],
    params: [paramsA, paramsB],
    score: [0, 0],
    target,
    server: 0,
    phase: "rally",
    phaseT: 0,
    winner: null,
    lastTouch: null,
    seed: seed >>> 0,
  }
  resetRally(state)
  return state
}

function resetRally(state: GameState): void {
  state.players[0] = { x: HOME_X[0], y: GROUND_Y, vy: 0, onGround: true }
  state.players[1] = { x: HOME_X[1], y: GROUND_Y, vy: 0, onGround: true }
  state.ball = { x: SERVE_X[state.server], y: SERVE_BALL_Y, vx: 0, vy: 0 }
  state.lastTouch = null
  state.phase = "rally"
  state.phaseT = 0
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v
}

/** Where the ball will land (x), ignoring future bounces. Used by AI + shadow. */
export function predictLandingX(ball: BallState): number {
  const drop = GROUND_Y - BALL_R - ball.y
  if (drop <= 0) return clamp(ball.x, 0, FIELD_W)
  const t = (-ball.vy + Math.sqrt(ball.vy * ball.vy + 2 * GRAVITY * drop)) / GRAVITY
  let x = ball.x + ball.vx * t
  // one wall reflection is enough for readability
  if (x < BALL_R) x = 2 * BALL_R - x
  if (x > FIELD_W - BALL_R) x = 2 * (FIELD_W - BALL_R) - x
  return clamp(x, 0, FIELD_W)
}

// ── The step function (fixed dt, mutates state, returns events) ─────────────
export function step(
  state: GameState,
  inputA: Inputs,
  inputB: Inputs,
  dt: number,
): GameEvent[] {
  const events: GameEvent[] = []

  if (state.phase === "over") return events

  // Frozen pause between points
  if (state.phase === "point") {
    state.phaseT -= dt
    if (state.phaseT <= 0) {
      if (state.winner !== null) {
        state.phase = "over"
        events.push({ type: "over", side: state.winner })
      } else {
        resetRally(state)
      }
    }
    return events
  }

  const inputs: [Inputs, Inputs] = [inputA, inputB]

  // ── Players ────────────────────────────────────────────────────────────
  for (let i = 0 as 0 | 1; i <= 1; i = (i + 1) as 0 | 1) {
    const p = state.players[i]
    const prm = state.params[i]
    const inp = inputs[i]

    let dir = 0
    if (inp.left) dir -= 1
    if (inp.right) dir += 1
    p.x += dir * prm.moveSpeed * dt

    if (inp.jump && p.onGround) {
      p.vy = -prm.jumpVel
      p.onGround = false
    }
    p.vy += GRAVITY * dt
    p.y += p.vy * dt
    if (p.y >= GROUND_Y) {
      p.y = GROUND_Y
      p.vy = 0
      p.onGround = true
    }

    // Each player stays on their side of the net
    const margin = PLAYER_BODY * 0.7
    if (i === 0) p.x = clamp(p.x, margin, NET_X - NET_HALF_W - margin)
    else p.x = clamp(p.x, NET_X + NET_HALF_W + margin, FIELD_W - margin)
  }

  // ── Ball physics ───────────────────────────────────────────────────────
  const b = state.ball
  b.vy += GRAVITY * dt
  b.x += b.vx * dt
  b.y += b.vy * dt

  // Walls
  if (b.x < BALL_R) {
    b.x = BALL_R
    b.vx = Math.abs(b.vx) * BOUNCE
    events.push({ type: "bounce" })
  } else if (b.x > FIELD_W - BALL_R) {
    b.x = FIELD_W - BALL_R
    b.vx = -Math.abs(b.vx) * BOUNCE
    events.push({ type: "bounce" })
  }
  // Ceiling
  if (b.y < BALL_R) {
    b.y = BALL_R
    b.vy = Math.abs(b.vy) * BOUNCE
  }

  // Net (circle vs rect)
  {
    const cx = clamp(b.x, NET_X - NET_HALF_W, NET_X + NET_HALF_W)
    const cy = clamp(b.y, NET_TOP, GROUND_Y)
    const dx = b.x - cx
    const dy = b.y - cy
    if (dx * dx + dy * dy < BALL_R * BALL_R) {
      if (b.y < NET_TOP) {
        // hit the tape — bounce up
        b.y = NET_TOP - BALL_R
        b.vy = -Math.abs(b.vy) * NET_BOUNCE
      } else if (b.x < NET_X) {
        b.x = NET_X - NET_HALF_W - BALL_R
        b.vx = -Math.abs(b.vx) * NET_BOUNCE
      } else {
        b.x = NET_X + NET_HALF_W + BALL_R
        b.vx = Math.abs(b.vx) * NET_BOUNCE
      }
      events.push({ type: "bounce" })
    }
  }

  // ── Player-ball contact ────────────────────────────────────────────────
  for (let i = 0 as 0 | 1; i <= 1; i = (i + 1) as 0 | 1) {
    const p = state.players[i]
    const prm = state.params[i]
    const cx = p.x
    const cy = p.y - HIT_CENTER_DY
    const dx = b.x - cx
    const dy = b.y - cy
    const reach = prm.hitRadius + BALL_R
    if (dx * dx + dy * dy >= reach * reach) continue

    const dist = Math.sqrt(dx * dx + dy * dy) || 1
    let nx = dx / dist
    let ny = dy / dist
    if (dist < 0.001) {
      nx = 0
      ny = -1
    }

    const spiking = inputs[i].spike && !p.onGround
    let speed: number

    if (spiking) {
      // Spike: fast, flat, down-forward toward the opponent court
      const fwd = i === 0 ? 1 : -1
      const sx = fwd * 0.74
      const sy = 0.67
      const len = Math.hypot(sx, sy)
      nx = sx / len
      ny = sy / len
      speed = SPIKE_SPEED * prm.spikeBoost
      events.push({ type: "spike", side: i })
    } else {
      // Normal touch: reflect away, guaranteed upward arc
      ny = Math.min(ny, -0.35)
      const len = Math.hypot(nx, ny) || 1
      nx /= len
      ny /= len
      speed = Math.max(TOUCH_SPEED, Math.hypot(b.vx, b.vy) * 0.85)
      events.push({ type: "touch", side: i })
    }

    // Control stat dampens the random deviation on contact
    const jitter = (rand(state) - 0.5) * 0.55 * (1 - prm.control)
    const cos = Math.cos(jitter)
    const sin = Math.sin(jitter)
    const rx = nx * cos - ny * sin
    const ry = nx * sin + ny * cos

    b.vx = rx * speed
    b.vy = ry * speed
    // Push the ball out of the contact circle so it doesn't stick
    b.x = cx + rx * (reach + 1)
    b.y = cy + ry * (reach + 1)
    state.lastTouch = i
  }

  // Speed cap keeps rallies playable
  {
    const sp = Math.hypot(b.vx, b.vy)
    if (sp > MAX_BALL_SPEED) {
      b.vx = (b.vx / sp) * MAX_BALL_SPEED
      b.vy = (b.vy / sp) * MAX_BALL_SPEED
    }
  }

  // ── Ground → point ─────────────────────────────────────────────────────
  if (b.y + BALL_R >= GROUND_Y) {
    b.y = GROUND_Y - BALL_R
    b.vy = -Math.abs(b.vy) * 0.4

    const conceding: 0 | 1 = b.x < NET_X ? 0 : 1
    const scorer: 0 | 1 = conceding === 0 ? 1 : 0
    state.score[scorer] += 1
    state.server = conceding
    state.phase = "point"
    state.phaseT = POINT_PAUSE
    events.push({ type: "point", side: scorer })

    const s = state.score
    if (s[scorer] >= state.target && s[scorer] - s[conceding] >= 2) {
      state.winner = scorer
    }
  }

  return events
}
