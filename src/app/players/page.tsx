export const dynamic = "force-dynamic"

import Link from "next/link"
import { Users, Info, Medal } from "lucide-react"
import { listPlayers } from "@/actions/players"
import { SanderCardMini } from "@/components/player/SanderCardMini"

interface Props {
  searchParams: Promise<{ tab?: string }>
}

export default async function PlayersPage({ searchParams }: Props) {
  const { tab } = await searchParams
  const activeTab = tab === "lista" ? "lista" : "ranking"

  const players = await listPlayers()

  // Ranking: sort by glickoRating descending
  const ranked = [...players].sort((a, b) => b.glickoRating - a.glickoRating)

  return (
    <div className="pb-6">
      {/* ── Title row ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 pt-5 pb-1">
        <h1 className="text-2xl font-black text-white">Giocatori</h1>
        {activeTab === "ranking" && (
          <Link
            href="/players/ranking-info"
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--surface-2)] text-[var(--muted-text)]"
            aria-label="Come funziona il ranking"
          >
            <Info className="h-4 w-4" />
          </Link>
        )}
      </div>

      {/* ── Tab bar ───────────────────────────────────────────── */}
      <div className="flex gap-1 px-4 pt-2 pb-4">
        <Link
          href="/players"
          className="flex-1 rounded-xl py-2.5 text-center text-sm font-bold transition-colors"
          style={
            activeTab === "ranking"
              ? { background: "var(--accent)", color: "#000" }
              : { background: "var(--surface-2)", color: "var(--muted-text)" }
          }
        >
          Ranking
        </Link>
        <Link
          href="/players?tab=lista"
          className="flex-1 rounded-xl py-2.5 text-center text-sm font-bold transition-colors"
          style={
            activeTab === "lista"
              ? { background: "var(--accent)", color: "#000" }
              : { background: "var(--surface-2)", color: "var(--muted-text)" }
          }
        >
          Tutti
        </Link>
      </div>

      {/* ── Ranking tab ───────────────────────────────────────── */}
      {activeTab === "ranking" && (
        <div className="space-y-2 px-4">
          {ranked.length === 0 ? (
            <div className="flex flex-col items-center gap-4 pt-16 text-center">
              <Users className="h-12 w-12 opacity-20" />
              <p className="text-[var(--muted-text)]">Nessun giocatore ancora</p>
            </div>
          ) : (
            ranked.map((player, index) => {
              const pos = index + 1
              const isTop3 = pos <= 3
              const medalColor =
                pos === 1 ? "var(--gold)"
                : pos === 2 ? "var(--silver)"
                : pos === 3 ? "var(--bronze)"
                : undefined

              return (
                <Link
                  key={player.id}
                  href={`/players/${player.id}`}
                  className="flex min-h-[4rem] items-center gap-3 rounded-2xl bg-[var(--surface-2)] px-4 transition-colors active:opacity-80"
                  style={
                    isTop3
                      ? { border: `1px solid ${medalColor}30` }
                      : { border: "1px solid transparent" }
                  }
                >
                  {/* Position */}
                  <div className="w-7 shrink-0 text-center">
                    {isTop3 ? (
                      <Medal
                        className="h-5 w-5 mx-auto"
                        style={{ color: medalColor }}
                      />
                    ) : (
                      <span className="text-sm font-bold text-[var(--muted-text)]">
                        {pos}
                      </span>
                    )}
                  </div>

                  {/* Avatar */}
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-black"
                    style={
                      isTop3
                        ? { background: `${medalColor}25`, color: medalColor }
                        : { background: "var(--surface-3)", color: "var(--muted-text)" }
                    }
                  >
                    {player.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={player.avatarUrl}
                        alt={player.name}
                        className="h-full w-full rounded-full object-cover"
                      />
                    ) : (
                      player.name.slice(0, 2).toUpperCase()
                    )}
                  </div>

                  {/* Name + level */}
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-white truncate">{player.name}</p>
                    <p className="text-xs text-[var(--muted-text)]">
                      Lv.{player.level} · {player.matchesWon}V {player.matchesLost}S
                    </p>
                  </div>

                  {/* GLK score */}
                  <div className="text-right shrink-0">
                    <p
                      className="text-lg font-black"
                      style={{ color: isTop3 ? medalColor : "var(--accent)" }}
                    >
                      {Math.round(player.glickoRating)}
                    </p>
                    <p className="text-[0.6rem] font-bold uppercase tracking-widest text-[var(--muted-text)]">
                      GLK
                    </p>
                  </div>
                </Link>
              )
            })
          )}
        </div>
      )}

      {/* ── Lista tab ─────────────────────────────────────────── */}
      {activeTab === "lista" && (
        <div className="space-y-2 px-4">
          {players.length === 0 ? (
            <div className="flex flex-col items-center gap-4 pt-16 text-center">
              <Users className="h-12 w-12 opacity-20" />
              <p className="text-[var(--muted-text)]">Nessun giocatore ancora</p>
              <p className="text-sm text-[var(--muted-text)]">
                Registrati e crea il tuo profilo per apparire qui
              </p>
            </div>
          ) : (
            players.map((player) => (
              <SanderCardMini key={player.id} player={player} />
            ))
          )}
        </div>
      )}
    </div>
  )
}
