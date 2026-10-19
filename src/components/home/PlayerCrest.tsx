import Link from "next/link"
import { ChevronRight } from "lucide-react"
import { CountUp } from "@/components/ui/CountUp"
import { StatsInfoSheet } from "./StatsInfoSheet"
import { LevelRing } from "./LevelRing"

export interface PlayerCrestData {
  greeting: string
  firstName: string
  initials: string
  avatarUrl: string | null
  title: string
  level: number
  /** 0–100 through the current level. */
  xpPct: number
  /** Matches (10 XP each) still needed for the next level. */
  matchesToLevel: number
  isNew: boolean
  sessions: number
  winPct: number
  /** Rating in points, the unit of every board and of the match recap. */
  rating: number
  division: { name: string; color: string; next: string | null; pointsToNext: number | null }
  insight: string | null
}

/**
 * You, at a glance, like a game HUD: face and level on the left, name and
 * rank on the right, three numbers underneath and the bar to the next level.
 * Compact on purpose: the first screen also has to show what to do next.
 */
export function PlayerCrest({ p }: { p: PlayerCrestData }) {
  return (
    <section
      aria-label={`Il tuo profilo, ${p.firstName}`}
      className="relative overflow-hidden rounded-[var(--radius-lg)] p-4 shadow-[var(--shadow-card)] ring-1 ring-[var(--crest-hair)]"
      style={{
        background:
          "radial-gradient(90% 80% at 0% 0%, color-mix(in srgb, var(--accent) 22%, transparent), transparent 60%), radial-gradient(70% 60% at 100% 0%, color-mix(in srgb, var(--love) 10%, transparent), transparent 70%), var(--surface-2)",
      }}
    >
      <Link href="/profile" className="flex items-center gap-4" aria-label={`Il tuo profilo, ${p.firstName}`}>
        <LevelRing level={p.level} pct={p.xpPct} avatarUrl={p.avatarUrl} initials={p.initials} size={80} />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-[var(--muted-text)]">{p.greeting},</p>
          <h1 className="truncate font-display text-[2.1rem] font-extrabold leading-[1.02] text-white">{p.firstName}</h1>
          {/* Titles and divisions mean nothing before the first game. */}
          {!p.isNew && (
            <p className="mt-1.5 flex flex-wrap items-center gap-1.5">
              <span className="rounded-full bg-[var(--accent-soft)] px-2.5 py-1 text-xs font-extrabold text-[var(--accent)]">{p.title}</span>
              <span className="flex items-center gap-1.5 rounded-full bg-black/25 px-2.5 py-1 text-xs font-extrabold text-white ring-1 ring-[var(--crest-hair)]">
                <span className="h-2 w-2 rounded-full" style={{ background: p.division.color }} aria-hidden="true" />
                {p.division.name}
              </span>
            </p>
          )}
        </div>
        <ChevronRight className="h-5 w-5 shrink-0 text-[var(--muted-text)]" aria-hidden="true" />
      </Link>

      {p.isNew ? (
        <p className="mt-4 rounded-[var(--radius-md)] bg-black/25 px-4 py-3 text-base text-white/90 ring-1 ring-[var(--crest-hair)]">
          Parti da <strong className="text-[var(--compete)]">{p.rating} punti</strong>: salgono quando vinci, scendono quando
          perdi. Gioca e scopri il tuo vero livello.
        </p>
      ) : (
        <dl className="mt-4 grid grid-cols-3 gap-2">
          <Stat label="Partite">
            <CountUp value={p.sessions} />
          </Stat>
          <Stat label="Vinte">
            <CountUp value={p.winPct} />%
          </Stat>
          <Stat label="Punti" tone="var(--compete)">
            {p.rating}
          </Stat>
        </dl>
      )}

      {!p.isNew && (
        <div className="mt-3 flex items-center gap-2">
          <Link href="/level-info" className="flex min-h-[2.75rem] flex-1 flex-col justify-center gap-1.5">
            <span className="flex items-baseline justify-between text-sm">
              <span className="font-bold text-white">Livello {p.level}</span>
              <span className="text-[var(--muted-text)]">
                {p.matchesToLevel} {p.matchesToLevel === 1 ? "partita" : "partite"} al liv {p.level + 1}
              </span>
            </span>
            <span className="block h-2.5 overflow-hidden rounded-full bg-black/35" aria-hidden="true">
              <span
                className="xp-bar-fill block h-full rounded-full"
                style={{ width: `${Math.max(4, p.xpPct)}%`, background: "linear-gradient(90deg, var(--accent), var(--sky))" }}
              />
            </span>
          </Link>
          <StatsInfoSheet />
        </div>
      )}

      {p.insight && (
        <p className="mt-3 rounded-[var(--radius-md)] bg-[var(--accent-soft)] px-3 py-2 text-sm font-semibold text-[var(--accent)]">{p.insight}</p>
      )}
    </section>
  )
}

function Stat({ label, tone, children }: { label: string; tone?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[var(--radius-md)] bg-black/25 px-3 py-2.5 ring-1 ring-[var(--crest-hair)]">
      <dt className="text-xs font-bold uppercase tracking-wider text-[var(--muted-text)]">{label}</dt>
      <dd className="num mt-1 text-[1.65rem] leading-none" style={{ color: tone ?? "white" }}>
        {children}
      </dd>
    </div>
  )
}
