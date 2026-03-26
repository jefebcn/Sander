// ─── KOTB Types ───────────────────────────────────────────────────────────────

export interface KOTBMatch {
  matchNumber: number
  teamA: [string, string] // playerIds
  teamB: [string, string] // playerIds
}

export interface KOTBRound {
  roundNumber: number
  matches: KOTBMatch[]
  byes: string[] // playerIds sitting out this round
}

export interface KOTBSchedule {
  rounds: KOTBRound[]
  totalRounds: number
}

// ─── Bracket Types ────────────────────────────────────────────────────────────

export interface BracketTeam {
  playerIds: string[]
  label?: string
}

export interface BracketMatch {
  tempId: string
  round: number // countdown: highest = first round, 1 = final
  matchNumber: number
  teamA: BracketTeam | null // null = TBD
  teamB: BracketTeam | null // null = TBD
  nextMatchTempId: string | null
  nextMatchSlot: 0 | 1 | null
  isBye: boolean
}

// ─── Round Robin Types ────────────────────────────────────────────────────────

export interface RRMatch {
  matchNumber: number
  teamA: [string, string] // playerIds
  teamB: [string, string] // playerIds
}

export interface RRRound {
  roundNumber: number
  matches: RRMatch[]
  byes: string[] // playerIds sitting out this round
}

export interface RRSchedule {
  rounds: RRRound[]
  teams: [string, string][] // fixed teams for the tournament
  totalRounds: number
}

// ─── Standings Types ──────────────────────────────────────────────────────────

export interface StandingEntry {
  playerId: string
  points: number
  matchesWon: number
  matchesLost: number
  pointsFor: number
  pointsAgainst: number
  rank: number
}

export interface ScoreUpdate {
  teamAScore: number
  teamBScore: number
  teamAPlayerIds: string[]
  teamBPlayerIds: string[]
}
