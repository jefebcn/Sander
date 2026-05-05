import type { PartnerStat } from "@/actions/players"
import { cn } from "@/lib/utils"

function displayName(p: { name: string; firstName: string | null }) {
  return p.firstName ?? p.name.split(" ")[0]
}

export function PartnerStats({ stats }: { stats: PartnerStat[] }) {
  if (stats.length === 0) return null

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs font-bold uppercase tracking-wider text-[var(--muted-text)]">
        Statistiche partner
      </p>
      <div className="rounded-2xl bg-[var(--surface-2)] overflow-hidden divide-y divide-[var(--border)]">
        {stats.map((s) => {
          const pct = s.winRate
          const color = pct >= 60 ? "var(--live)" : pct <= 40 ? "var(--danger)" : "var(--muted-text)"
          return (
            <div key={s.playerId} className="px-4 py-3 flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-white">{displayName(s.player)}</p>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[var(--muted-text)]">{s.played} part.</span>
                  <span className="text-sm font-black" style={{ color }}>{pct}%</span>
                </div>
              </div>
              <div className="h-1 rounded-full bg-[var(--surface-3)] overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${Math.max(3, pct)}%`, background: color }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
