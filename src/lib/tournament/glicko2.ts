/**
 * Glicko-2 Rating Algorithm
 *
 * Implements the full Glicko-2 system as described by Mark Glickman (2012).
 * Superior to Elo for sports with variable play frequency because it tracks:
 *   - Rating (r): estimated skill level
 *   - Rating Deviation (RD): uncertainty of the rating
 *   - Volatility (σ): consistency of performance
 *
 * Ratings start at 1500 with RD=350 and σ=0.06.
 * The display scale maps to 2.0–8.0 (similar to DUPR in pickleball).
 */

const SCALE = 173.7178   // Glicko-2 internal scale factor
const TAU   = 0.5        // System constant — controls volatility change speed

export interface Glicko2Player {
  rating:     number  // default 1500
  rd:         number  // Rating Deviation, default 350
  volatility: number  // default 0.06
}

export interface MatchResult {
  opponent: Glicko2Player
  score:    number  // 1 = win, 0.5 = draw, 0 = loss
}

// ─── Internal helpers ────────────────────────────────────────────────────────

function toScale(p: Glicko2Player) {
  return { mu: (p.rating - 1500) / SCALE, phi: p.rd / SCALE, sigma: p.volatility }
}

function fromScale(mu: number, phi: number, sigma: number): Glicko2Player {
  return { rating: mu * SCALE + 1500, rd: phi * SCALE, volatility: sigma }
}

// g(φ) — reduces the impact of high-uncertainty opponents
function g(phi: number): number {
  return 1 / Math.sqrt(1 + (3 * phi * phi) / (Math.PI * Math.PI))
}

// E(μ, μ_j, φ_j) — expected outcome against opponent j
function E(mu: number, mu_j: number, phi_j: number): number {
  return 1 / (1 + Math.exp(-g(phi_j) * (mu - mu_j)))
}

// ─── Core update ─────────────────────────────────────────────────────────────

/**
 * Update a player's Glicko-2 rating after a period of results.
 * Call once per rating period (e.g. after each session).
 * If results is empty, only RD increases (rating uncertainty grows with inactivity).
 */
export function updateRating(
  player:  Glicko2Player,
  results: MatchResult[],
): Glicko2Player {
  const { mu, phi, sigma } = toScale(player)

  // No games played — increase RD to reflect growing uncertainty
  if (results.length === 0) {
    const phi_star = Math.sqrt(phi * phi + sigma * sigma)
    return fromScale(mu, Math.min(phi_star, 350 / SCALE), sigma)
  }

  // Step 3 — compute estimated variance v
  let v_inv = 0
  for (const r of results) {
    const { mu: mj, phi: pj } = toScale(r.opponent)
    const gj = g(pj)
    const ej = E(mu, mj, pj)
    v_inv += gj * gj * ej * (1 - ej)
  }
  const v = 1 / v_inv

  // Step 4 — compute estimated improvement delta
  let delta_sum = 0
  for (const r of results) {
    const { mu: mj, phi: pj } = toScale(r.opponent)
    const gj = g(pj)
    const ej = E(mu, mj, pj)
    delta_sum += gj * (r.score - ej)
  }
  const delta = v * delta_sum

  // Step 5 — update volatility via Illinois root-finding algorithm
  const a     = Math.log(sigma * sigma)
  const tau2  = TAU * TAU
  const delta2 = delta * delta
  const phi2   = phi * phi

  function f(x: number): number {
    const ex = Math.exp(x)
    const num = ex * (delta2 - phi2 - v - ex)
    const den = 2 * Math.pow(phi2 + v + ex, 2)
    return num / den - (x - a) / tau2
  }

  let A = a
  let B = delta2 > phi2 + v
    ? Math.log(delta2 - phi2 - v)
    : (() => {
        let k = 1
        while (f(a - k * TAU) < 0) k++
        return a - k * TAU
      })()

  let fA = f(A)
  let fB = f(B)

  for (let i = 0; i < 100 && Math.abs(B - A) > 1e-6; i++) {
    const C  = A + ((A - B) * fA) / (fB - fA)
    const fC = f(C)
    if (fC * fB <= 0) { A = B; fA = fB }
    else              { fA /= 2 }
    B = C; fB = fC
  }

  const sigma_prime = Math.exp(A / 2)

  // Step 6 — pre-rating-period RD
  const phi_star = Math.sqrt(phi2 + sigma_prime * sigma_prime)

  // Step 7 — new phi and mu
  const phi_prime = 1 / Math.sqrt(1 / (phi_star * phi_star) + 1 / v)
  const mu_prime  = mu + phi_prime * phi_prime * delta_sum

  return fromScale(mu_prime, phi_prime, sigma_prime)
}

// ─── Display helpers ─────────────────────────────────────────────────────────

/**
 * Map internal Glicko-2 rating (1500 base, ~600–2400 range) to
 * a 2.0–8.0 display scale similar to DUPR in pickleball.
 *
 * 1500 → 5.0 (average)
 *  600 → 2.0 (beginner)
 * 2400 → 8.0 (elite)
 */
export function ratingToDisplayLevel(rating: number): string {
  const level = 2 + ((rating - 600) / 1800) * 6
  return Math.max(2, Math.min(8, level)).toFixed(1)
}

/** Badge types — matches the Prisma BadgeType enum */
export const BADGE_LABELS: Record<string, string> = {
  MURO_IMPENETRABILE:  "Muro impenetrabile",
  DIFESA_ACROBATICA:   "Difesa acrobatica",
  LEADER_CARISMATICO:  "Leader carismatico",
  SCHIACCIATA_POTENTE: "Schiacciata potente",
  SERVIZIO_PRECISO:    "Servizio preciso",
  SPIRITO_DI_SQUADRA:  "Spirito di squadra",
  MVP_PARTITA:         "MVP della partita",
  FAIR_PLAY:           "Fair play",
}

export const BADGE_EMOJIS: Record<string, string> = {
  MURO_IMPENETRABILE:  "🧱",
  DIFESA_ACROBATICA:   "🤸",
  LEADER_CARISMATICO:  "⚡",
  SCHIACCIATA_POTENTE: "💥",
  SERVIZIO_PRECISO:    "🎯",
  SPIRITO_DI_SQUADRA:  "🤝",
  MVP_PARTITA:         "🏆",
  FAIR_PLAY:           "🫱",
}
