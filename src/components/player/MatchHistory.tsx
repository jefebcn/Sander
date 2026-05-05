import Link from "next/link"
import { Trophy, Volleyball } from "lucide-react"
import type { MatchHistoryEntry } from "@/actions/players"
import { cn } from "@/lib/utils"

function shortName(p: { name: string; firstName: string | null }) {
  return p.firstName ?? p.name.split(" ")[0]
}

const MONTH_SHORT = ["gen", "feb", "mar", "apr", "mag", "giu", "lug", "ago", "set", "ott", "nov", "dic"]

export function MatchHistory({ entries }: { entries: MatchHistoryEntry[] }) {
  if (entries.length === 0) return null

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs font-bold uppercase tracking-wider text-[var(--muted-text)]">
        Storico partite
      </p>
      <div className="rounded-2xl bg-[var(--surface-2)] overflow-hidden divide-y divide-[var(--border)]">
        {entries.map((e) => {
          const d = new Date(e.date)
          const dateLabel = `${d.getDate()} ${MONTH_SHORT[d.getMonth()]}`
          const href = e.type === "tournament" ? `/tournaments/${e.sourceId}` : `/sessions/${e.sourceId}`
          const won = e.result === "won"

          return (
            <Link key={e.id} href={href} className="flex items-center gap-3 px-4 py-3 active:opacity-70">
              {/* Date */}
              <div className="w-10 shrink-0 text-center">
                <p className="text-[0.65rem] font-bold uppercase text-[var(--muted-text)]">{dateLabel}</p>
              </div>

              {/* Result badge */}
              <div
                className={cn(
                  "w-7 h-7 shrink-0 flex items-center justify-center rounded-lg text-xs font-black",
                  won ? "bg-[var(--live)]/15 text-[var(--live)]" : "bg-[var(--danger)]/15 text-[var(--danger)]",
                )}
              >
                {won ? "V" : "S"}
              </div>

              {/* Source + players */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  {e.type === "tournament"
                    ? <Trophy className="h-3 w-3 shrink-0 text-[var(--accent)]" />
                    : <Volleyball className="h-3 w-3 shrink-0 text-[var(--muted-text)]" />}
                  <p className="text-xs text-[var(--muted-text)] truncate">{e.sourceName}</p>
                </div>
                <p className="text-sm font-semibold text-white leading-snug">
                  {e.partners.length > 0 && (
                    <span className="text-[var(--accent)]">{e.partners.map(shortName).join(" + ")}</span>
                  )}
                  {e.partners.length > 0 && e.opponents.length > 0 && (
                    <span className="text-[var(--muted-text)]"> vs </span>
                  )}
                  {e.opponents.length > 0 && (
                    <span>{e.opponents.map(shortName).join(" + ")}</span>
                  )}
                </p>
              </div>

              {/* Score */}
              <div className="shrink-0 text-right">
                <p className={cn("text-sm font-black", won ? "text-[var(--live)]" : "text-[var(--danger)]")}>
                  {e.myTeam === 0 ? `${e.scoreA}–${e.scoreB}` : `${e.scoreB}–${e.scoreA}`}
                </p>
                {e.isSetScore && (
                  <p className="text-[0.6rem] text-[var(--muted-text)]">set</p>
                )}
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
