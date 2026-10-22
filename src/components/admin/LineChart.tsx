"use client"

import { useRef, useState, type KeyboardEvent, type PointerEvent } from "react"
import { cn } from "@/lib/utils"
import { formatTick, formatValue, niceTicks, type Unit } from "./chartFormat"
import { ChartTable } from "./ChartTable"

export interface LinePoint {
  label: string
  full: string
  value: number
}

/**
 * A running total over time: one 2px line with a faint wash under it, the
 * latest value at its end, a crosshair with the exact value wherever you point.
 */
export function LineChart({ data, unit = "count", valueLabel }: { data: LinePoint[]; unit?: Unit; valueLabel: string }) {
  const plot = useRef<HTMLDivElement>(null)
  const [hover, setHover] = useState<number | null>(null)
  const ticks = niceTicks(Math.max(0, ...data.map((d) => d.value)), unit)
  const top = ticks[ticks.length - 1]
  const last = data.length - 1
  const x = (i: number) => (last > 0 ? (i / last) * 100 : 50)
  const y = (v: number) => 100 - (v / top) * 100

  const line = data.map((d, i) => `${i === 0 ? "M" : "L"}${x(i)},${y(d.value)}`).join(" ")
  const area = `${line} L${x(last)},100 L${x(0)},100 Z`

  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    const box = plot.current?.getBoundingClientRect()
    if (!box || last < 0) return
    const f = Math.min(1, Math.max(0, (e.clientX - box.left) / box.width))
    setHover(Math.round(f * last))
  }
  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return
    e.preventDefault()
    const from = hover ?? last
    setHover(Math.min(last, Math.max(0, from + (e.key === "ArrowRight" ? 1 : -1))))
  }

  const at = hover ?? last
  const point = data[at]
  // Four dates under the line: first, two in between, last.
  const marks = [...new Set([0, Math.round(last / 3), Math.round((2 * last) / 3), last])]

  return (
    <figure>
      <div
        ref={plot}
        tabIndex={0}
        role="img"
        aria-label={point ? `${valueLabel}: ${formatValue(point.value, unit)} (${point.full}). Frecce per scorrere.` : valueLabel}
        onPointerMove={onMove}
        onPointerLeave={() => setHover(null)}
        onKeyDown={onKey}
        onBlur={() => setHover(null)}
        className="relative ml-12 mr-3 h-48 touch-pan-y outline-none"
      >
        {ticks.map((t) => (
          <div key={t} className="absolute inset-x-0 border-t border-[var(--border)]" style={{ bottom: `${(t / top) * 100}%` }}>
            <span className="absolute right-full mr-2 -translate-y-1/2 whitespace-nowrap text-xs tabular-nums text-[var(--muted-text)]">
              {formatTick(t, unit)}
            </span>
          </div>
        ))}
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full overflow-visible" aria-hidden="true">
          <path d={area} fill="color-mix(in srgb, var(--accent) 10%, transparent)" />
          <path d={line} fill="none" stroke="var(--accent)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
        </svg>
        {point && (
          <>
            {hover !== null && (
              <div className="pointer-events-none absolute inset-y-0 w-px bg-white/30" style={{ left: `${x(at)}%` }} />
            )}
            <div
              className="pointer-events-none absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--accent)] ring-2 ring-[var(--surface-1)]"
              style={{ left: `${x(at)}%`, top: `${y(point.value)}%` }}
            />
            <div
              className={cn(
                "pointer-events-none absolute z-10 whitespace-nowrap rounded-lg px-2 py-1 text-xs",
                hover !== null && "bg-[var(--background)] shadow-lg ring-1 ring-white/20",
                x(at) > 70 ? "-translate-x-full -ml-2" : "ml-2",
              )}
              style={{ left: `${x(at)}%`, top: `calc(${y(point.value)}% - 2.75rem)` }}
            >
              {hover !== null && <span className="block text-[var(--muted-text)]">{point.full}</span>}
              <span className="block text-sm font-bold tabular-nums text-white">{formatValue(point.value, unit)}</span>
            </div>
          </>
        )}
      </div>
      <div className="relative ml-12 mr-3 mt-1.5 h-4">
        {marks.map((i) => (
          <span
            key={i}
            className={cn(
              "absolute whitespace-nowrap text-xs text-[var(--muted-text)]",
              i === 0 ? "" : i === last ? "-translate-x-full" : "-translate-x-1/2",
            )}
            style={{ left: `${x(i)}%` }}
          >
            {data[i]?.label}
          </span>
        ))}
      </div>
      <ChartTable rows={data.map((d) => ({ label: d.full, value: d.value }))} unit={unit} valueLabel={valueLabel} />
    </figure>
  )
}
