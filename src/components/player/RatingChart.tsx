"use client"

interface DataPoint {
  date: string
  rating: number
  source: string
}

interface RatingChartProps {
  history: DataPoint[]
  currentRating: number
}

const W = 320
const H = 140
const PAD_X = 40
const PAD_Y = 20
const CHART_W = W - PAD_X - 8
const CHART_H = H - PAD_Y * 2

export function RatingChart({ history, currentRating }: RatingChartProps) {
  // Combine history with "now" point
  const points: DataPoint[] = [
    ...history,
    { date: new Date().toISOString(), rating: currentRating, source: "now" },
  ]

  if (points.length < 2) {
    return (
      <div className="rounded-2xl bg-[var(--surface-2)] p-4 text-center">
        <p className="text-sm text-[var(--muted-text)]">
          Non ci sono ancora abbastanza dati per il grafico rating.
        </p>
      </div>
    )
  }

  const ratings = points.map((p) => p.rating)
  const minR = Math.floor(Math.min(...ratings) / 50) * 50
  const maxR = Math.ceil(Math.max(...ratings) / 50) * 50
  const range = maxR - minR || 100

  function x(i: number) {
    return PAD_X + (i / (points.length - 1)) * CHART_W
  }
  function y(r: number) {
    return PAD_Y + CHART_H - ((r - minR) / range) * CHART_H
  }

  const pathD = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${x(i).toFixed(1)} ${y(p.rating).toFixed(1)}`)
    .join(" ")

  // Gradient fill path
  const fillD = `${pathD} L ${x(points.length - 1).toFixed(1)} ${(PAD_Y + CHART_H).toFixed(1)} L ${x(0).toFixed(1)} ${(PAD_Y + CHART_H).toFixed(1)} Z`

  // Y-axis labels (3 ticks)
  const mid = Math.round((minR + maxR) / 2)
  const yTicks = [minR, mid, maxR]

  return (
    <div className="rounded-2xl bg-[var(--surface-2)] p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-bold uppercase tracking-wider text-[var(--muted-text)]">
          Storico Rating
        </p>
        <p className="text-lg font-black text-[var(--accent)]">
          {Math.round(currentRating)}
          <span className="text-[0.6rem] font-bold uppercase tracking-widest text-[var(--muted-text)] ml-1">
            GLK
          </span>
        </p>
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        style={{ height: "auto", maxHeight: 160 }}
        aria-label="Grafico storico rating"
      >
        {/* Grid lines */}
        {yTicks.map((tick) => (
          <g key={tick}>
            <line
              x1={PAD_X}
              y1={y(tick)}
              x2={W - 8}
              y2={y(tick)}
              stroke="rgba(255,255,255,0.06)"
              strokeWidth={1}
            />
            <text
              x={PAD_X - 6}
              y={y(tick) + 3}
              textAnchor="end"
              className="text-[8px]"
              fill="rgba(255,255,255,0.3)"
            >
              {tick}
            </text>
          </g>
        ))}

        {/* Gradient fill */}
        <defs>
          <linearGradient id="ratingFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.2" />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={fillD} fill="url(#ratingFill)" />

        {/* Line */}
        <path
          d={pathD}
          fill="none"
          stroke="var(--accent)"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Dots */}
        {points.map((p, i) => (
          <circle
            key={i}
            cx={x(i)}
            cy={y(p.rating)}
            r={i === points.length - 1 ? 4 : 2.5}
            fill={p.source === "tournament" ? "var(--accent)" : "var(--foreground)"}
            stroke="var(--surface-2)"
            strokeWidth={1.5}
          />
        ))}
      </svg>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-2">
        <div className="flex items-center gap-1.5">
          <div className="h-2 w-2 rounded-full bg-[var(--accent)]" />
          <span className="text-[0.6rem] text-[var(--muted-text)]">Torneo</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-2 w-2 rounded-full bg-[var(--foreground)]" />
          <span className="text-[0.6rem] text-[var(--muted-text)]">Sessione</span>
        </div>
      </div>
    </div>
  )
}
