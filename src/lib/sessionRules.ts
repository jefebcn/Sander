/* ────────────────────────────────────────────────────────────────────────── */
/*  Session rules — pure functions shared by server actions and the UI.        */
/* ────────────────────────────────────────────────────────────────────────── */

const MIN = 60_000
const HOUR = 60 * MIN
const DAY = 24 * HOUR

/** A late arrival can still take a free seat this long after the start. */
export const JOIN_GRACE_MS = 30 * MIN
/** Small allowance for clocks and slow forms when creating "now". */
export const CREATE_PAST_TOLERANCE_MS = 5 * MIN
/** Results can be entered from shortly before the scheduled start. */
export const COMPLETE_EARLY_MS = 15 * MIN
/** Open matches this old that nobody closed are cancelled and refunded. */
export const STALE_SESSION_MS = 7 * DAY
/** Past matches stay in public lists this long (people closing them late). */
export const PUBLIC_LIST_PAST_MS = 3 * HOUR

export type SessionStatusLike = "OPEN" | "FULL" | "COMPLETED" | "CANCELLED"

export function isActiveStatus(status: string): boolean {
  return status === "OPEN" || status === "FULL"
}

/** Error message when a new/edited match date is not acceptable, else null. */
export function sessionDateError(date: Date, now: Date = new Date()): string | null {
  if (Number.isNaN(date.getTime())) return "Data non valida"
  if (date.getTime() < now.getTime() - CREATE_PAST_TOLERANCE_MS) return "La data è già passata: scegli un orario futuro"
  return null
}

/** Can someone still join (or queue for) a match starting at `date`? */
export function joinWindowOpen(date: Date, now: Date = new Date()): boolean {
  return now.getTime() <= date.getTime() + JOIN_GRACE_MS
}

export interface CompletionInput {
  status: string
  date: Date
  now?: Date
  /** team: 0 | 1 | null; playerId null for guests */
  participants: { team: number | null; playerId: string | null }[]
  withScore: boolean
}

/** Why this match cannot be closed now, or null if it can. */
export function completionError({ status, date, now = new Date(), participants, withScore }: CompletionInput): string | null {
  if (!isActiveStatus(status)) return "Questa partita non può più essere chiusa"
  if (now.getTime() < date.getTime() - COMPLETE_EARLY_MS) return "La partita non è ancora iniziata"
  if (participants.length < 2) return "Servono almeno 2 giocatori per chiudere la partita"
  if (withScore) {
    const a = participants.filter((p) => p.team === 0).length
    const b = participants.filter((p) => p.team === 1).length
    if (a === 0 || b === 0) return "Assegna i giocatori a entrambe le squadre prima di inserire il punteggio"
  }
  return null
}

/** XP and "partite giocate" only count when at least two real accounts played. */
export function countsForProgress(participants: { playerId: string | null }[]): boolean {
  return participants.filter((p) => p.playerId).length >= 2
}

/** Should this match still appear in public lists? (participants always see theirs) */
export function visibleInPublicList(date: Date, now: Date = new Date()): boolean {
  return date.getTime() >= now.getTime() - PUBLIC_LIST_PAST_MS
}

export function isStale(date: Date, now: Date = new Date()): boolean {
  return date.getTime() < now.getTime() - STALE_SESSION_MS
}
