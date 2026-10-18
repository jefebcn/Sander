/* ────────────────────────────────────────────────────────────────────────── */
/*  "Il più compatibile di oggi": one stable pairing of the whole pool.        */
/*                                                                             */
/*  Gale–Shapley deferred acceptance (the Nobel-prize algorithm) finds a      */
/*  pairing where no two people would both rather be with each other than     */
/*  with the pick they got. Beach volley pairs want a blocker and a defender, */
/*  so blockers and defenders are the two sides; whoever is left over (more    */
/*  of one role than the other) is paired greedily by best mutual score.       */
/*  Picks are symmetric: if your pick is Giulia, Giulia's pick is you.         */
/*  Pure logic so it can be unit-tested.                                        */
/* ────────────────────────────────────────────────────────────────────────── */

/**
 * Deferred acceptance. Each proposer ranks acceptors best-first; each acceptor
 * ranks proposers. Missing entries are unacceptable pairs. Returns
 * proposer → acceptor for everyone who got a partner.
 */
export function galeShapley(
  proposerPrefs: Map<string, string[]>,
  acceptorPrefs: Map<string, string[]>,
): Map<string, string> {
  const rank = new Map<string, Map<string, number>>()
  for (const [acceptor, list] of acceptorPrefs) {
    rank.set(acceptor, new Map(list.map((p, i) => [p, i])))
  }
  const next = new Map<string, number>()
  const engagedTo = new Map<string, string>() // acceptor → proposer
  const free = [...proposerPrefs.keys()]

  while (free.length > 0) {
    const p = free.shift() as string
    const list = proposerPrefs.get(p) ?? []
    let i = next.get(p) ?? 0
    while (i < list.length) {
      const a = list[i++]
      const r = rank.get(a)?.get(p)
      if (r === undefined) continue // a won't accept p
      const current = engagedTo.get(a)
      if (current === undefined) {
        engagedTo.set(a, p)
        break
      }
      const rc = rank.get(a)?.get(current) ?? Infinity
      if (r < rc) {
        engagedTo.set(a, p)
        free.push(current)
        break
      }
    }
    next.set(p, i)
  }

  const out = new Map<string, string>()
  for (const [a, p] of engagedTo) out.set(p, a)
  return out
}

export interface PoolPerson {
  id: string
  role: "BLOCKER" | "DEFENDER"
}

/** Score of a pair, or null when the two must not be paired. */
export type PairScore = (a: string, b: string) => number | null

function ranked(me: string, others: string[], score: PairScore): string[] {
  return others
    .map((o) => ({ o, s: score(me, o) }))
    .filter((x): x is { o: string; s: number } => x.s !== null)
    .sort((x, y) => y.s - x.s || (x.o < y.o ? -1 : 1))
    .map((x) => x.o)
}

/**
 * Pair the pool for the day. `blockersPropose` alternates by day so neither
 * role always gets the proposer-optimal side. Returns a symmetric map.
 */
export function dailyPairs(pool: PoolPerson[], score: PairScore, blockersPropose = true): Map<string, string> {
  const blockers = pool.filter((p) => p.role === "BLOCKER").map((p) => p.id)
  const defenders = pool.filter((p) => p.role === "DEFENDER").map((p) => p.id)
  const [proposers, acceptors] = blockersPropose ? [blockers, defenders] : [defenders, blockers]

  const pPrefs = new Map(proposers.map((p) => [p, ranked(p, acceptors, score)]))
  const aPrefs = new Map(acceptors.map((a) => [a, ranked(a, proposers, score)]))
  const pairs = new Map<string, string>()
  for (const [p, a] of galeShapley(pPrefs, aPrefs)) {
    pairs.set(p, a)
    pairs.set(a, p)
  }

  // Leftovers (same role, or nobody acceptable on the other side): best mutual first.
  const left = pool.map((p) => p.id).filter((id) => !pairs.has(id))
  const candidates: { a: string; b: string; s: number }[] = []
  for (let i = 0; i < left.length; i++) {
    for (let j = i + 1; j < left.length; j++) {
      const s1 = score(left[i], left[j])
      const s2 = score(left[j], left[i])
      if (s1 === null || s2 === null) continue
      candidates.push({ a: left[i], b: left[j], s: s1 + s2 })
    }
  }
  candidates.sort((x, y) => y.s - x.s || (x.a + x.b < y.a + y.b ? -1 : 1))
  for (const c of candidates) {
    if (pairs.has(c.a) || pairs.has(c.b)) continue
    pairs.set(c.a, c.b)
    pairs.set(c.b, c.a)
  }
  return pairs
}

/** True when no pair (x, y) both prefer each other to what they were given. */
export function isStable(pairs: Map<string, string>, ids: string[], score: PairScore): boolean {
  const val = (a: string, b: string | undefined) => (b === undefined ? -Infinity : score(a, b) ?? -Infinity)
  for (let i = 0; i < ids.length; i++) {
    for (let j = i + 1; j < ids.length; j++) {
      const x = ids[i], y = ids[j]
      if (pairs.get(x) === y) continue
      const sxy = score(x, y), syx = score(y, x)
      if (sxy === null || syx === null) continue
      if (sxy > val(x, pairs.get(x)) && syx > val(y, pairs.get(y))) return false
    }
  }
  return true
}
