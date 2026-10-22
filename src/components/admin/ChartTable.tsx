import { formatValue, type Unit } from "./chartFormat"

/** The numbers behind a chart, one tap away: nothing is readable only as a shape. */
export function ChartTable({ rows, unit, valueLabel }: { rows: { label: string; value: number }[]; unit: Unit; valueLabel: string }) {
  return (
    <details className="mt-2 print:hidden">
      <summary className="flex min-h-[2.75rem] cursor-pointer items-center text-sm font-bold text-[var(--muted-text)]">
        Vedi tabella
      </summary>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-[var(--muted-text)]">
            <th className="pb-1 font-medium">Periodo</th>
            <th className="pb-1 text-right font-medium">{valueLabel}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.label} className="border-t border-[var(--border)]">
              <td className="py-1.5 text-white">{r.label}</td>
              <td className="py-1.5 text-right tabular-nums text-white">{formatValue(r.value, unit)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </details>
  )
}
