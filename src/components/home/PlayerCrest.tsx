import Link from "next/link"
import { Crown, ChevronRight } from "lucide-react"
import { CountUp } from "@/components/ui/CountUp"
import { StatsInfoSheet } from "./StatsInfoSheet"
import { LevelRing } from "./LevelRing"
import { Crest } from "./Crest"

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
  division: { name: string; next: string | null; pointsToNext: number | null }
  insight: string | null
}

/**
 * You, drawn like the logo: the crown over the ball (your face), the shield
 * around it, your numbers on the bar of the crest.
 */
export function PlayerCrest({ p }: { p: PlayerCrestData }) {
  return (
    <section className="relative">
      <div aria-hidden="true" className="crest-sun pointer-events-none absolute -inset-x-4 -top-10 h-80" />
      <Crest tip="2.25rem" innerClassName="px-5 pb-14 pt-10">
        <Link href="/profile" className="flex flex-col items-center text-center" aria-label={`Il tuo profilo, ${p.firstName}`}>
          <span className="relative">
            <Crown
              aria-hidden="true"
              className="absolute -top-[2.2rem] left-1/2 h-8 w-8 -translate-x-1/2 text-[var(--accent)]"
              strokeWidth={2}
              fill="currentColor"
            />
            <LevelRing level={p.level} pct={p.xpPct} avatarUrl={p.avatarUrl} initials={p.initials} size={92} />
          </span>
          <h1 className="mt-4 flex max-w-full flex-col items-center">
            <span className="text-sm font-semibold text-[var(--muted-text)]">{p.greeting},</span>
            <span className="max-w-full truncate font-display text-[2.6rem] font-black uppercase leading-[0.9] tracking-wide text-white">
              {p.firstName}
            </span>
          </h1>
          {/* Titles and divisions mean nothing before the first game. */}
          {!p.isNew && (
            <span className="mt-2.5 flex flex-wrap justify-center gap-1.5">
              <span className="rounded-full bg-[var(--accent-soft)] px-2.5 py-1 text-xs font-extrabold uppercase tracking-wider text-[var(--accent)]">
                {p.title}
              </span>
              <span className="rounded-full px-2.5 py-1 text-xs font-extrabold uppercase tracking-wider text-white ring-1 ring-[var(--crest-hair)]">
                Divisione {p.division.name}
              </span>
            </span>
          )}
        </Link>

        {p.isNew ? (
          <p className="mt-5 rounded-[var(--radius-sm)] bg-black/40 px-3 py-2.5 text-center text-base text-white/85 ring-1 ring-[var(--crest-hair)]">
            Parti da <strong className="text-[var(--accent)]">{p.rating} punti</strong>: salgono quando vinci,
            scendono quando perdi. Gioca e scopri il tuo vero livello.
          </p>
        ) : (
          <div className="mt-5 grid grid-cols-3 divide-x divide-[var(--crest-hair)] border-y border-[var(--crest-hair)] py-3">
            <div className="text-center">
              <CountUp value={p.sessions} className="num block text-3xl leading-none text-white" />
              <p className="mt-1 text-xs font-bold uppercase tracking-wider text-[var(--muted-text)]">Partite</p>
            </div>
            <div className="text-center">
              <p className="num text-3xl leading-none text-white">
                <CountUp value={p.winPct} />%
              </p>
              <p className="mt-1 text-xs font-bold uppercase tracking-wider text-[var(--muted-text)]">Vinte</p>
            </div>
            <div className="text-center">
              <p className="num text-3xl leading-none text-[var(--accent)]">{p.rating}</p>
              <p className="mt-1 text-xs font-bold uppercase tracking-wider text-[var(--muted-text)]">Punti</p>
            </div>
          </div>
        )}

        {!p.isNew && (
        <div className="mt-4 flex items-center gap-2">
          <Link href="/level-info" className="flex min-h-[2.75rem] flex-1 items-center gap-3">
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-[var(--surface-4)]" aria-hidden="true">
              <div className="xp-bar-fill h-full rounded-full bg-[var(--accent)]" style={{ width: `${Math.max(3, p.xpPct)}%` }} />
            </div>
            <span className="shrink-0 text-sm font-bold text-white">
              {p.matchesToLevel} {p.matchesToLevel === 1 ? "partita" : "partite"} al{" "}
              <span className="text-[var(--accent)]">liv {p.level + 1}</span>
            </span>
            <ChevronRight className="h-4 w-4 shrink-0 text-[var(--muted-text)]" aria-hidden="true" />
          </Link>
          <StatsInfoSheet />
        </div>
        )}

        {p.insight && (
          <p className="mt-2 rounded-[var(--radius-sm)] bg-[var(--accent-soft)] px-3 py-2 text-center text-sm font-semibold text-[var(--accent)]">
            {p.insight}
          </p>
        )}
      </Crest>
    </section>
  )
}
