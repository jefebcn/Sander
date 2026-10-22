import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react"
import { cn } from "@/lib/utils"

const pct = new Intl.NumberFormat("it-IT", { style: "percent", maximumFractionDigits: 0, signDisplay: "exceptZero" })

/**
 * One headline number. The change, when there is one, says which way it went
 * with an arrow and a sign as well as a colour.
 */
export function KpiTile({
  label,
  value,
  change,
  changeLabel = "vs 30 giorni prima",
  hint,
  className,
}: {
  label: string
  value: string
  /** Relative change (0.12 = +12%); null = nothing to compare with yet. */
  change?: number | null
  changeLabel?: string
  hint?: string
  className?: string
}) {
  const Icon = change == null || Math.round(change * 100) === 0 ? Minus : change > 0 ? ArrowUpRight : ArrowDownRight
  const tone = change == null || Math.round(change * 100) === 0 ? "text-[var(--muted-text)]" : change > 0 ? "text-[var(--success)]" : "text-[var(--danger)]"
  return (
    <div className={cn("rounded-2xl bg-[var(--surface-2)] p-4", className)}>
      <p className="text-sm text-[var(--muted-text)]">{label}</p>
      <p className="mt-1 text-3xl font-black tabular-nums text-white">{value}</p>
      {change !== undefined && (
        <p className="mt-1 flex flex-wrap items-center gap-x-1 text-sm">
          <Icon className={cn("h-4 w-4 shrink-0", tone)} aria-hidden="true" />
          <span className={cn("font-bold tabular-nums", tone)}>{change == null ? "—" : pct.format(change)}</span>
          <span className="text-[var(--muted-text)]">{change == null ? "primo periodo misurato" : changeLabel}</span>
        </p>
      )}
      {hint && <p className="mt-1 text-xs text-[var(--muted-text)]">{hint}</p>}
    </div>
  )
}
