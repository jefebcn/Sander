/* ────────────────────────────────────────────────────────────────────────── */
/*  Fair play for the rankings (pure rules, no DB).                            */
/*                                                                             */
/*  A friendly match moves W/L and the rating once the other side confirms     */
/*  it. These rules keep that from being farmed:                               */
/*   - only guests on one side: nobody can object, so it doesn't count;        */
/*   - the same two players on opposite sides count at most 3 times a week;    */
/*   - an account that is new (under 7 days) or has played with fewer than 3   */
/*     people doesn't move an established player: no farm of fake accounts.   */
/*  A match that doesn't count is still played and saved; it just leaves       */
/*  W/L and rating as they are, and the session page says why.                */
/* ────────────────────────────────────────────────────────────────────────── */

export const SAME_OPPONENT_WEEKLY_CAP = 3
export const SAME_OPPONENT_WINDOW_DAYS = 7
export const TRUST_MIN_DAYS = 7
export const TRUST_MIN_CO_PLAYERS = 3

export type UnrankedReason = "GUESTS" | "SAME_OPPONENTS" | "VOIDED"

/** Order-free key of two players facing each other. */
export function pairKey(a: string, b: string): string {
  return a < b ? `${a}|${b}` : `${b}|${a}`
}

/** Every pair of players on opposite sides of a match (registered players only). */
export function opposingPairs(teamA: readonly string[], teamB: readonly string[]): string[] {
  const out = new Set<string>()
  for (const a of teamA) for (const b of teamB) if (a !== b) out.add(pairKey(a, b))
  return [...out]
}

/**
 * Whether a session counts for the rankings at all.
 * @param matches the sides of each match (one entry for a plain session)
 * @param recentPairs how many counted sessions in the last week each pair already played on opposite sides
 */
export function sessionRanking(
  matches: { teamA: readonly string[]; teamB: readonly string[] }[],
  recentPairs: ReadonlyMap<string, number>,
): { ranked: true; reason: null } | { ranked: false; reason: UnrankedReason; pairs?: string[] } {
  const real = matches.filter((m) => m.teamA.length > 0 && m.teamB.length > 0)
  if (real.length === 0) return { ranked: false, reason: "GUESTS" }
  const pairs = new Set(real.flatMap((m) => opposingPairs(m.teamA, m.teamB)))
  const over = [...pairs].filter((k) => (recentPairs.get(k) ?? 0) >= SAME_OPPONENT_WEEKLY_CAP)
  if (over.length > 0) return { ranked: false, reason: "SAME_OPPONENTS", pairs: over }
  return { ranked: true, reason: null }
}

/** An account that can move other players' ranking: a week old and seen with 3+ people (or in a real tournament). */
export function isTrustedAccount(a: { createdAt: Date; coPlayers: number; playedTournament: boolean }, now: Date = new Date()): boolean {
  if (a.playedTournament) return true
  const days = (now.getTime() - a.createdAt.getTime()) / 86_400_000
  return days >= TRUST_MIN_DAYS && a.coPlayers >= TRUST_MIN_CO_PLAYERS
}

/**
 * The opponents whose result counts for a player. An established (trusted)
 * player only counts results against trusted accounts; a new player counts
 * everything, so newcomers playing together still build their ranking.
 */
export function countedOpponents(playerTrusted: boolean, opponents: readonly string[], trusted: (id: string) => boolean): string[] {
  return playerTrusted ? opponents.filter(trusted) : [...opponents]
}

export function unrankedLabel(reason: string | null | undefined): string | null {
  switch (reason) {
    case "GUESTS":
      return "Partita non classificata: dall'altra parte c'erano solo ospiti senza account, nessuno poteva confermare il risultato."
    case "SAME_OPPONENTS":
      return `Partita non classificata: contro le stesse persone contano al massimo ${SAME_OPPONENT_WEEKLY_CAP} partite a settimana.`
    case "VOIDED":
      return "Risultato annullato dallo staff SANDER: non conta per la classifica."
    default:
      return null
  }
}

/* ── Suspicion signals for the admin panel ───────────────────────────────── */

export interface SuspicionSignals {
  /** Sessions that hit the same-opponents cap (30 days). */
  sameOpponents: number
  /** Wins that didn't count because every opponent was a new account (30 days). */
  newOpponentWins: number
  /** Sessions with guests only on the other side (30 days). */
  guestOnly: number
  /** Scores this player submitted that the other side disputed (30 days). */
  disputed: number
  /** Rating gained in the last 7 days. */
  ratingGain7d: number
}

/** Points and reasons; 0 = nothing worth a look. */
export function suspicion(s: SuspicionSignals): { score: number; reasons: string[] } {
  const reasons: string[] = []
  let score = 0
  if (s.sameOpponents >= 2) { score += s.sameOpponents * 2; reasons.push(`${s.sameOpponents} partite oltre il limite contro le stesse persone`) }
  if (s.newOpponentWins >= 2) { score += s.newOpponentWins * 3; reasons.push(`${s.newOpponentWins} vittorie contro account nuovi`) }
  if (s.guestOnly >= 3) { score += s.guestOnly; reasons.push(`${s.guestOnly} partite contro soli ospiti`) }
  if (s.disputed >= 2) { score += s.disputed * 3; reasons.push(`${s.disputed} risultati contestati dagli avversari`) }
  if (s.ratingGain7d >= 150) { score += Math.round(s.ratingGain7d / 50); reasons.push(`+${Math.round(s.ratingGain7d)} di rating in 7 giorni`) }
  return { score, reasons }
}
