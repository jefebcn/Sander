import { Star, BarChart2, Trophy, ClipboardList, Shield, Hand } from "lucide-react"

interface FifaCardPlayer {
  name: string
  firstName?: string | null
  lastName?: string | null
  avatarUrl?: string | null
  avgRating: number
  glickoRating: number
  level: number
  xp: number
  winRatePct: number
  matchesWon: number
  matchesLost: number
  sessionsPlayed: number
  tournamentsWon: number
  organizedSessions: number
  streak: number
  mvpCount: number
  // stat distribution (must sum to 100)
  attPct: number
  difPct: number
  murPct: number
  alzPct: number
  ricPct: number
  staPct: number
}

interface SanderCardFifaProps {
  player: FifaCardPlayer
}

function statValue(pct: number, glicko: number) {
  return Math.round(glicko / 40 + pct)
}

export function SanderCardFifa({ player }: SanderCardFifaProps) {
  const avgDisplay = player.avgRating > 0 ? (player.avgRating / 10).toFixed(1) : "—"
  const glickoDisplay = Math.round(player.glickoRating)
  const streakPct = player.matchesWon + player.matchesLost > 0
    ? Math.round((player.matchesWon / (player.matchesWon + player.matchesLost)) * 100)
    : 0

  const att = statValue(player.attPct, player.glickoRating)
  const dif = statValue(player.difPct, player.glickoRating)
  const mur = statValue(player.murPct, player.glickoRating)
  const alz = statValue(player.alzPct, player.glickoRating)
  const ric = statValue(player.ricPct, player.glickoRating)
  const sta = statValue(player.staPct, player.glickoRating)

  return (
    <div
      className="relative overflow-hidden rounded-3xl"
      style={{
        background: "linear-gradient(160deg, #1a3a0f 0%, #0e2208 40%, #061508 100%)",
        border: "1px solid rgba(201,243,29,0.15)",
        boxShadow: "0 8px 40px rgba(0,0,0,0.6), inset 0 1px 0 rgba(201,243,29,0.08)",
      }}
    >
      {/* Subtle pitch texture overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 28px, rgba(255,255,255,0.6) 28px, rgba(255,255,255,0.6) 29px)",
        }}
      />

      <div className="relative px-6 pt-7 pb-6 space-y-5">

        {/* ── Top row: overall (glicko) + avatar ─────────────── */}
        <div className="flex items-start justify-between">
          <div className="flex flex-col items-start gap-2">
            <span
              className="text-[4rem] font-black leading-none text-white"
              style={{ textShadow: "0 2px 12px rgba(0,0,0,0.4)" }}
            >
              {glickoDisplay}
            </span>
            <span
              className="flex items-center gap-1 rounded-lg px-2 py-0.5 text-xs font-black uppercase tracking-wider"
              style={{
                background: player.difPct >= player.murPct
                  ? "rgba(59,130,246,0.25)"
                  : "rgba(239,68,68,0.25)",
                color: player.difPct >= player.murPct ? "#93c5fd" : "#fca5a5",
                border: `1px solid ${player.difPct >= player.murPct ? "rgba(59,130,246,0.4)" : "rgba(239,68,68,0.4)"}`,
              }}
            >
              {player.difPct >= player.murPct
                ? <><Shield className="h-3 w-3" /> DIF</>
                : <><span className="flex gap-px"><Hand className="h-3 w-3 -scale-x-100" /><Hand className="h-3 w-3" /></span> MUR</>
              }
            </span>
            <span
              className="text-[0.65rem] font-bold uppercase tracking-widest"
              style={{ color: "rgba(255,255,255,0.45)" }}
            >
              Glicko-2
            </span>
            <span className="text-2xl">🇮🇹</span>
            <div
              className="flex h-10 w-10 items-center justify-center rounded-full text-xs font-black text-[var(--accent)]"
              style={{
                background: "rgba(0,0,0,0.55)",
                border: "1.5px solid rgba(201,243,29,0.3)",
              }}
            >
              {player.level}
            </div>
          </div>

          <div
            className="h-32 w-32 overflow-hidden rounded-full flex-shrink-0 mt-2"
            style={{
              border: "3px solid rgba(201,243,29,0.3)",
              boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
            }}
          >
            {player.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={player.avatarUrl}
                alt={player.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div
                className="h-full w-full flex items-center justify-center text-4xl font-black text-[var(--accent)]"
                style={{ background: "rgba(201,243,29,0.1)" }}
              >
                {(player.firstName ?? player.name.split(" ")[0] ?? "?")[0].toUpperCase()}
                {(player.lastName ?? player.name.split(" ")[1] ?? "")[0]?.toUpperCase() ?? ""}
              </div>
            )}
          </div>
        </div>

        {/* ── Player name ───────────────────────────────────── */}
        <h2
          className="text-center text-3xl font-black tracking-tight text-white"
          style={{ textShadow: "0 2px 8px rgba(0,0,0,0.5)" }}
        >
          {player.firstName && player.lastName
            ? `${player.firstName} ${player.lastName}`
            : player.name}
        </h2>

        {/* ── PLA / AVG / MotM / ORG ────────────────────────── */}
        <div
          className="grid grid-cols-4 divide-x"
          style={{ borderColor: "rgba(255,255,255,0.1)", borderTop: "1px solid rgba(255,255,255,0.1)", borderBottom: "1px solid rgba(255,255,255,0.1)", paddingTop: "0.75rem", paddingBottom: "0.75rem" }}
        >
          {[
            { label: "PLA",  icon: Star,          value: player.sessionsPlayed },
            { label: "AVG",  icon: BarChart2,      value: avgDisplay },
            { label: "MotM", icon: Trophy,         value: player.mvpCount },
            { label: "ORG",  icon: ClipboardList,  value: player.organizedSessions },
          ].map(({ label, icon: Icon, value }) => (
            <div key={label} className="flex flex-col items-center gap-1" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
              <span className="text-[0.65rem] font-bold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.55)" }}>
                {label}
              </span>
              <div className="flex items-center gap-1">
                <Icon className="h-3.5 w-3.5 text-[var(--accent)]" />
                <span className="text-lg font-black text-white">{value}</span>
              </div>
            </div>
          ))}
        </div>

        {/* ── ATT / DIF / MUR / ALZ / RIC / STA — 3×2 grid ── */}
        <div
          className="grid grid-cols-3"
          style={{ borderTop: "1px solid rgba(255,255,255,0.1)" }}
        >
          {[
            { label: "ATT", value: att, pct: player.attPct },
            { label: "DIF", value: dif, pct: player.difPct },
            { label: "MUR", value: mur, pct: player.murPct },
            { label: "ALZ", value: alz, pct: player.alzPct },
            { label: "RIC", value: ric, pct: player.ricPct },
            { label: "STA", value: sta, pct: player.staPct },
          ].map(({ label, value, pct }, i) => (
            <div
              key={label}
              className="flex flex-col px-3 py-3"
              style={{
                borderRight: (i + 1) % 3 !== 0 ? "1px solid rgba(255,255,255,0.1)" : undefined,
                borderBottom: i < 3 ? "1px solid rgba(255,255,255,0.1)" : undefined,
              }}
            >
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-black text-white leading-none">{value}</span>
                <span className="text-xs font-bold" style={{ color: "rgba(255,255,255,0.5)" }}>{label}</span>
              </div>
              <span className="mt-0.5 text-[0.6rem]" style={{ color: "rgba(255,255,255,0.3)" }}>
                {pct}%
              </span>
            </div>
          ))}
        </div>

        {/* ── Streak bar ────────────────────────────────────── */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.55)" }}>
              STREAK
            </span>
            <div className="relative flex-1 h-2 overflow-hidden rounded-full">
              <div
                className="absolute inset-0 rounded-full"
                style={{ background: "linear-gradient(to right, #ef4444 0%, #f97316 33%, #eab308 66%, #22c55e 100%)" }}
              />
              {streakPct < 100 && (
                <div
                  className="absolute inset-y-0 right-0 rounded-r-full"
                  style={{ left: `${streakPct}%`, background: "rgba(14,34,8,0.75)" }}
                />
              )}
              <div
                className="absolute top-1/2 h-4 w-1.5 -translate-y-1/2 rounded-sm bg-white shadow"
                style={{ left: `${Math.max(0, Math.min(93, streakPct))}%` }}
              />
            </div>
            <span className="text-xl font-black text-[var(--accent)] leading-none">
              {player.streak}
            </span>
          </div>
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
            Partite nelle ultime 4 settimane
          </p>
        </div>

        {/* ── Condividi su Instagram ────────────────────────── */}
        <a
          href="https://www.instagram.com/sanderbeachvolley/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex min-h-[3.5rem] w-full items-center justify-center rounded-2xl text-base font-black text-[var(--accent)] transition-opacity active:opacity-70"
          style={{ border: "2px solid var(--accent)" }}
        >
          Condividi su Instagram
        </a>
      </div>
    </div>
  )
}
