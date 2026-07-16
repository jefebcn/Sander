import { describe, it, expect } from "vitest"
import {
  createGameState,
  step,
  clampAim,
  STEP,
  NET_Z,
  COURT_L,
  COURT_W,
  type GameState,
  type SideParams,
  type CpuProfile,
  type PlayerInput,
  type GameEvent,
} from "./engine"

function params(overrides: Partial<SideParams> = {}): SideParams {
  return {
    runSpeed: 220,
    catchRadius: 56,
    shotSpeed: 480,
    arcHeight: 100,
    aimTime: 2,
    aimNoise: 0, // deterministic aim in tests
    ...overrides,
  }
}

const CPU_TEST: CpuProfile = { noise: 0, delay: 0.3, flub: 0 }

const IDLE: PlayerInput = { aimX: COURT_W / 2, aimZ: NET_Z + 130, release: false }

function fresh(target = 7, seed = 42): GameState {
  return createGameState(params(), params(), CPU_TEST, target, seed)
}

function tick(state: GameState, input: PlayerInput, n = 1): GameEvent[] {
  const events: GameEvent[] = []
  for (let i = 0; i < n; i++) events.push(...step(state, input, STEP))
  return events
}

describe("engine — aim & flight", () => {
  it("starts with you serving (aim phase, side 0)", () => {
    const s = fresh()
    expect(s.phase).toBe("aim")
    expect(s.aimSide).toBe(0)
    expect(s.isServe).toBe(true)
  })

  it("release starts a flight that lands where aimed", () => {
    const s = fresh()
    const events = tick(s, { aimX: 300, aimZ: 420, release: true })
    expect(events.some((e) => e.type === "serve")).toBe(true)
    expect(s.phase).toBe("flight")
    // run the whole flight
    tick(s, IDLE, 200)
    // ball resolved at the aimed spot (aimNoise = 0)
    expect(s.seg === null || s.phase !== "flight").toBe(true)
  })

  it("auto-releases when the aim timer runs out", () => {
    const s = fresh()
    tick(s, IDLE, Math.ceil((params().aimTime + 0.1) / STEP))
    expect(s.phase).toBe("flight")
  })

  it("clamps the aim inside the attacked half", () => {
    const a = clampAim(0, -50, 9999)
    expect(a.x).toBeGreaterThan(0)
    expect(a.z).toBeGreaterThan(NET_Z)
    expect(a.z).toBeLessThan(COURT_L)
    const b = clampAim(1, 9999, -50)
    expect(b.x).toBeLessThan(COURT_W)
    expect(b.z).toBeLessThan(NET_Z)
    expect(b.z).toBeGreaterThan(0)
  })

  it("is deterministic for the same seed and inputs", () => {
    const a = fresh(7, 7)
    const b = fresh(7, 7)
    tick(a, { aimX: 100, aimZ: 300, release: true }, 400)
    tick(b, { aimX: 100, aimZ: 300, release: true }, 400)
    expect(a.ball).toEqual(b.ball)
    expect(a.score).toEqual(b.score)
    expect(a.phase).toBe(b.phase)
  })
})

describe("engine — receive vs point", () => {
  it("a defender standing on the landing spot receives the ball", () => {
    const s = fresh()
    // park a CPU defender exactly where we'll aim
    s.players[1][0] = { x: 300, z: 420, tx: 300, tz: 420 }
    s.players[1][1] = { x: 60, z: 300, tx: 60, tz: 300 }
    const events = tick(s, { aimX: 300, aimZ: 420, release: true }, 200)
    expect(events.some((e) => e.type === "receive" && e.side === 1)).toBe(true)
    expect(s.score).toEqual([0, 0])
  })

  it("nobody close → point for the attacker (winner serves next)", () => {
    const s = fresh()
    // both CPU defenders far away from the target corner
    s.players[1][0] = { x: 40, z: 460, tx: 40, tz: 460 }
    s.players[1][1] = { x: 40, z: 440, tx: 40, tz: 440 }
    // slow their reaction so they can't cover the distance
    s.params[1].runSpeed = 10
    const events = tick(s, { aimX: 320, aimZ: 270, release: true }, 200)
    expect(events.some((e) => e.type === "point" && e.side === 0)).toBe(true)
    expect(s.score).toEqual([1, 0])
    expect(s.server).toBe(0)
  })

  it("win requires target points AND a 2-point margin", () => {
    const s = fresh(7)
    s.score = [6, 5]
    s.players[1][0] = { x: 40, z: 460, tx: 40, tz: 460 }
    s.players[1][1] = { x: 40, z: 440, tx: 40, tz: 440 }
    s.params[1].runSpeed = 10
    tick(s, { aimX: 320, aimZ: 270, release: true }, 200)
    expect(s.score).toEqual([7, 5])
    expect(s.winner).toBe(0)
    tick(s, IDLE, 90) // pause elapses → over
    expect(s.phase).toBe("over")
  })

  it("6-6 → 7-6 keeps playing (no margin)", () => {
    const s = fresh(7)
    s.score = [6, 6]
    s.players[1][0] = { x: 40, z: 460, tx: 40, tz: 460 }
    s.players[1][1] = { x: 40, z: 440, tx: 40, tz: 440 }
    s.params[1].runSpeed = 10
    tick(s, { aimX: 320, aimZ: 270, release: true }, 200)
    expect(s.score).toEqual([7, 6])
    expect(s.winner).toBeNull()
    tick(s, IDLE, 90)
    expect(s.phase).toBe("aim") // new serve
  })

  it("after a CPU receive the rally comes back (CPU aims and attacks)", () => {
    const s = fresh()
    s.players[1][0] = { x: 300, z: 420, tx: 300, tz: 420 }
    const events = tick(s, { aimX: 300, aimZ: 420, release: true }, 600)
    // CPU received, built the attack and eventually spiked back
    expect(events.some((e) => e.type === "aim" && e.side === 1)).toBe(true)
    expect(events.some((e) => e.type === "spike" && e.side === 1)).toBe(true)
  })
})
