import { Star, BarChart2, Trophy, ClipboardList } from "lucide-react"

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
  flopVotes: number
  tournamentsWon: number
  organizedSessions: number
  streak: number
  mvpCount: number
}

interface SanderCardFifaProps {
  player: FifaCardPlayer
}

function clamp(v: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, Math.round(v)))
}

function computeStats(p: FifaCardPlayer) {
  const avg    = p.avgRating         // 0–100 stored, shown as /10
  const glicko = p.glickoRating      // ~1500 default
  const wr     = p.winRatePct        // 0–100

  // Overall — blend avgRating (60%), glicko (30%), level bonus (10%)
  const overall = clamp(avg * 0.6 + (glicko / 2400) * 99 * 0.3 + Math.min(p.level * 2, 20) * 0.1, 40, 99)

  // ATT — offensive power (avg + win rate)
  const att = clamp(avg * 0.7 + wr * 0.3, 40, 99)

  // DIF — defensive consistency, penalised by flop votes
  const flopPenDif = Math.min(p.flopVotes * 3, 20)
  const dif = clamp(avg * 0.5 + wr * 0.3 + 20 - flopPenDif, 40, 99)

  // MUR — blocking / technical ceiling (Glicko-driven)
  const mur = clamp((glicko / 2400) * 99 * 0.6 + wr * 0.4, 40, 99)

  // ALZ — setting / game vision (avg rating + experience level)
  const lvlBonus = Math.min(p.level * 4, 30)
  const alz = clamp(avg * 0.7 + lvlBonus * 0.3, 40, 99)

  // RIC — reception / passing (consistency, fewer errors)
  const flopPenRic = Math.min(p.flopVotes * 2, 15)
  const ric = clamp(avg * 0.6 + wr * 0.25 + 15 - flopPenRic, 40, 99)

  // STA — stamina / activity (sessions played + recent streak)
  const sessBase = Math.min(p.sessionsPlayed * 2, 50)
  const sta = clamp(avg * 0.3 + sessBase * 0.5 + p.streak * 2, 40, 99)

  return { overall, att, dif, mur, alz, ric, sta }
}

export function SanderCardFifa({ player }: SanderCardFifaProps) {
  const { overall, att, dif, mur, alz, ric, sta } = computeStats(player)
  const avgDisplay = player.avgRating > 0 ? (player.avgRating / 10).toFixed(1) : "—"
  const streakPct = player.matchesWon + player.matchesLost > 0
    ? Math.round((player.matchesWon / (player.matchesWon + player.matchesLost)) * 100)
    : 0

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

        {/* ── Top row: overall + avatar ─────────────────────── */}
        <div className="flex items-start justify-between">
          <div className="flex flex-col items-start gap-2">
            <span
              className="text-[5.5rem] font-black leading-none text-white"
              style={{ textShadow: "0 2px 12px rgba(0,0,0,0.4)" }}
            >
              {overall}
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
            className="h-36 w-36 overflow-hidden rounded-full flex-shrink-0"
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
            { label: "ATT", value: att },
            { label: "DIF", value: dif },
            { label: "MUR", value: mur },
            { label: "ALZ", value: alz },
            { label: "RIC", value: ric },
            { label: "STA", value: sta },
          ].map(({ label, value }, i) => (
            <div
              key={label}
              className="flex items-baseline gap-1.5 px-3 py-3"
              style={{
                borderRight: (i + 1) % 3 !== 0 ? "1px solid rgba(255,255,255,0.1)" : undefined,
                borderBottom: i < 3 ? "1px solid rgba(255,255,255,0.1)" : undefined,
              }}
            >
              <span className="text-3xl font-black text-white leading-none">{value}</span>
              <span className="text-xs font-bold" style={{ color: "rgba(255,255,255,0.5)" }}>{label}</span>
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
