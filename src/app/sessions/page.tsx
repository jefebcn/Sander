export const dynamic = "force-dynamic"

import Link from "next/link"
import { Plus, Volleyball, Trophy, Users, Calendar } from "lucide-react"
import { getSessions } from "@/actions/sessions"
import { listTournaments } from "@/actions/tournaments"
import { SessionCard } from "@/components/session/SessionCard"
import { StatusBadge } from "@/components/tournament/StatusBadge"
import { getCurrentPlayer } from "@/lib/getCurrentPlayer"
import { formatDate } from "@/lib/utils"

interface Props {
  searchParams: Promise<{ tab?: string }>
}

export default async function SessionsPage({ searchParams }: Props) {
  const { tab } = await searchParams
  const activeTab = tab === "tornei" ? "tornei" : "partite"

  const currentPlayer = await getCurrentPlayer()
  const [sessions, tournaments] = await Promise.all([
    activeTab === "partite" ? getSessions(currentPlayer?.id) : Promise.resolve([]),
    activeTab === "tornei" ? listTournaments() : Promise.resolve([]),
  ])

  const open = sessions.filter((s) => s.status === "OPEN" || s.status === "FULL")
  const completed = sessions.filter((s) => s.status === "COMPLETED")

  return (
    <div className="flex flex-col pb-6">

      {/* ── Page title ────────────────────────────────────────── */}
      <div className="px-4 pt-5 pb-1">
        <h1 className="text-2xl font-black text-white">
          {activeTab === "partite" ? "Partite" : "Tornei"}
        </h1>
      </div>

      {/* ── Tab bar ───────────────────────────────────────────── */}
      <div className="flex gap-1 px-4 pt-2 pb-4">
        <Link
          href="/sessions"
          className="flex-1 rounded-xl py-2.5 text-center text-sm font-bold transition-colors"
          style={
            activeTab === "partite"
              ? { background: "var(--accent)", color: "#000" }
              : { background: "var(--surface-2)", color: "var(--muted-text)" }
          }
        >
          Partite
        </Link>
        <Link
          href="/sessions?tab=tornei"
          className="flex-1 rounded-xl py-2.5 text-center text-sm font-bold transition-colors"
          style={
            activeTab === "tornei"
              ? { background: "var(--accent)", color: "#000" }
              : { background: "var(--surface-2)", color: "var(--muted-text)" }
          }
        >
          Tornei
        </Link>
      </div>

      {/* ── Partite content ───────────────────────────────────── */}
      {activeTab === "partite" && (
        <>
          <div className="space-y-5 px-4 flex-1">
            {open.length > 0 && (
              <section aria-label="Sessioni aperte">
                <p className="mb-2 text-xs font-bold uppercase tracking-wider text-[var(--accent)]">
                  Aperte
                </p>
                <div className="space-y-2">
                  {open.map((s) => (
                    <SessionCard
                      key={s.id}
                      session={{ ...s, status: s.status as "OPEN" | "FULL" | "COMPLETED" | "CANCELLED" }}
                    />
                  ))}
                </div>
              </section>
            )}

            {completed.length > 0 && (
              <section aria-label="Sessioni completate">
                <p className="mb-2 text-xs font-bold uppercase tracking-wider text-[var(--muted-text)]">
                  Recenti
                </p>
                <div className="space-y-2">
                  {completed.map((s) => (
                    <SessionCard
                      key={s.id}
                      session={{ ...s, status: s.status as "OPEN" | "FULL" | "COMPLETED" | "CANCELLED" }}
                    />
                  ))}
                </div>
              </section>
            )}

            {sessions.length === 0 && (
              <div className="flex flex-col items-center gap-3 pt-16 text-center">
                <Volleyball className="h-12 w-12 opacity-20" />
                <p className="text-[var(--muted-text)]">Nessuna sessione ancora</p>
              </div>
            )}
          </div>

          {/* ── + Crea una partita CTA ─────────────────────────── */}
          {currentPlayer && (
            <div className="sticky bottom-[5rem] px-4 pt-6">
              <Link
                href="/sessions/new"
                className="flex min-h-[3.5rem] w-full items-center justify-center gap-2 rounded-2xl font-black text-black text-base transition-opacity active:opacity-80"
                style={{ background: "var(--accent)" }}
              >
                <Plus className="h-5 w-5" />
                Crea una partita
              </Link>
            </div>
          )}
        </>
      )}

      {/* ── Tornei content ────────────────────────────────────── */}
      {activeTab === "tornei" && (
        <>
          <div className="space-y-3 px-4 flex-1">
            {tournaments.length === 0 ? (
              <div className="flex flex-col items-center gap-4 pt-16 text-center">
                <Trophy className="h-12 w-12 opacity-20" />
                <p className="text-[var(--muted-text)]">Nessun torneo ancora</p>
              </div>
            ) : (
              tournaments.map((t) => (
                <Link
                  key={t.id}
                  href={`/tournaments/${t.id}`}
                  className="block rounded-2xl bg-[var(--surface-2)] p-4 active:opacity-80"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h2 className="truncate text-lg font-bold">{t.name}</h2>
                        <StatusBadge status={t.status} />
                      </div>
                      <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-[var(--muted-text)]">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {formatDate(t.date)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-3.5 w-3.5" />
                          {t.registrations.length} giocatori
                        </span>
                        <span className="rounded bg-[var(--surface-3)] px-1.5 py-0.5 text-xs font-medium">
                          {t.type === "KING_OF_THE_BEACH" ? "KOTB"
                            : t.type === "ROUND_ROBIN" ? "Round Robin"
                            : t.type === "DOUBLE_ELIMINATION" ? "Doppia Elim."
                            : "Brackets"}
                        </span>
                      </div>
                    </div>
                    <Trophy className="mt-0.5 h-5 w-5 shrink-0 text-[var(--accent)]" />
                  </div>
                </Link>
              ))
            )}
          </div>

          {/* ── Crea torneo CTA ───────────────────────────────── */}
          {currentPlayer && (
            <div className="sticky bottom-[5rem] px-4 pt-6">
              <Link
                href="/tournaments/new"
                className="flex min-h-[3.5rem] w-full items-center justify-center gap-2 rounded-2xl font-black text-black text-base transition-opacity active:opacity-80"
                style={{ background: "var(--accent)" }}
              >
                <Plus className="h-5 w-5" />
                Crea un torneo
              </Link>
            </div>
          )}
        </>
      )}
    </div>
  )
}
