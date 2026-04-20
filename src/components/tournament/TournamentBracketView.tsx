import { Trophy } from "lucide-react"
import { cn } from "@/lib/utils"
import { SkillBadge } from "./SkillBadge"
import type { Match, MatchPlayer, Player } from "@/generated/prisma/client"

type MatchWithPlayers = Match & {
  players: (MatchPlayer & { player: Player })[]
}

type TeamInfoMap = Record<string, { name: string | null; logoUrl: string | null }>
type SkillLevelMap = Record<string, number | null>

interface TournamentBracketViewProps {
  matches: MatchWithPlayers[]
  tournamentName: string
  teamInfoMap?: TeamInfoMap
  skillLevelMap?: SkillLevelMap
}

function teamMaxLevel(players: Player[], skillLevelMap?: SkillLevelMap): number | null {
  if (!skillLevelMap || players.length === 0) return null
  let max: number | null = null
  for (const p of players) {
    const lvl = skillLevelMap[p.id]
    if (lvl === 1 || lvl === 2 || lvl === 3) {
      if (max === null || lvl > max) max = lvl
    }
  }
  return max
}

function getTeamDisplay(players: Player[], teamInfoMap?: TeamInfoMap) {
  const fallback = players.map((p) => p.name).join(" & ")
  if (!teamInfoMap || players.length === 0) return { label: fallback, logoUrl: null }
  const info = teamInfoMap[players[0].id]
  return { label: info?.name || fallback, logoUrl: info?.logoUrl ?? null }
}

// ─── Layout constants ─────────────────────────────────────────────────────────
const CARD_W  = 160   // px — match card width
const CARD_H  = 68    // px — match card height (two 34px team rows)
const H_GAP   = 48    // px — horizontal space between columns (SVG line room)
const SLOT_H  = 96    // px — vertical slot per first-round match
const COL_W   = CARD_W + H_GAP   // 208
const TROPHY_H = 88  // px — space above bracket for trophy + name

// ─── Match card ───────────────────────────────────────────────────────────────
function MatchCard({
  match,
  isFinal,
  teamInfoMap,
  skillLevelMap,
}: {
  match: MatchWithPlayers
  isFinal: boolean
  teamInfoMap?: TeamInfoMap
  skillLevelMap?: SkillLevelMap
}) {
  const teamA = match.players.filter((p) => p.team === 0).map((p) => p.player)
  const teamB = match.players.filter((p) => p.team === 1).map((p) => p.player)
  const aWon = match.isCompleted && (match.teamAScore ?? 0) > (match.teamBScore ?? 0)
  const bWon = match.isCompleted && (match.teamBScore ?? 0) > (match.teamAScore ?? 0)
  const dispA = getTeamDisplay(teamA, teamInfoMap)
  const dispB = getTeamDisplay(teamB, teamInfoMap)
  const levelA = teamMaxLevel(teamA, skillLevelMap)
  const levelB = teamMaxLevel(teamB, skillLevelMap)

  return (
    <div>
      {isFinal && (
        <p className="mb-1 text-center text-[0.6rem] font-black uppercase tracking-widest text-[var(--accent)]">
          FINALE
        </p>
      )}
      <div
        style={{
          width: CARD_W,
          border: isFinal ? "1px solid var(--accent)" : "1px solid var(--border)",
          borderRadius: "0.75rem",
          overflow: "hidden",
          boxShadow: isFinal ? "0 0 12px rgba(201,243,29,0.2)" : undefined,
        }}
      >
        {/* Team A row */}
        <div
          className="flex items-center justify-between gap-2 px-3"
          style={{
            height: 34,
            borderBottom: "1px solid var(--border)",
            background: aWon ? "rgba(201,243,29,0.1)" : "var(--surface-2)",
          }}
        >
          <div className="flex items-center gap-1 min-w-0 flex-1">
            {dispA.logoUrl && teamA.length > 0 && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={dispA.logoUrl}
                alt=""
                className="h-4 w-4 rounded-full object-cover shrink-0"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none" }}
              />
            )}
            <span
              className={cn(
                "truncate text-xs font-semibold leading-tight",
                aWon ? "text-[var(--accent)]" : teamA.length === 0 ? "italic text-[var(--muted-text)]" : "text-white",
              )}
              style={{ maxWidth: match.isCompleted ? CARD_W - 72 : CARD_W - 48 }}
            >
              {teamA.length > 0 ? dispA.label : "TBD"}
            </span>
            {levelA !== null && <SkillBadge level={levelA} />}
          </div>
          {match.isCompleted && (
            <span className={cn("shrink-0 text-sm font-black tabular-nums", aWon ? "text-[var(--accent)]" : "text-[var(--muted-text)]")}>
              {match.teamAScore}
            </span>
          )}
        </div>

        {/* Team B row */}
        <div
          className="flex items-center justify-between gap-2 px-3"
          style={{
            height: 34,
            background: bWon ? "rgba(201,243,29,0.1)" : "var(--surface-2)",
          }}
        >
          <div className="flex items-center gap-1 min-w-0 flex-1">
            {dispB.logoUrl && teamB.length > 0 && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={dispB.logoUrl}
                alt=""
                className="h-4 w-4 rounded-full object-cover shrink-0"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none" }}
              />
            )}
            <span
              className={cn(
                "truncate text-xs font-semibold leading-tight",
                bWon ? "text-[var(--accent)]" : teamB.length === 0 ? "italic text-[var(--muted-text)]" : "text-white",
              )}
              style={{ maxWidth: match.isCompleted ? CARD_W - 72 : CARD_W - 48 }}
            >
              {teamB.length > 0 ? dispB.label : "TBD"}
            </span>
            {levelB !== null && <SkillBadge level={levelB} />}
          </div>
          {match.isCompleted && (
            <span className={cn("shrink-0 text-sm font-black tabular-nums", bWon ? "text-[var(--accent)]" : "text-[var(--muted-text)]")}>
              {match.teamBScore}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Main component ────────────────────────────────────────────────────────────
export function TournamentBracketView({ matches, tournamentName, teamInfoMap }: TournamentBracketViewProps) {
  if (matches.length === 0) {
    return <p className="py-8 text-center text-[var(--muted-text)]">Nessun match nel tabellone</p>
  }

  // ── Step 1: sort rounds descending (index 0 = first round, last = final) ──
  const allRounds = Array.from(new Set(matches.map((m) => m.round))).sort((a, b) => b - a)
  const N = allRounds.length

  // Edge case: single match (N=1) — just show it centered
  if (N === 1) {
    const m = matches.find((m) => !m.isBye) ?? matches[0]
    return (
      <div className="flex flex-col items-center gap-3 py-8">
        <Trophy className="h-10 w-10 text-[var(--accent)]" />
        <p className="text-center text-lg font-black text-white">{tournamentName}</p>
        <MatchCard match={m} isFinal teamInfoMap={teamInfoMap} />
      </div>
    )
  }

  // ── Step 2: Y positions — use ALL first-round matches (incl. byes) for spacing ──
  const matchY = new Map<string, number>()

  const firstRoundAll = matches
    .filter((m) => m.round === allRounds[0])
    .sort((a, b) => a.matchNumber - b.matchNumber)

  firstRoundAll.forEach((m, i) => {
    matchY.set(m.id, i * SLOT_H + SLOT_H / 2)
  })

  for (let ri = 1; ri < N; ri++) {
    const roundMatches = matches
      .filter((m) => m.round === allRounds[ri])
      .sort((a, b) => a.matchNumber - b.matchNumber)
    const prevMatches = matches
      .filter((m) => m.round === allRounds[ri - 1])
      .sort((a, b) => a.matchNumber - b.matchNumber)

    roundMatches.forEach((m, i) => {
      const f1 = prevMatches[2 * i]
      const f2 = prevMatches[2 * i + 1]
      const y1 = f1 ? (matchY.get(f1.id) ?? 0) : 0
      const y2 = f2 ? (matchY.get(f2.id) ?? y1) : y1
      matchY.set(m.id, (y1 + y2) / 2)
    })
  }

  const totalH = firstRoundAll.length * SLOT_H

  // ── Step 3: column and side assignment (non-bye only) ──
  type Side = "left" | "right" | "center"
  const matchCol  = new Map<string, number>()
  const matchSide = new Map<string, Side>()

  const nonBye = matches.filter((m) => !m.isBye)

  for (let ri = 0; ri < N; ri++) {
    const roundMatches = nonBye
      .filter((m) => m.round === allRounds[ri])
      .sort((a, b) => a.matchNumber - b.matchNumber)
    const total = roundMatches.length
    const half  = Math.floor(total / 2)

    roundMatches.forEach((m) => {
      if (ri === N - 1) {
        matchCol.set(m.id, N - 1)
        matchSide.set(m.id, "center")
      } else if (m.matchNumber <= half) {
        matchCol.set(m.id, ri)
        matchSide.set(m.id, "left")
      } else {
        matchCol.set(m.id, 2 * (N - 1) - ri)
        matchSide.set(m.id, "right")
      }
    })
  }

  const totalW = (2 * N - 1) * COL_W + CARD_W

  // ── Step 4: SVG connector lines ──
  type Line = { x1: number; y1: number; x2: number; y2: number }
  const lines: Line[] = []

  const addLine = (x1: number, y1: number, x2: number, y2: number) => {
    lines.push({ x1, y1, x2, y2 })
  }

  for (let ri = 1; ri < N; ri++) {
    const parentMatches = nonBye
      .filter((m) => m.round === allRounds[ri])
      .sort((a, b) => a.matchNumber - b.matchNumber)
    // all matches (incl byes) in prev round for correct feeder indexing
    const prevMatches = matches
      .filter((m) => m.round === allRounds[ri - 1])
      .sort((a, b) => a.matchNumber - b.matchNumber)

    parentMatches.forEach((parent, pi) => {
      const parentY   = matchY.get(parent.id) ?? 0
      const parentCol = matchCol.get(parent.id) ?? 0
      const side      = matchSide.get(parent.id)

      const feeder1 = prevMatches[2 * pi]
      const feeder2 = prevMatches[2 * pi + 1]
      const f1y = feeder1 ? (matchY.get(feeder1.id) ?? 0) : parentY
      const f2y = feeder2 ? (matchY.get(feeder2.id) ?? f1y) : f1y

      if (side === "left") {
        const feederColX = (ri - 1) * COL_W
        const jx = feederColX + CARD_W + H_GAP / 2
        const parentLx = parentCol * COL_W

        if (feeder1 && !feeder1.isBye) addLine(feederColX + CARD_W, f1y, jx, f1y)
        if (feeder2 && !feeder2.isBye) addLine(feederColX + CARD_W, f2y, jx, f2y)
        if (feeder1 && feeder2) addLine(jx, f1y, jx, f2y) // vertical bracket
        addLine(jx, parentY, parentLx, parentY)

      } else if (side === "right") {
        const feederColX = (2 * (N - 1) - (ri - 1)) * COL_W
        const jx = feederColX - H_GAP / 2
        const parentRx = parentCol * COL_W + CARD_W

        if (feeder1 && !feeder1.isBye) addLine(jx, f1y, feederColX, f1y)
        if (feeder2 && !feeder2.isBye) addLine(jx, f2y, feederColX, f2y)
        if (feeder1 && feeder2) addLine(jx, f1y, jx, f2y) // vertical bracket
        addLine(parentRx, parentY, jx, parentY)

      } else if (side === "center") {
        // Left feeder (semi left, col N-2) → final left edge
        if (feeder1) {
          const f1col = matchCol.get(feeder1.id) ?? (N - 2)
          const jxL = f1col * COL_W + CARD_W + H_GAP / 2
          const finalLx = parentCol * COL_W
          if (!feeder1.isBye) addLine(f1col * COL_W + CARD_W, f1y, jxL, f1y)
          addLine(jxL, f1y, jxL, parentY)
          addLine(jxL, parentY, finalLx, parentY)
        }
        // Right feeder (semi right, col N) → final right edge
        if (feeder2) {
          const f2col = matchCol.get(feeder2.id) ?? N
          const jxR = f2col * COL_W - H_GAP / 2
          const finalRx = parentCol * COL_W + CARD_W
          if (!feeder2.isBye) addLine(f2col * COL_W, f2y, jxR, f2y)
          addLine(jxR, f2y, jxR, parentY)
          addLine(jxR, parentY, finalRx, parentY)
        }
      }
    })
  }

  // ── Final match winner (for champion display) ──
  const finalMatch = nonBye.find((m) => m.round === allRounds[N - 1])
  let championName: string | null = null
  if (finalMatch?.isCompleted) {
    const aWon = (finalMatch.teamAScore ?? 0) > (finalMatch.teamBScore ?? 0)
    const winTeam = aWon ? 0 : 1
    const winPlayers = finalMatch.players.filter((p) => p.team === winTeam).map((p) => p.player)
    if (winPlayers.length > 0) {
      const disp = getTeamDisplay(winPlayers, teamInfoMap)
      championName = disp.label
    }
  }

  // ── Render ──
  return (
    <div style={{ overflowX: "auto", overflowY: "visible" }}>
      <div
        style={{
          position: "relative",
          width: totalW,
          height: totalH + TROPHY_H,
          minWidth: totalW,
        }}
      >
        {/* SVG connector lines — rendered behind cards */}
        <svg
          style={{ position: "absolute", top: TROPHY_H, left: 0, overflow: "visible", pointerEvents: "none" }}
          width={totalW}
          height={totalH}
        >
          {lines.map((l, i) => (
            <line
              key={i}
              x1={l.x1} y1={l.y1}
              x2={l.x2} y2={l.y2}
              stroke="var(--accent)"
              strokeWidth={2}
              strokeLinecap="round"
              strokeOpacity={0.6}
            />
          ))}
        </svg>

        {/* Match cards */}
        {nonBye.map((m) => {
          const col  = matchCol.get(m.id) ?? 0
          const y    = matchY.get(m.id)   ?? 0
          const side = matchSide.get(m.id)
          return (
            <div
              key={m.id}
              style={{
                position: "absolute",
                left: col * COL_W,
                top: y - CARD_H / 2 + TROPHY_H,
                width: CARD_W,
              }}
            >
              <MatchCard match={m} isFinal={side === "center"} teamInfoMap={teamInfoMap} />
            </div>
          )
        })}

        {/* Trophy + tournament name — center column, top */}
        <div
          style={{
            position: "absolute",
            left: (N - 1) * COL_W,
            top: 0,
            width: CARD_W,
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 4,
          }}
        >
          <Trophy
            style={{ width: 28, height: 28, color: "var(--accent)" }}
            aria-hidden="true"
          />
          <p
            className="font-black leading-tight text-white"
            style={{ fontSize: "0.7rem", letterSpacing: "0.04em", maxWidth: CARD_W - 8 }}
          >
            {tournamentName.toUpperCase()}
          </p>
          {championName && (
            <p
              className="font-bold leading-tight text-[var(--accent)]"
              style={{ fontSize: "0.6rem", maxWidth: CARD_W - 8 }}
            >
              🏆 {championName}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
