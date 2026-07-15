export const dynamic = "force-dynamic"

import type { Metadata } from "next"
import Link from "next/link"
import { Clock, Trophy, ChevronUp, Medal, Swords } from "lucide-react"
import { getCurrentPlayer } from "@/lib/getCurrentPlayer"
import { getSeasonStandings, getPlayerSeasonInfo } from "@/actions/seasons"
import { DIVISIONS, getNextDivision, pointsToNext, divisionProgress } from "@/lib/divisions"
import { DivisionBadge } from "@/components/season/DivisionBadge"
import { DivisionShareButton } from "@/components/season/DivisionShareButton"

export const metadata: Metadata = {
  title: "Stagione — SANDER Beach Volley",
  description:
    "Scala le divisioni, conquista la promozione e chiudi la stagione in cima. Sabbia, Onda, Corrente, Tempesta, Leggenda.",
  openGraph: {
    title: "La Stagione SANDER 🌊",
    description: "Scala le divisioni e conquista la promozione.",
  },
}

function daysLeft(endsAt: string): number {
  return Math.max(0, Math.ceil((new Date(endsAt).getTime() - Date.now()) / (24 * 60 * 60 * 1000)))
}

function Avatar({ name, url, size = 40 }: { name: string; url: string | null; size?: number }) {
  return (
    <div
      className="flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--surface-1)] text-xs font-black text-[var(--muted-text)]"
      style={{ width: size, height: size }}
    >
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt={name} className="h-full w-full object-cover" />
      ) : (
        name.slice(0, 2).toUpperCase()
      )}
    </div>
  )
}

export default async function SeasonPage() {
  const [player, { season, standings }] = await Promise.all([
    getCurrentPlayer(),
    getSeasonStandings(),
  ])

  const me = player ? await getPlayerSeasonInfo(player.id) : null

  // ── No active season ──────────────────────────────────────────────────
  if (!season) {
    return (
      <div className="pb-10">
        <div className="px-4 pt-6 pb-4">
          <h1 className="text-3xl font-black text-white">Stagione</h1>
        </div>
        <div className="mx-4 rounded-3xl bg-[var(--surface-2)] p-8 text-center">
          <div className="mx-auto mb-4 w-fit">
            <DivisionBadge division={DIVISIONS[2]} size={96} />
          </div>
          <p className="text-lg font-black text-white">Nessuna stagione attiva</p>
          <p className="mx-auto mt-1 max-w-xs text-sm text-[var(--muted-text)]">
            Le stagioni assegnano divisioni e premi. Appena parte la prossima, scala la classifica e
            conquista la promozione.
          </p>
          {/* Preview of the ladder */}
          <div className="mt-6 flex items-end justify-center gap-3">
            {DIVISIONS.map((d) => (
              <div key={d.key} className="flex flex-col items-center gap-1">
                <span style={{ fontSize: 22 }}>{d.emoji}</span>
                <span className="text-[0.6rem] font-bold" style={{ color: d.color }}>
                  {d.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const remaining = daysLeft(season.endsAt)
  const next = me ? getNextDivision(me.rating) : null
  const toNext = me ? pointsToNext(me.rating) : null
  const progress = me ? divisionProgress(me.rating) : 0

  return (
    <div className="pb-10">
      {/* Header */}
      <div className="flex items-end justify-between px-4 pt-6 pb-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--accent)]">
            Stagione
          </p>
          <h1 className="text-3xl font-black text-white">{season.name}</h1>
        </div>
        <div className="flex items-center gap-1.5 rounded-full bg-[var(--surface-2)] px-3 py-1.5">
          <Clock className="h-3.5 w-3.5 text-[var(--accent)]" />
          <span className="text-sm font-bold text-white">
            {remaining} {remaining === 1 ? "giorno" : "giorni"}
          </span>
        </div>
      </div>

      {/* ── Your division hero ─────────────────────────────────────────── */}
      {me && (
        <div className="px-4">
          <div
            className="relative overflow-hidden rounded-3xl p-6"
            style={{
              background: `radial-gradient(120% 90% at 50% -10%, ${me.division.color}22, transparent 60%), var(--surface-2)`,
              border: `1px solid ${me.division.color}33`,
            }}
          >
            <div className="flex items-center gap-5">
              <DivisionBadge division={me.division} size={112} />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold uppercase tracking-widest text-[var(--muted-text)]">
                  La tua divisione
                </p>
                <p
                  className="text-2xl font-black leading-tight"
                  style={{ color: me.division.color }}
                >
                  {me.division.name}
                </p>
                <div className="mt-1 flex items-center gap-3 text-sm text-[var(--muted-text)]">
                  {me.rank && (
                    <span className="flex items-center gap-1">
                      <Trophy className="h-3.5 w-3.5 text-[var(--accent)]" />#{me.rank}
                    </span>
                  )}
                  <span className="font-bold text-[var(--live)]">
                    {me.seasonPoints >= 0 ? "+" : ""}
                    {me.seasonPoints} pt
                  </span>
                </div>
              </div>
            </div>

            {/* Progress to next division */}
            {next && toNext !== null ? (
              <div className="mt-5">
                <div className="mb-1.5 flex items-center justify-between text-xs">
                  <span className="font-bold text-[var(--muted-text)]">
                    Promozione a {next.emoji} {next.name}
                  </span>
                  <span className="flex items-center gap-1 font-black" style={{ color: next.color }}>
                    <ChevronUp className="h-3.5 w-3.5" />+{toNext} rating
                  </span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-[var(--surface-1)]">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${progress}%`,
                      background: `linear-gradient(90deg, ${me.division.color}, ${next.color})`,
                    }}
                  />
                </div>
              </div>
            ) : (
              <div className="mt-5 rounded-2xl bg-[var(--surface-1)] p-3 text-center">
                <p className="text-sm font-black" style={{ color: me.division.color }}>
                  👑 Sei nella divisione più alta. Difendi il trono!
                </p>
              </div>
            )}

            {/* Share division */}
            {player && (
              <div className="mt-4">
                <DivisionShareButton
                  playerName={player.name}
                  divisionKey={me.division.key}
                  rating={me.rating}
                  seasonName={season.name}
                  rank={me.rank}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Division ladder ────────────────────────────────────────────── */}
      <div className="mt-6 px-4">
        <p className="mb-2 text-xs font-bold uppercase tracking-wider text-[var(--muted-text)]">
          Le divisioni
        </p>
        <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
          {DIVISIONS.map((d) => {
            const isMine = me?.division.key === d.key
            return (
              <div
                key={d.key}
                className="flex min-w-[92px] flex-1 flex-col items-center gap-1 rounded-2xl px-2 py-3"
                style={{
                  background: isMine ? `${d.color}1a` : "var(--surface-2)",
                  border: isMine ? `1px solid ${d.color}` : "1px solid transparent",
                }}
              >
                <span style={{ fontSize: 26 }}>{d.emoji}</span>
                <span className="text-xs font-black" style={{ color: d.color }}>
                  {d.name}
                </span>
                <span className="text-[0.6rem] text-[var(--muted-text)]">{d.min}+</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Season leaderboard ─────────────────────────────────────────── */}
      <div className="mt-6 px-4">
        <div className="mb-2 flex items-center gap-1.5">
          <Swords className="h-4 w-4 text-[var(--accent)]" />
          <p className="text-xs font-bold uppercase tracking-wider text-[var(--muted-text)]">
            Classifica stagionale
          </p>
        </div>

        {standings.length === 0 ? (
          <div className="rounded-2xl bg-[var(--surface-2)] p-6 text-center text-sm text-[var(--muted-text)]">
            Nessun punto ancora. Gioca una partita per aprire la classifica!
          </div>
        ) : (
          <div className="space-y-2">
            {standings.slice(0, 20).map((s, i) => {
              const isMe = player?.id === s.id
              return (
                <Link
                  key={s.id}
                  href={`/players/${s.id}`}
                  className="flex items-center gap-3 rounded-2xl px-4 py-3 active:opacity-80"
                  style={{
                    background: isMe ? "rgba(201,243,29,0.08)" : "var(--surface-2)",
                    border: isMe ? "1px solid rgba(201,243,29,0.3)" : "1px solid transparent",
                  }}
                >
                  <span className="w-6 text-center">
                    {i < 3 ? (
                      <Medal
                        className="mx-auto h-4 w-4"
                        style={{
                          color:
                            i === 0 ? "var(--gold)" : i === 1 ? "var(--silver)" : "var(--bronze)",
                        }}
                      />
                    ) : (
                      <span className="text-sm font-bold text-[var(--muted-text)]">{i + 1}</span>
                    )}
                  </span>
                  <Avatar name={s.name} url={s.avatarUrl} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold text-white">{s.name}</p>
                    <p className="text-xs font-bold" style={{ color: s.division.color }}>
                      {s.division.emoji} {s.division.name}
                    </p>
                  </div>
                  <span className="text-lg font-black text-[var(--live)]">
                    {s.seasonPoints >= 0 ? "+" : ""}
                    {s.seasonPoints}
                  </span>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
