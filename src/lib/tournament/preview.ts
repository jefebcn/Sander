/**
 * Tournament page previews (pure — no DB imports):
 *  - progress: where the tournament is (iscrizioni → tabellone → si gioca → risultati)
 *  - deadlines: the dates that matter, with a "tra 2 giorni" countdown
 *  - simulation: a what-if bracket where the stronger side always wins
 *
 * None of this is official: the real teams and bracket are made at the start.
 */
import { isPairFormat, pairingOrder } from "./pairing"

const TZ = "Europe/Rome"
const DAY = 24 * 60 * 60 * 1000

// ─── Progress ────────────────────────────────────────────────────────────────

export type StepState = "done" | "current" | "todo"

export interface ProgressStep {
  key: "iscrizioni" | "tabellone" | "gioco" | "risultati"
  label: string
  /** Short state under the label: "aperte", "chiuse", "all'avvio"… */
  detail: string
  state: StepState
}

export interface ProgressInput {
  status: string // DRAFT | LIVE | COMPLETED
  isOpenForRegistration: boolean
  registrationDeadline: Date | string | null
  date: Date | string
  /** Second step's name: "Squadre e tabellone" here, "Lista d'ingresso" for FIPAV. */
  listLabel?: string
  /** More dates to list under Scadenze (FIPAV: entry list, partner change). */
  extraDeadlines?: { key: string; label: string; at: Date | string }[]
}

/** True while people can still sign up. */
export function registrationsOpen(t: ProgressInput, now: Date = new Date()): boolean {
  if (t.status !== "DRAFT" || !t.isOpenForRegistration) return false
  return !(t.registrationDeadline && new Date(t.registrationDeadline).getTime() < now.getTime())
}

export function tournamentProgress(t: ProgressInput, now: Date = new Date()): ProgressStep[] {
  const live = t.status === "LIVE"
  const done = t.status === "COMPLETED"
  const started = live || done
  const open = registrationsOpen(t, now)
  // Draft, not open and no deadline passed yet: the organiser hasn't opened sign-ups.
  const notOpenedYet = t.status === "DRAFT" && !t.isOpenForRegistration &&
    !(t.registrationDeadline && new Date(t.registrationDeadline).getTime() < now.getTime())

  return [
    {
      key: "iscrizioni",
      label: "Iscrizioni",
      detail: open ? "aperte" : notOpenedYet ? "non ancora aperte" : "chiuse",
      state: open || notOpenedYet ? "current" : "done",
    },
    {
      key: "tabellone",
      label: t.listLabel ?? "Squadre e tabellone",
      detail: started ? "pubblicati" : "all'avvio",
      state: started ? "done" : !open && !notOpenedYet ? "current" : "todo",
    },
    {
      key: "gioco",
      label: "Si gioca",
      detail: live ? "in corso" : done ? "giocato" : shortDay(t.date),
      state: live ? "current" : done ? "done" : "todo",
    },
    {
      key: "risultati",
      label: "Risultati",
      detail: done ? "classifica finale" : "a fine torneo",
      state: done ? "done" : "todo",
    },
  ]
}

// ─── Deadlines ───────────────────────────────────────────────────────────────

export interface Deadline {
  key: string
  label: string
  at: Date
  past: boolean
  /** "oggi", "domani", "tra 3 giorni", "passata" */
  relative: string
}

/** Calendar days between two instants, in Rome time (0 = same day). */
export function daysBetween(from: Date, to: Date): number {
  const day = (d: Date) => {
    const [y, m, dd] = d.toLocaleDateString("en-CA", { timeZone: TZ }).split("-").map(Number)
    return Date.UTC(y, m - 1, dd)
  }
  return Math.round((day(to) - day(from)) / DAY)
}

export function relativeDay(at: Date, now: Date = new Date()): string {
  if (at.getTime() < now.getTime()) return "passata"
  const d = daysBetween(now, at)
  if (d <= 0) return "oggi"
  if (d === 1) return "domani"
  if (d < 7) return `tra ${d} giorni`
  const w = Math.floor(d / 7)
  return w === 1 ? "tra una settimana" : `tra ${w} settimane`
}

/** Sign-up deadline and start, in time order. Empty once the tournament is over. */
export function tournamentDeadlines(t: ProgressInput, now: Date = new Date()): Deadline[] {
  if (t.status === "COMPLETED") return []
  const out: Deadline[] = []
  if (t.status === "DRAFT" && t.registrationDeadline) {
    const at = new Date(t.registrationDeadline)
    out.push({ key: "iscrizioni", label: "Chiusura iscrizioni", at, past: at < now, relative: relativeDay(at, now) })
  }
  if (t.status === "DRAFT") {
    for (const x of t.extraDeadlines ?? []) {
      const at = new Date(x.at)
      out.push({ key: x.key, label: x.label, at, past: at < now, relative: relativeDay(at, now) })
    }
  }
  const start = new Date(t.date)
  out.push({
    key: "inizio",
    label: "Inizio torneo",
    at: start,
    // A date without a time is "today" all day long, not "passed" at midnight.
    past: start < now && daysBetween(now, start) < 0,
    relative: t.status === "LIVE" ? "in corso" : daysBetween(now, start) === 0 ? "oggi" : relativeDay(start, now),
  })
  return out.sort((a, b) => a.at.getTime() - b.at.getTime())
}

function shortDay(d: Date | string): string {
  return new Date(d).toLocaleDateString("it-IT", { timeZone: TZ, weekday: "short", day: "numeric", month: "short" })
}

// ─── Simulation ──────────────────────────────────────────────────────────────

export interface SimPlayer {
  id: string
  name: string
  rating: number
}

export interface SimRegistration {
  seedPosition: number | null
  createdAt: Date | string
  player: SimPlayer
}

export interface SimTeam {
  key: string
  label: string
  rating: number
  /** 1 = strongest on paper. */
  seed: number
}

export interface SimMatch {
  a: SimTeam | null
  b: SimTeam | null
  winner: SimTeam | null
  bye: boolean
}

export interface SimRound {
  /** "Finale", "Semifinali", "Quarti", "Ottavi", "Primo turno" */
  label: string
  matches: SimMatch[]
}

export interface Simulation {
  kind: "bracket" | "ranking"
  /** Teams (pair formats) or players, strongest first. */
  ranking: SimTeam[]
  /** Only for single/double elimination. */
  rounds: SimRound[]
  /** Pairs left out because a partner is missing (odd count). */
  leftOut: string[]
}

const ELIMINATION = ["BRACKETS", "DOUBLE_ELIMINATION"]

/** Players, or the fixed pairs the tournament would start with (seeds 1+2, 3+4…). */
export function simulationTeams(type: string, regs: SimRegistration[]): { teams: SimTeam[]; leftOut: string[] } {
  const ordered = pairingOrder(regs)
  const raw: Omit<SimTeam, "seed">[] = []
  const leftOut: string[] = []
  if (isPairFormat(type)) {
    for (let i = 0; i < ordered.length; i += 2) {
      const p = ordered[i].player
      const q = ordered[i + 1]?.player
      if (!q) { leftOut.push(p.name); continue }
      raw.push({ key: `${p.id}+${q.id}`, label: `${p.name} – ${q.name}`, rating: (p.rating + q.rating) / 2 })
    }
  } else {
    for (const r of ordered) raw.push({ key: r.player.id, label: r.player.name, rating: r.player.rating })
  }
  const teams = raw
    .map((t, i) => ({ t, i }))
    // Stronger first; ties keep sign-up order so the result is stable.
    .sort((x, y) => y.t.rating - x.t.rating || x.i - y.i)
    .map(({ t }, i) => ({ ...t, seed: i + 1 }))
  return { teams, leftOut }
}

export function roundLabel(teamsInRound: number): string {
  if (teamsInRound <= 2) return "Finale"
  if (teamsInRound <= 4) return "Semifinali"
  if (teamsInRound <= 8) return "Quarti"
  if (teamsInRound <= 16) return "Ottavi"
  return "Primo turno"
}

/** Seed at each bracket position: [1, 4, 2, 3] for 4, [1, 8, 4, 5, 2, 7, 3, 6] for 8. */
export function seedPositions(size: number): number[] {
  let order = [1]
  while (order.length < size) {
    const n = order.length * 2
    order = order.flatMap((s) => [s, n + 1 - s])
  }
  return order
}

/** What-if: the stronger side (higher rating) wins every match. Null with fewer than 2 teams. */
export function simulateTournament(type: string, regs: SimRegistration[]): Simulation | null {
  const { teams, leftOut } = simulationTeams(type, regs)
  if (teams.length < 2) return null
  if (!ELIMINATION.includes(type)) return { kind: "ranking", ranking: teams, rounds: [], leftOut }

  // Standard seeding (1 v last, 2 v second-to-last…), byes to the top seeds.
  let size = 2
  while (size < teams.length) size *= 2
  let line: (SimTeam | null)[] = seedPositions(size).map((s) => teams[s - 1] ?? null)

  const rounds: SimRound[] = []
  while (line.length > 1) {
    const sims: SimMatch[] = []
    for (let i = 0; i < line.length; i += 2) {
      const a = line[i]
      const b = line[i + 1]
      const winner = a && b ? (b.seed < a.seed ? b : a) : a ?? b
      sims.push({ a, b, winner, bye: !a || !b })
    }
    // Byes only matter to the organiser: show the matches that are really played.
    const played = sims.filter((s) => !s.bye)
    if (played.length) rounds.push({ label: roundLabel(line.length), matches: played })
    line = sims.map((s) => s.winner)
  }
  return { kind: "bracket", ranking: teams, rounds, leftOut }
}
