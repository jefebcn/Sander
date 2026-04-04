"use client"

import { useState } from "react"
import Link from "next/link"
import { Users, Medal, Search, X } from "lucide-react"
import { SanderCardMini } from "@/components/player/SanderCardMini"
import type { Player } from "@/generated/prisma/client"

interface Props {
  players: Player[]
  tab: "ranking" | "lista"
}

export function FilterablePlayerList({ players, tab }: Props) {
  const [query, setQuery] = useState("")

  const filtered = query
    ? players.filter((p) =>
        p.name.toLowerCase().includes(query.toLowerCase()) ||
        (p.firstName?.toLowerCase().includes(query.toLowerCase())) ||
        (p.lastName?.toLowerCase().includes(query.toLowerCase()))
      )
    : players

  const ranked = tab === "ranking"
    ? [...filtered].sort((a, b) => b.glickoRating - a.glickoRating)
    : filtered

  return (
    <>
      {/* Search bar */}
      <div className="relative px-4 pb-3">
        <Search className="absolute left-7.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-text)]" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Cerca giocatore..."
          className="w-full rounded-2xl bg-[var(--surface-2)] py-3 pl-10 pr-10 text-base text-white placeholder:text-[var(--muted-text)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="absolute right-7.5 top-1/2 -translate-y-1/2 text-[var(--muted-text)]"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Results */}
      <div className="space-y-2 px-4">
        {ranked.length === 0 ? (
          <div className="flex flex-col items-center gap-4 pt-16 text-center">
            <Users className="h-12 w-12 opacity-20" />
            <p className="text-[var(--muted-text)]">
              {query ? "Nessun risultato" : "Nessun giocatore ancora"}
            </p>
          </div>
        ) : tab === "ranking" ? (
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
                <div className="w-7 shrink-0 text-center">
                  {isTop3 ? (
                    <Medal className="h-5 w-5 mx-auto" style={{ color: medalColor }} />
                  ) : (
                    <span className="text-sm font-bold text-[var(--muted-text)]">{pos}</span>
                  )}
                </div>
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
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-white truncate">{player.name}</p>
                  <p className="text-xs text-[var(--muted-text)]">
                    Lv.{player.level} · {player.matchesWon}V {player.matchesLost}S
                  </p>
                </div>
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
        ) : (
          ranked.map((player) => (
            <SanderCardMini key={player.id} player={player} />
          ))
        )}
      </div>
    </>
  )
}
