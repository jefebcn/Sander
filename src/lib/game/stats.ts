import type { GameParams } from "./engine"

/* ────────────────────────────────────────────────────────────────────────── */
/*  Card stats → gameplay parameters.                                          */
/*                                                                             */
/*  The whole point of the arcade mode: your SANDER card must be FELT in       */
/*  game. Every stat maps to a visible effect (see the formulas below).        */
/* ────────────────────────────────────────────────────────────────────────── */

/** Arcade-facing stats, each 0–99. */
export interface GameStats {
  velocita: number // horizontal speed
  potenza: number // spike power
  salto: number // jump height
  difesa: number // ball-contact radius
  controllo: number // reduces random deviation on touches
}

function clamp99(v: number): number {
  return Math.max(1, Math.min(99, Math.round(v)))
}

/**
 * Map a SANDER card (att/dif/ric/mur/alz/sta + Glicko) onto the five arcade
 * stats. potenza≈att, difesa≈(dif+ric)/2, salto≈mur, controllo≈sta,
 * velocità blends alzata with overall rating.
 */
export function cardToGameStats(card: {
  att: number
  dif: number
  ric: number
  mur: number
  alz: number
  sta: number
  rating: number
}): GameStats {
  const ratingNorm = clamp99((card.rating - 1000) / 10) // 1500 → 50
  return {
    velocita: clamp99(card.alz * 0.5 + ratingNorm * 0.5),
    potenza: clamp99(card.att),
    salto: clamp99(card.mur),
    difesa: clamp99((card.dif + card.ric) / 2),
    controllo: clamp99(card.sta),
  }
}

/** The tuning formulas from the spec — deliberately wide so stats are FELT. */
export function statsToParams(gs: GameStats): GameParams {
  return {
    moveSpeed: 220 + gs.velocita * 3,
    jumpVel: 380 + gs.salto * 4,
    spikeBoost: 1 + (gs.potenza / 100) * 0.8,
    hitRadius: 28 + gs.difesa * 0.25,
    control: gs.controllo / 99,
  }
}

/** A balanced guest card so the game is playable without an account. */
export const GUEST_STATS: GameStats = {
  velocita: 60,
  potenza: 60,
  salto: 60,
  difesa: 60,
  controllo: 60,
}

/** CPU stats scale with difficulty (1–5) so harder CPUs also FEEL stronger. */
export function cpuStatsForDifficulty(difficulty: number): GameStats {
  const base = [45, 55, 68, 80, 93][Math.max(1, Math.min(5, difficulty)) - 1]
  return { velocita: base, potenza: base, salto: base, difesa: base, controllo: base }
}
