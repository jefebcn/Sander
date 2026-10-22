import { formatValue } from "./chartFormat"

export interface BarItem {
  label: string
  value: number
  /** Beside the value: "54% degli iscritti". */
  note?: string
}

/** A ranked list as horizontal bars, every value written at the bar's end. */
export function BarList({ items, max }: { items: BarItem[]; max?: number }) {
  const top = max ?? Math.max(1, ...items.map((i) => i.value))
  return (
    <ul className="flex flex-col gap-2">
      {items.map((item) => (
        <li key={item.label} className="grid grid-cols-[minmax(0,9rem)_1fr] items-center gap-3">
          <span className="truncate text-sm text-white">{item.label}</span>
          <span className="flex min-w-0 items-center gap-2">
            <span
              className="h-6 shrink-0 rounded-r-[4px] bg-[var(--accent)]"
              style={{ width: `calc(${(item.value / top) * 100}% * 0.7)`, minWidth: item.value > 0 ? 3 : 0 }}
            />
            <span className="whitespace-nowrap text-sm tabular-nums text-white">
              <strong>{formatValue(item.value, "count")}</strong>
              {item.note && <span className="text-[var(--muted-text)]"> · {item.note}</span>}
            </span>
          </span>
        </li>
      ))}
    </ul>
  )
}
