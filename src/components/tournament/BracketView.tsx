import { cn } from "@/lib/utils"
import { SkillBadge } from "./SkillBadge"
import type { Match, MatchPlayer, Player } from "@/generated/prisma/client"

type MatchWithPlayers = Match & {
  players: (MatchPlayer & { player: Player })[]
}

type TeamInfoMap = Record<string, { name: string | null; logoUrl: string | null }>
type SkillLevelMap = Record<string, number | null>

interface BracketViewProps {
  matches: MatchWithPlayers[]
  teamInfoMap?: TeamInfoMap
  skillLevelMap?: SkillLevelMap
}

// ─── Helper: resolve display name + logo for a team ──────────────────────────

function getTeamDisplay(players: Player[], teamInfoMap?: TeamInfoMap) {
  const fallback = players.map((p) => p.name).join(" & ")
  if (!teamInfoMap || players.length === 0) return { label: fallback, logoUrl: null }
  const info = teamInfoMap[players[0].id]
  return {
    label: info?.name || fallback,
    logoUrl: info?.logoUrl ?? null,
  }
}

// ─── Team row inside a match cell ─────────────────────────────────────────────

function TeamRow({
  players,
  teamInfoMap,
  skillLevelMap,
  won,
  score,
  isCompleted,
  hasBorder,
}: {
  players: Player[]
  teamInfoMap?: TeamInfoMap
  skillLevelMap?: SkillLevelMap
  won: boolean
  score: number | null
  isCompleted: boolean
  hasBorder: boolean
}) {
  const { label, logoUrl } = getTeamDisplay(players, teamInfoMap)
  const isEmpty = players.length === 0
  const hasCustomTeamName =
    !!teamInfoMap && !isEmpty && Boolean(teamInfoMap[players[0].id]?.name)

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-2 px-3 py-2",
        hasBorder && "border-b border-[var(--border)]",
        won && "bg-[var(--accent)]/10",
      )}
    >
      <div className="flex items-center gap-1.5 min-w-0 flex-1">
        {logoUrl && !isEmpty && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={logoUrl}
            alt=""
            className="h-5 w-5 rounded-full object-cover shrink-0"
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none" }}
          />
        )}
        {hasCustomTeamName || isEmpty ? (
          <span
            className={cn(
              "text-sm font-semibold leading-tight truncate",
              won ? "text-[var(--accent)]" : "text-[var(--foreground)]",
              isEmpty && "text-[var(--muted-text)] italic",
            )}
          >
            {isEmpty ? "TBD" : label}
          </span>
        ) : (
          <span
            className={cn(
              "flex items-center gap-1 text-sm font-semibold leading-tight min-w-0",
              won ? "text-[var(--accent)]" : "text-[var(--foreground)]",
            )}
          >
            {players.map((pl, idx) => (
              <span key={pl.id} className="flex items-center gap-1 min-w-0">
                {idx > 0 && <span className="text-[var(--muted-text)] shrink-0">&</span>}
                <span className="truncate">{pl.name}</span>
                <SkillBadge level={skillLevelMap?.[pl.id] ?? null} />
              </span>
            ))}
          </span>
        )}
      </div>
      {isCompleted && (
        <span className={cn("text-sm font-black tabular-nums shrink-0", won ? "text-[var(--accent)]" : "text-[var(--muted-text)]")}>
          {score}
        </span>
      )}
    </div>
  )
}

// ─── Single bracket column renderer ──────────────────────────────────────────

function MatchCell({
  match,
  teamInfoMap,
  skillLevelMap,
}: {
  match: MatchWithPlayers
  teamInfoMap?: TeamInfoMap
  skillLevelMap?: SkillLevelMap
}) {
  const teamA = match.players.filter((p) => p.team === 0).map((p) => p.player)
  const teamB = match.players.filter((p) => p.team === 1).map((p) => p.player)
  const aWon = match.isCompleted && (match.teamAScore ?? 0) > (match.teamBScore ?? 0)
  const bWon = match.isCompleted && (match.teamBScore ?? 0) > (match.teamAScore ?? 0)

  return (
    <div className="w-44 overflow-hidden rounded-2xl border border-[var(--border)]">
      <TeamRow
        players={teamA}
        teamInfoMap={teamInfoMap}
        skillLevelMap={skillLevelMap}
        won={aWon}
        score={match.teamAScore ?? null}
        isCompleted={match.isCompleted}
        hasBorder
      />
      <TeamRow
        players={teamB}
        teamInfoMap={teamInfoMap}
        skillLevelMap={skillLevelMap}
        won={bWon}
        score={match.teamBScore ?? null}
        isCompleted={match.isCompleted}
        hasBorder={false}
      />
    </div>
  )
}

function BracketSection({
  matches,
  title,
  roundLabel,
  teamInfoMap,
  skillLevelMap,
}: {
  matches: MatchWithPlayers[]
  title: string
  roundLabel: (round: number, totalRounds: number) => string
  teamInfoMap?: TeamInfoMap
  skillLevelMap?: SkillLevelMap
}) {
  const nonBye = matches.filter((m) => !m.isBye)
  if (nonBye.length === 0) return null

  const rounds = Array.from(new Set(nonBye.map((m) => m.round))).sort((a, b) => b - a)

  return (
    <div>
      <p className="mb-3 text-xs font-bold uppercase tracking-widest text-[var(--muted-text)]">
        {title}
      </p>
      <div className="flex min-w-max gap-4">
        {rounds.map((round) => {
          const roundMatches = nonBye.filter((m) => m.round === round)
          return (
            <div key={round} className="flex flex-col gap-3">
              <p className="text-center text-xs font-bold uppercase tracking-wider text-[var(--accent)]">
                {roundLabel(round, rounds.length)}
              </p>
              <div className="flex flex-col justify-around gap-4">
                {roundMatches.map((match) => (
                  <MatchCell
                    key={match.id}
                    match={match}
                    teamInfoMap={teamInfoMap}
                    skillLevelMap={skillLevelMap}
                  />
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Main component ────────────────────────────────────────────────────────────

export function BracketView({ matches, teamInfoMap, skillLevelMap }: BracketViewProps) {
  if (matches.length === 0) {
    return (
      <p className="py-8 text-center text-[var(--muted-text)]">
        Nessun match nel tabellone
      </p>
    )
  }

  const hasLB = matches.some((m) => m.bracketSection === "LB")
  const hasGF = matches.some((m) => m.bracketSection === "GF")

  if (hasLB || hasGF) {
    const wbMatches = matches.filter((m) => m.bracketSection === "WB")
    const lbMatches = matches.filter((m) => m.bracketSection === "LB")
    const gfMatches = matches.filter((m) => m.bracketSection === "GF")

    const wbRoundLabels: Record<number, string> = { 1: "WB Finale", 2: "WB Semifinale", 3: "WB Quarti" }
    const lbRoundLabels: Record<number, string> = {}
    const lbRoundNums = [...new Set(lbMatches.filter((m) => !m.isBye).map((m) => m.round))].sort((a, b) => a - b)
    lbRoundNums.forEach((r, i) => {
      lbRoundLabels[r] = i === lbRoundNums.length - 1 ? "LB Finale" : `LB R${r}`
    })

    return (
      <div className="space-y-8">
        <div className="overflow-x-auto">
          <BracketSection matches={wbMatches} title="Winners Bracket" roundLabel={(r) => wbRoundLabels[r] ?? `WB R${r}`} teamInfoMap={teamInfoMap} skillLevelMap={skillLevelMap} />
        </div>
        <div className="overflow-x-auto">
          <BracketSection matches={lbMatches} title="Losers Bracket" roundLabel={(r) => lbRoundLabels[r] ?? `LB R${r}`} teamInfoMap={teamInfoMap} skillLevelMap={skillLevelMap} />
        </div>
        {gfMatches.some((m) => !m.isBye) && (
          <div className="overflow-x-auto">
            <BracketSection matches={gfMatches} title="Grand Final" roundLabel={() => "Grand Final"} teamInfoMap={teamInfoMap} skillLevelMap={skillLevelMap} />
          </div>
        )}
      </div>
    )
  }

  const roundLabels: Record<number, string> = { 1: "Finale", 2: "Semifinale", 3: "Quarti" }
  const rounds = Array.from(new Set(matches.map((m) => m.round))).sort((a, b) => b - a)

  return (
    <div className="flex min-w-max gap-4 py-4">
      {rounds.map((round) => {
        const roundMatches = matches.filter((m) => m.round === round && !m.isBye)
        return (
          <div key={round} className="flex flex-col gap-3">
            <p className="text-center text-xs font-bold uppercase tracking-wider text-[var(--accent)]">
              {roundLabels[round] ?? `Round ${round}`}
            </p>
            <div className="flex flex-col justify-around gap-4">
              {roundMatches.map((match) => (
                <MatchCell
                  key={match.id}
                  match={match}
                  teamInfoMap={teamInfoMap}
                  skillLevelMap={skillLevelMap}
                />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
