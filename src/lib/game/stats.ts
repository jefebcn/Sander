import type { SideParams, CpuProfile } from "./engine"

/* ────────────────────────────────────────────────────────────────────────── */
/*  Card stats → gameplay parameters (aim & rally engine).                     */
/*                                                                             */
/*  Every stat maps to a FELT effect:                                          */
/*  velocità → how far your auto-defense reaches in time                       */
/*  difesa   → receive radius                                                  */
/*  potenza  → spike speed (harder to defend)                                  */
/*  salto    → flatter attack arc (arrives sooner)                             */
/*  controllo→ longer slow-mo aim + less scatter on release                    */
/* ────────────────────────────────────────────────────────────────────────── */

/** Arcade-facing stats, each 0–99. */
export interface GameStats {
  velocita: number
  potenza: number
  salto: number
  difesa: number
  controllo: number
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

/** Tuning formulas — deliberately wide so stats are FELT in play. */
export function statsToParams(gs: GameStats): SideParams {
  return {
    runSpeed: 120 + gs.velocita * 1.6,
    catchRadius: 26 + gs.difesa * 0.5,
    shotSpeed: 280 + gs.potenza * 3.4,
    arcHeight: 150 - gs.salto * 0.9,
    aimTime: 1.3 + (gs.controllo / 99) * 1.4,
    aimNoise: 8 + (1 - gs.controllo / 99) * 48,
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

/** CPU brain profile: difficulty scales aim precision, thinking time and
 *  drop chance — never the physics. */
export function cpuProfileForDifficulty(difficulty: number): CpuProfile {
  const i = Math.max(1, Math.min(5, difficulty)) - 1
  return {
    noise: [70, 52, 36, 22, 10][i],
    delay: [1.0, 0.85, 0.7, 0.55, 0.4][i],
    flub: [0.25, 0.17, 0.1, 0.05, 0.02][i],
  }
}
