import Link from "next/link"
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
 * You, written on the beach photo at the top of the home: greeting, your name
 * by hand, the level ring on the right and one line of numbers. No box around
 * it: the photo is the card.
 */
export function PlayerCrest({ p }: { p: PlayerCrestData }) {
  return (
    <section aria-label={`Il tuo profilo, ${p.firstName}`} className="relative pt-6 [text-shadow:0_2px_16px_rgb(0_0_0/0.45)]">
      <Link href="/profile" className="flex items-end gap-4" aria-label={`Il tuo profilo, ${p.firstName}`}>
        <div className="min-w-0 flex-1">
          <p className="text-lg font-semibold text-white/85">{p.greeting},</p>
          <h1 className="truncate font-hand text-[3.6rem] leading-[1.05] text-white">{p.firstName}</h1>
        </div>
        <LevelRing level={p.level} pct={p.xpPct} avatarUrl={p.avatarUrl} initials={p.initials} size={72} />
      </Link>

      {/* Titles and divisions mean nothing before the first game. */}
      {!p.isNew && (
        <p className="mt-2 flex flex-wrap items-center gap-1.5">
          <span className="rounded-full bg-[var(--accent)] px-2.5 py-1 text-xs font-extrabold text-black [text-shadow:none]">{p.title}</span>
          <span className="flex items-center gap-1.5 rounded-full bg-black/35 px-2.5 py-1 text-xs font-extrabold text-white ring-1 ring-white/15 backdrop-blur-md">
            <span className="h-2 w-2 rounded-full" style={{ background: p.division.color }} aria-hidden="true" />
            {p.division.name}
          </span>
        </p>
      )}

      {p.isNew ? (
        <p className="mt-3 text-base leading-snug text-white/90">
          Parti da <strong className="text-[var(--accent)]">{p.rating} punti</strong>: salgono quando vinci, scendono quando
          perdi. Gioca e scopri il tuo vero livello.
        </p>
      ) : (
        <dl className="mt-4 grid grid-cols-3 divide-x divide-white/15">
          <Stat label="Partite">
            <CountUp value={p.sessions} />
          </Stat>
          <Stat label="Vinte">
            <CountUp value={p.winPct} />%
          </Stat>
          <Stat label="Punti" tone="var(--accent)">
            {p.rating}
          </Stat>
        </dl>
      )}

      {!p.isNew && (
        <div className="mt-3 flex items-center gap-2">
          <Link href="/level-info" className="flex min-h-[2.75rem] flex-1 flex-col justify-center gap-1.5">
            <span className="flex items-baseline justify-between text-sm">
              <span className="font-bold text-white">Livello {p.level}</span>
              <span className="text-white/75">
                {p.matchesToLevel} {p.matchesToLevel === 1 ? "partita" : "partite"} al liv {p.level + 1}
              </span>
            </span>
            <span className="block h-1.5 overflow-hidden rounded-full bg-white/20" aria-hidden="true">
              <span className="xp-bar-fill block h-full rounded-full bg-[var(--accent)]" style={{ width: `${Math.max(4, p.xpPct)}%` }} />
            </span>
          </Link>
          <StatsInfoSheet />
        </div>
      )}

      {p.insight && <p className="mt-2 text-sm font-semibold text-[var(--accent)]">{p.insight}</p>}
    </section>
  )
}

function Stat({ label, tone, children }: { label: string; tone?: string; children: React.ReactNode }) {
  return (
    <div className="px-3 first:pl-0">
      <dt className="text-xs font-bold uppercase tracking-wider text-white/70">{label}</dt>
      <dd className="num mt-1 text-[1.65rem] leading-none" style={{ color: tone ?? "white" }}>
        {children}
      </dd>
    </div>
  )
}
