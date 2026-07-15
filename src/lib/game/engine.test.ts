import { describe, it, expect } from "vitest"
import {
  createGameState,
  step,
  predictLandingX,
  NO_INPUT,
  GROUND_Y,
  NET_X,
  NET_HALF_W,
  BALL_R,
  STEP,
  type GameParams,
  type GameState,
} from "./engine"

function params(overrides: Partial<GameParams> = {}): GameParams {
  return {
    moveSpeed: 400,
    jumpVel: 600,
    spikeBoost: 1.4,
    hitRadius: 42,
    control: 0.6,
    ...overrides,
  }
}

function freshState(target = 7): GameState {
  return createGameState(params(), params(), target, 42)
}

function tick(state: GameState, n = 1) {
  const events = []
  for (let i = 0; i < n; i++) events.push(...step(state, NO_INPUT, NO_INPUT, STEP))
  return events
}

describe("engine — physics", () => {
  it("gravity pulls the ball down", () => {
    const s = freshState()
    const y0 = s.ball.y
    tick(s, 5)
    expect(s.ball.vy).toBeGreaterThan(0)
    expect(s.ball.y).toBeGreaterThan(y0)
  })

  it("is deterministic for the same seed and inputs", () => {
    const a = freshState()
    const b = freshState()
    tick(a, 300)
    tick(b, 300)
    expect(a.ball).toEqual(b.ball)
    expect(a.score).toEqual(b.score)
  })

  it("players cannot cross the net", () => {
    const s = freshState()
    for (let i = 0; i < 240; i++) {
      step(s, { left: false, right: true, jump: false, spike: false }, NO_INPUT, STEP)
    }
    expect(s.players[0].x).toBeLessThan(NET_X - NET_HALF_W)
    for (let i = 0; i < 240; i++) {
      step(s, NO_INPUT, { left: true, right: false, jump: false, spike: false }, STEP)
    }
    expect(s.players[1].x).toBeGreaterThan(NET_X + NET_HALF_W)
  })

  it("a higher jump stat reaches visibly higher", () => {
    function apex(jumpVel: number): number {
      const s = createGameState(params({ jumpVel }), params(), 7, 1)
      let minY = GROUND_Y
      // hold jump, track the apex of the first jump
      for (let i = 0; i < 120; i++) {
        step(s, { left: false, right: false, jump: true, spike: false }, NO_INPUT, STEP)
        minY = Math.min(minY, s.players[0].y)
      }
      return minY
    }
    const low = apex(380 + 40 * 4)
    const high = apex(380 + 95 * 4)
    expect(high).toBeLessThan(low - 60) // clearly higher, not marginal
  })
})

describe("engine — scoring", () => {
  function landBall(s: GameState, x: number) {
    s.ball = { x, y: GROUND_Y - BALL_R - 2, vx: 0, vy: 300 }
    return tick(s, 2)
  }

  it("ball landing on the left gives the point to the right player", () => {
    const s = freshState()
    const events = landBall(s, 100)
    expect(s.score).toEqual([0, 1])
    expect(s.phase).toBe("point")
    expect(s.server).toBe(0) // conceding side serves next
    expect(events.some((e) => e.type === "point" && e.side === 1)).toBe(true)
  })

  it("reaching the target with a 2-point margin wins the match", () => {
    const s = freshState(7)
    s.score = [6, 0]
    landBall(s, 700) // lands right → point to player 0 → 7-0
    expect(s.winner).toBe(0)
    // after the pause the phase becomes "over"
    tick(s, 90)
    expect(s.phase).toBe("over")
  })

  it("no win without the 2-point margin (6-6 → 7-6 keeps playing)", () => {
    const s = freshState(7)
    s.score = [6, 6]
    landBall(s, 700)
    expect(s.score).toEqual([7, 6])
    expect(s.winner).toBeNull()
    tick(s, 90) // pause elapses → new rally
    expect(s.phase).toBe("rally")
  })
})

describe("engine — landing prediction", () => {
  it("predicts straight-down landing at the same x", () => {
    const x = predictLandingX({ x: 300, y: 100, vx: 0, vy: 0 })
    expect(Math.abs(x - 300)).toBeLessThan(1)
  })

  it("moving ball lands ahead of its position", () => {
    const x = predictLandingX({ x: 300, y: 100, vx: 200, vy: 0 })
    expect(x).toBeGreaterThan(350)
  })
})
