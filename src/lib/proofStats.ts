/* ────────────────────────────────────────────────────────────────────────── */
/*  The "social proof" numbers on the guest home. A small number shown big     */
/*  ("1 comune", "3 partite") tells a newcomer the app is empty: each figure   */
/*  appears only once it is worth showing, and the bar hides when none is.     */
/* ────────────────────────────────────────────────────────────────────────── */

export const PROOF_MIN = { players: 50, matches: 20, comuni: 5 } as const

export type ProofStat = { n: number; label: string }

export function proofStats(stats: { players: number; matches: number; comuni: number }): ProofStat[] {
  return [
    { n: stats.players, label: "Giocatori", min: PROOF_MIN.players },
    { n: stats.matches, label: "Partite", min: PROOF_MIN.matches },
    { n: stats.comuni, label: "Comuni", min: PROOF_MIN.comuni },
  ]
    .filter((s) => s.n >= s.min)
    .map(({ n, label }) => ({ n, label }))
}
