/**
 * Pairing rules (pure — no DB imports).
 *
 * Fixed-pair formats (classic, double elimination, round robin) pair
 * consecutive players in seed order: seeds 1+2 are the first pair, 3+4 the
 * second… Pairs that signed up together sit side by side; players who signed
 * up alone are paired by the organiser (by hand, at random, or mixed).
 */
import { holdsSeat, PAIR_FORMATS } from "./capacity"

interface Seeded {
  seedPosition: number | null
  createdAt: Date | string
}

/** The players who will play: no spectators, no cancelled/refunded rows. */
export function playingRegistrations<T extends { paymentStatus: string; isSpectator: boolean }>(regs: T[]): T[] {
  return regs.filter(holdsSeat)
}

/** Seed order, then sign-up order for anyone without a seed yet. */
export function pairingOrder<T extends Seeded>(regs: T[]): T[] {
  const t = (d: Date | string) => new Date(d).getTime()
  return [...regs].sort(
    (a, b) => (a.seedPosition ?? Infinity) - (b.seedPosition ?? Infinity) || t(a.createdAt) - t(b.createdAt),
  )
}

export function isPairFormat(type: string): boolean {
  return (PAIR_FORMATS as readonly string[]).includes(type)
}

/** Why the tournament can't start with this many players, in Italian; null when it can. */
export function startProblem(type: string, players: number): string | null {
  if (isPairFormat(type)) {
    if (players < 4) return "Servono almeno 2 coppie (4 giocatori) per iniziare."
    if (players % 2 !== 0) return "Numero dispari di giocatori: l'ultima coppia ha un posto vuoto. Aggiungi o togli un giocatore."
    return null
  }
  if (type === "CHICECE") {
    return players >= 4 && players % 4 === 0 ? null : "Il Chicece richiede un numero di giocatori multiplo di 4."
  }
  return players >= 4 ? null : "Servono almeno 4 giocatori per iniziare."
}

/**
 * Random pairs, one man and one woman each where possible ("coppie miste").
 * Whoever is left over (more men than women, gender unknown) is paired among
 * themselves at the end. `random` is injectable for tests.
 */
export function mixedPairOrder(
  players: { id: string; gender: string | null }[],
  random: () => number = Math.random,
): string[] {
  const shuffle = <T,>(xs: T[]) => {
    const a = [...xs]
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1))
      ;[a[i], a[j]] = [a[j], a[i]]
    }
    return a
  }
  const men = shuffle(players.filter((p) => p.gender === "Uomo").map((p) => p.id))
  const women = shuffle(players.filter((p) => p.gender === "Donna").map((p) => p.id))
  const others = players.filter((p) => p.gender !== "Uomo" && p.gender !== "Donna").map((p) => p.id)
  const order: string[] = []
  while (men.length && women.length) order.push(men.pop()!, women.pop()!)
  return [...order, ...shuffle([...men, ...women, ...others])]
}

export function shuffledOrder(ids: string[], random: () => number = Math.random): string[] {
  const a = [...ids]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/**
 * "Casuale" / "Miste" for the organiser: pairs that signed up together (same
 * pairKey, side by side) stay together; only the players who came alone are
 * reshuffled into new pairs, after them.
 */
export function regroupKeepingPairs(
  ordered: { id: string; pairKey: string | null; gender: string | null }[],
  mode: "random" | "mixed",
  random: () => number = Math.random,
): string[] {
  const kept: string[] = []
  const singles: { id: string; gender: string | null }[] = []
  for (let i = 0; i < ordered.length; i++) {
    const cur = ordered[i]
    const next = ordered[i + 1]
    if (cur.pairKey && next?.pairKey === cur.pairKey) {
      kept.push(cur.id, next.id)
      i++
    } else {
      singles.push(cur)
    }
  }
  const rest = mode === "mixed" ? mixedPairOrder(singles, random) : shuffledOrder(singles.map((s) => s.id), random)
  return [...kept, ...rest]
}
