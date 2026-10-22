"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { formatTick, formatValue, niceTicks, type Unit } from "./chartFormat"
import { ChartTable } from "./ChartTable"

export interface ColumnPoint {
  /** Under the column: "ott". */
  label: string
  /** In the tooltip and the table: "ottobre 2026". */
  full: string
  value: number
}

/**
 * One series over time as columns. The latest value sits on its column;
 * every other value is a hover (or keyboard focus) away, and in the table.
 */
export function ColumnChart({ data, unit = "count", valueLabel }: { data: ColumnPoint[]; unit?: Unit; valueLabel: string }) {
  const [hover, setHover] = useState<number | null>(null)
  const ticks = niceTicks(Math.max(0, ...data.map((d) => d.value)), unit)
  const top = ticks[ticks.length - 1]
  const last = data.length - 1
  const dense = data.length > 8

  return (
    <figure>
      <div className="relative ml-12 mr-1 h-48" onPointerLeave={() => setHover(null)}>
        {ticks.map((t) => (
          <div key={t} className="absolute inset-x-0 border-t border-[var(--border)]" style={{ bottom: `${(t / top) * 100}%` }}>
            <span className="absolute right-full mr-2 -translate-y-1/2 whitespace-nowrap text-xs tabular-nums text-[var(--muted-text)]">
              {formatTick(t, unit)}
            </span>
          </div>
        ))}
        <div className="absolute inset-0 flex items-end gap-[2px]">
          {data.map((d, i) => {
            const h = (d.value / top) * 100
            const shown = hover === i || (hover === null && i === last)
            return (
              <div
                key={d.full}
                tabIndex={0}
                aria-label={`${d.full}: ${formatValue(d.value, unit)}`}
                onPointerEnter={() => setHover(i)}
                onFocus={() => setHover(i)}
                onBlur={() => setHover(null)}
                className="relative flex h-full min-w-0 flex-1 items-end justify-center outline-none"
              >
                {d.value > 0 && (
                  <div
                    className="w-full max-w-6 rounded-t-[4px] bg-[var(--accent)] transition-opacity duration-150"
                    style={{ height: `max(${h}%, 3px)`, opacity: hover === null || hover === i ? 1 : 0.4 }}
                  />
                )}
                {shown && (
                  <div
                    className={cn(
                      "pointer-events-none absolute z-10 whitespace-nowrap rounded-lg px-2 py-1 text-xs",
                      hover === i ? "bg-[var(--background)] shadow-lg ring-1 ring-white/20" : "",
                      i === 0 ? "left-0" : i === last ? "right-0" : "left-1/2 -translate-x-1/2",
                    )}
                    style={{ bottom: `calc(${h}% + 6px)` }}
                  >
                    {hover === i && <span className="block text-[var(--muted-text)]">{d.full}</span>}
                    <span className="block text-sm font-bold tabular-nums text-white">{formatValue(d.value, unit)}</span>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
      <div className="ml-12 mr-1 mt-1.5 flex gap-[2px]">
        {data.map((d, i) => (
          <span
            key={d.full}
            className={cn(
              "min-w-0 flex-1 truncate text-center text-xs text-[var(--muted-text)]",
              dense && i % 2 === 1 && i !== last && "max-sm:invisible",
            )}
          >
            {d.label}
          </span>
        ))}
      </div>
      <ChartTable rows={data.map((d) => ({ label: d.full, value: d.value }))} unit={unit} valueLabel={valueLabel} />
    </figure>
  )
}
