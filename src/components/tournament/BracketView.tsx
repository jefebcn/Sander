import { cn } from "@/lib/utils"
import type { Match, MatchPlayer, Player } from "@/generated/prisma/client"

type MatchWithPlayers = Match & {
  players: (MatchPlayer & { player: Player })[]
}

interface BracketViewProps {
  matches: MatchWithPlayers[]
}

// ─── Single bracket column renderer ──────────────────────────────────────────

function MatchCell({ match }: { match: MatchWithPlayers }) {
  const teamA = match.players.filter((p) => p.team === 0).map((p) => p.player)
  const teamB = match.players.filter((p) => p.team === 1).map((p) => p.player)
  const aWon = match.isCompleted && (match.teamAScore ?? 0) > (match.teamBScore ?? 0)
  const bWon = match.isCompleted && (match.teamBScore ?? 0) > (match.teamAScore ?? 0)

  return (
    <div className="w-44 overflow-hidden rounded-2xl border border-[var(--border)]">
      <div
        className={cn(
          "flex items-center justify-between gap-2 px-3 py-2 border-b border-[var(--border)]",
          aWon && "bg-[var(--accent)]/10",
        )}
      >
        <span
          className={cn(
            "text-sm font-semibold leading-tight truncate",
            aWon ? "text-[var(--accent)]" : "text-[var(--foreground)]",
            teamA.length === 0 && "text-[var(--muted-text)] italic",
          )}
        >
          {teamA.length > 0 ? teamA.map((p) => p.name).join(" & ") : "TBD"}
        </span>
        {match.isCompleted && (
          <span className={cn("text-sm font-black tabular-nums shrink-0", aWon ? "text-[var(--accent)]" : "text-[var(--muted-text)]")}>
            {match.teamAScore}
          </span>
        )}
      </div>
      <div className={cn("flex items-center justify-between gap-2 px-3 py-2", bWon && "bg-[var(--accent)]/10")}>
        <span
          className={cn(
            "text-sm font-semibold leading-tight truncate",
            bWon ? "text-[var(--accent)]" : "text-[var(--foreground)]",
            teamB.length === 0 && "text-[var(--muted-text)] italic",
          )}
        >
          {teamB.length > 0 ? teamB.map((p) => p.name).join(" & ") : "TBD"}
        </span>
        {match.isCompleted && (
          <span className={cn("text-sm font-black tabular-nums shrink-0", bWon ? "text-[var(--accent)]" : "text-[var(--muted-text)]")}>
            {match.teamBScore}
          </span>
        )}
      </div>
    </div>
  )
}

function BracketSection({
  matches,
  title,
  roundLabel,
}: {
  matches: MatchWithPlayers[]
  title: string
  roundLabel: (round: number, totalRounds: number) => string
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
                  <MatchCell key={match.id} match={match} />
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

export function BracketView({ matches }: BracketViewProps) {
  if (matches.length === 0) {
    return (
      <p className="py-8 text-center text-[var(--muted-text)]">
        Nessun match nel tabellone
      </p>
    )
  }

  // Detect if this is a Double Elimination bracket
  const hasLB = matches.some((m) => m.bracketSection === "LB")
  const hasGF = matches.some((m) => m.bracketSection === "GF")

  if (hasLB || hasGF) {
    // ── Double Elimination layout ──
    const wbMatches = matches.filter((m) => m.bracketSection === "WB")
    const lbMatches = matches.filter((m) => m.bracketSection === "LB")
    const gfMatches = matches.filter((m) => m.bracketSection === "GF")

    const wbRoundLabels: Record<number, string> = { 1: "WB Finale", 2: "WB Semifinale", 3: "WB Quarti" }
    const lbRoundLabels: Record<number, string> = {}
    // LB rounds: 1-based, highest = LB Final
    const lbRoundNums = [...new Set(lbMatches.filter((m) => !m.isBye).map((m) => m.round))].sort((a, b) => a - b)
    lbRoundNums.forEach((r, i) => {
      lbRoundLabels[r] = i === lbRoundNums.length - 1 ? "LB Finale" : `LB R${r}`
    })

    return (
      <div className="space-y-8">
        <div className="overflow-x-auto">
          <BracketSection
            matches={wbMatches}
            title="Winners Bracket"
            roundLabel={(r) => wbRoundLabels[r] ?? `WB R${r}`}
          />
        </div>
        <div className="overflow-x-auto">
          <BracketSection
            matches={lbMatches}
            title="Losers Bracket"
            roundLabel={(r) => lbRoundLabels[r] ?? `LB R${r}`}
          />
        </div>
        {gfMatches.some((m) => !m.isBye) && (
          <div className="overflow-x-auto">
            <BracketSection
              matches={gfMatches}
              title="Grand Final"
              roundLabel={() => "Grand Final"}
            />
          </div>
        )}
      </div>
    )
  }

  // ── Standard single-elimination layout ──
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
                <MatchCell key={match.id} match={match} />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
