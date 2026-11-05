/* ────────────────────────────────────────────────────────────────────────── */
/*  Score confirmation (pure rules, no DB).                                    */
/*                                                                             */
/*  One player used to decide a match: whoever closed it set the score, and    */
/*  W/L and rating moved at once. Now a submitted score waits for the other    */
/*  side: someone on the opposing team confirms or disputes it within 24 h.    */
/*  Silence counts as yes; a dispute keeps it out of rating and standings.     */
/* ────────────────────────────────────────────────────────────────────────── */

export const SCORE_CONFIRM_HOURS = 24
const WINDOW_MS = SCORE_CONFIRM_HOURS * 3_600_000

export type ScoreState = "none" | "pending" | "due" | "confirmed" | "disputed"

type Participant = { playerId: string | null; team: number | null }

/**
 * Who may confirm or dispute a score: the real players on the other team. If
 * the submitter has no team (an organizer who didn't play, teams not set, a
 * multi-match session) every other real participant may. Empty = nobody can
 * object, so the score stands at once.
 */
export function scoreConfirmers(participants: Participant[], submitterId: string, multiMatch = false): string[] {
  const real = participants.filter((p): p is { playerId: string; team: number | null } => !!p.playerId && p.playerId !== submitterId)
  const mine = participants.find((p) => p.playerId === submitterId)?.team
  const others = multiMatch || mine === null || mine === undefined ? real : real.filter((p) => p.team !== null && p.team !== mine)
  return [...new Set(others.map((p) => p.playerId))]
}

export function scoreState(
  s: { scoreSubmittedAt: Date | null; scoreConfirmedAt: Date | null; scoreDisputedAt: Date | null },
  now: Date = new Date(),
): ScoreState {
  if (s.scoreDisputedAt) return "disputed"
  if (s.scoreConfirmedAt) return "confirmed"
  if (!s.scoreSubmittedAt) return "none"
  return now.getTime() - s.scoreSubmittedAt.getTime() >= WINDOW_MS ? "due" : "pending"
}

/** When an unanswered score confirms itself. */
export function autoConfirmAt(submittedAt: Date): Date {
  return new Date(submittedAt.getTime() + WINDOW_MS)
}

/** The push each player gets once a score counts: result, rating move, link to the match. */
export function resultNotice(r: { won: boolean | null; title: string; delta: number | null; sessionId: string }) {
  const pts = r.delta === null || r.delta === 0 ? "" : ` ${r.delta > 0 ? "+" : ""}${r.delta} punti.`
  const title = r.won === null ? "Risultato confermato" : r.won ? "Vittoria confermata!" : "Risultato confermato"
  const body =
    r.won === null
      ? `${r.title}: il risultato conta per la classifica.${pts}`
      : r.won
        ? `${r.title}:${pts || " il risultato conta."} Guarda come è cambiata la tua carta.`
        : `${r.title}: sconfitta.${pts} La prossima vittoria contro avversari forti vale di più.`
  return { title, body, url: `/sessions/${r.sessionId}` }
}
