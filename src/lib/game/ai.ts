import {
  FIELD_W,
  NET_X,
  GROUND_Y,
  predictLandingX,
  type GameState,
  type Inputs,
} from "./engine"

/* ────────────────────────────────────────────────────────────────────────── */
/*  CPU brain (right side, index 1).                                           */
/*                                                                             */
/*  Never superhuman: difficulty scales REACTION TIME and AIM ERROR, not       */
/*  physics. Level 1 is slow and sloppy; level 5 is sharp but still bound by   */
/*  the same movement/jump limits as a player with the same card.              */
/* ────────────────────────────────────────────────────────────────────────── */

export interface AiMemory {
  targetX: number
  sinceThink: number
  spikeIntent: boolean
}

export function createAiMemory(): AiMemory {
  return { targetX: 620, sinceThink: 99, spikeIntent: false }
}

interface DifficultyProfile {
  reactionDelay: number // s between target re-evaluations
  aimError: number // px of noise on the predicted landing spot
  spikeProb: number // chance the CPU commits to spiking a rally
}

const PROFILES: DifficultyProfile[] = [
  { reactionDelay: 0.42, aimError: 70, spikeProb: 0.35 },
  { reactionDelay: 0.3, aimError: 46, spikeProb: 0.5 },
  { reactionDelay: 0.2, aimError: 28, spikeProb: 0.65 },
  { reactionDelay: 0.12, aimError: 14, spikeProb: 0.82 },
  { reactionDelay: 0.07, aimError: 7, spikeProb: 0.95 },
]

const HOME_X = 620

/** Compute the CPU's inputs for this frame. (AI noise uses Math.random —
 *  it lives outside the deterministic engine on purpose.) */
export function cpuInput(
  state: GameState,
  mem: AiMemory,
  difficulty: number,
  dt: number,
): Inputs {
  const prof = PROFILES[Math.max(1, Math.min(5, difficulty)) - 1]
  const p = state.players[1]
  const b = state.ball

  // Re-think only after the reaction delay — this is what makes low levels beatable
  mem.sinceThink += dt
  if (mem.sinceThink >= prof.reactionDelay) {
    mem.sinceThink = 0
    const incoming = b.x > NET_X - 60 || b.vx > 40
    if (incoming) {
      const landing = predictLandingX(b)
      const noisy = landing + (Math.random() - 0.5) * 2 * prof.aimError
      mem.targetX = Math.max(NET_X + 50, Math.min(FIELD_W - 40, noisy))
      // stand slightly behind the ball so contact pushes it forward (toward the net)
      mem.targetX += 14
      mem.spikeIntent = Math.random() < prof.spikeProb
    } else {
      mem.targetX = HOME_X
      mem.spikeIntent = false
    }
  }

  const dx = mem.targetX - p.x
  const left = dx < -8
  const right = dx > 8

  const ballClose = Math.abs(b.x - p.x) < 74
  const ballAbove = b.y < p.y - 80 && b.y > 60
  const jump = p.onGround && ballClose && ballAbove && b.vy > -80

  const spike =
    mem.spikeIntent &&
    !p.onGround &&
    Math.abs(b.x - p.x) < 60 &&
    b.y < p.y - 30 &&
    b.y < GROUND_Y - 150

  return { left, right, jump, spike }
}
