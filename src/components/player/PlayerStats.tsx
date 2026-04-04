import { Trophy, Target, Users, TrendingUp } from "lucide-react"

// ─── Types ────────────────────────────────────────────────────────────────────

interface StatPcts {
  attPct: number
  difPct: number
  murPct: number
  alzPct: number
  ricPct: number
  staPct: number
}

interface PlayerStatsProps {
  player: {
    matchesWon: number
    matchesLost: number
    tournamentsWon: number
    sessionsPlayed: number
    winRatePct: number
  } & StatPcts
  communityAvg: StatPcts
  tournamentsByType: Record<string, number>
}

// ─── Radar Chart ──────────────────────────────────────────────────────────────

const STAT_LABELS = ["ATT", "DIF", "MUR", "ALZ", "RIC", "STA"] as const
const STAT_KEYS: (keyof StatPcts)[] = ["attPct", "difPct", "murPct", "alzPct", "ricPct", "staPct"]

const CX = 100
const CY = 100
const R = 70

function polarToXY(angle: number, radius: number): [number, number] {
  const rad = (angle - 90) * (Math.PI / 180)
  return [CX + radius * Math.cos(rad), CY + radius * Math.sin(rad)]
}

function polygonPoints(values: number[], max: number): string {
  return values
    .map((v, i) => {
      const angle = (360 / values.length) * i
      const r = (v / max) * R
      const [x, y] = polarToXY(angle, r)
      return `${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(" ")
}

function RadarChart({ player, community }: { player: StatPcts; community: StatPcts }) {
  const playerValues = STAT_KEYS.map((k) => player[k])
  const communityValues = STAT_KEYS.map((k) => community[k])
  const max = 40 // max realistic stat percentage

  // Grid rings
  const rings = [10, 20, 30, 40]

  return (
    <svg viewBox="0 0 200 200" className="w-full" style={{ maxHeight: 200 }}>
      {/* Grid rings */}
      {rings.map((r) => (
        <polygon
          key={r}
          points={Array.from({ length: 6 }, (_, i) => {
            const angle = (360 / 6) * i
            const radius = (r / max) * R
            const [x, y] = polarToXY(angle, radius)
            return `${x.toFixed(1)},${y.toFixed(1)}`
          }).join(" ")}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={1}
        />
      ))}

      {/* Axis lines */}
      {STAT_LABELS.map((_, i) => {
        const angle = (360 / 6) * i
        const [x, y] = polarToXY(angle, R)
        return (
          <line
            key={i}
            x1={CX}
            y1={CY}
            x2={x}
            y2={y}
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={1}
          />
        )
      })}

      {/* Community polygon */}
      <polygon
        points={polygonPoints(communityValues, max)}
        fill="rgba(255,255,255,0.05)"
        stroke="rgba(255,255,255,0.2)"
        strokeWidth={1}
        strokeDasharray="4 2"
      />

      {/* Player polygon */}
      <polygon
        points={polygonPoints(playerValues, max)}
        fill="rgba(201,243,29,0.12)"
        stroke="var(--accent)"
        strokeWidth={2}
        strokeLinejoin="round"
      />

      {/* Dots on player polygon */}
      {playerValues.map((v, i) => {
        const angle = (360 / 6) * i
        const r = (v / max) * R
        const [x, y] = polarToXY(angle, r)
        return (
          <circle
            key={i}
            cx={x}
            cy={y}
            r={3}
            fill="var(--accent)"
            stroke="var(--surface-2)"
            strokeWidth={1.5}
          />
        )
      })}

      {/* Labels */}
      {STAT_LABELS.map((label, i) => {
        const angle = (360 / 6) * i
        const [x, y] = polarToXY(angle, R + 14)
        return (
          <text
            key={label}
            x={x}
            y={y}
            textAnchor="middle"
            dominantBaseline="central"
            className="text-[8px] font-bold"
            fill="rgba(255,255,255,0.5)"
          >
            {label}
          </text>
        )
      })}
    </svg>
  )
}

// ─── Tournament type labels ───────────────────────────────────────────────────

const TYPE_LABELS: Record<string, string> = {
  KING_OF_THE_BEACH: "King of the Beach",
  BRACKETS: "Eliminazione diretta",
  ROUND_ROBIN: "Girone all'italiana",
  DOUBLE_ELIMINATION: "Doppia eliminazione",
  CHICECE: "Chicece",
}

// ─── Main component ──────────────────────────────────────────────────────────

export function PlayerStats({ player, communityAvg, tournamentsByType }: PlayerStatsProps) {
  const totalTournaments = Object.values(tournamentsByType).reduce((a, b) => a + b, 0)
  const maxTypeCount = Math.max(1, ...Object.values(tournamentsByType))

  return (
    <div className="space-y-4">
      {/* Career summary */}
      <div className="rounded-2xl bg-[var(--surface-2)] p-4">
        <p className="text-xs font-bold uppercase tracking-wider text-[var(--muted-text)] mb-3">
          Carriera
        </p>
        <div className="grid grid-cols-4 gap-3">
          {[
            { icon: Trophy, label: "Tornei vinti", value: player.tournamentsWon, color: "var(--accent)" },
            { icon: Target, label: "Win rate", value: `${player.winRatePct}%`, color: "var(--accent)" },
            { icon: Users, label: "Sessioni", value: player.sessionsPlayed, color: "var(--foreground)" },
            { icon: TrendingUp, label: "V / S", value: `${player.matchesWon}/${player.matchesLost}`, color: "var(--foreground)" },
          ].map(({ icon: Icon, label, value, color }) => (
            <div key={label} className="flex flex-col items-center gap-1 text-center">
              <Icon className="h-4 w-4" style={{ color }} />
              <span className="text-lg font-black text-white">{value}</span>
              <span className="text-[0.55rem] text-[var(--muted-text)] leading-tight">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Radar chart */}
      <div className="rounded-2xl bg-[var(--surface-2)] p-4">
        <div className="flex items-center justify-between mb-1">
          <p className="text-xs font-bold uppercase tracking-wider text-[var(--muted-text)]">
            Distribuzione skill
          </p>
        </div>
        <RadarChart player={player} community={communityAvg} />
        <div className="flex items-center justify-center gap-4 mt-1">
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-[var(--accent)]" />
            <span className="text-[0.6rem] text-[var(--muted-text)]">Tu</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-white/20" />
            <span className="text-[0.6rem] text-[var(--muted-text)]">Media community</span>
          </div>
        </div>
      </div>

      {/* Tournaments by type */}
      {totalTournaments > 0 && (
        <div className="rounded-2xl bg-[var(--surface-2)] p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-[var(--muted-text)] mb-3">
            Tornei per tipo
          </p>
          <div className="space-y-2">
            {Object.entries(tournamentsByType)
              .sort(([, a], [, b]) => b - a)
              .map(([type, count]) => (
                <div key={type} className="flex items-center gap-3">
                  <span className="text-xs text-[var(--muted-text)] w-28 shrink-0 truncate">
                    {TYPE_LABELS[type] ?? type}
                  </span>
                  <div className="flex-1 h-2 rounded-full overflow-hidden bg-[var(--surface-3)]">
                    <div
                      className="h-full rounded-full bg-[var(--accent)]"
                      style={{ width: `${(count / maxTypeCount) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold text-white w-5 text-right">{count}</span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  )
}
