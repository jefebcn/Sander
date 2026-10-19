"use client"

import { useState } from "react"
import Link from "next/link"
import { Users, Medal, Search, X } from "lucide-react"
import { SanderCardMini } from "@/components/player/SanderCardMini"
import { ProvisionalBadge, ProvisionalSectionHeading } from "@/components/player/ProvisionalBadge"
import { splitLeaderboard, ratedGames } from "@/lib/rankingEligibility"
import type { PublicPlayer as Player } from "@/lib/publicPlayer"
import { resizedPhoto } from "@/lib/photo"

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

  // Ranking: one shared rule (lib/rankingEligibility) — no games, no place;
  // under 5 games, listed after the established players as "in valutazione".
  const board = splitLeaderboard(filtered, ratedGames, (a, b) => b.glickoRating - a.glickoRating)
  const ranked = tab === "ranking" ? [...board.established, ...board.provisional] : filtered

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
          <div className="flex flex-col items-center gap-4 px-6 pt-16 text-center">
            <Users className="h-12 w-12 opacity-20" />
            {query ? (
              <p className="text-[var(--muted-text)]">Nessun risultato</p>
            ) : players.length > 0 ? (
              <div>
                <p className="font-bold text-white">Classifica ancora vuota</p>
                <p className="mt-1 text-sm text-[var(--muted-text)]">
                  Si entra in classifica dalla prima partita con risultato registrato.
                </p>
              </div>
            ) : (
              /* Cold-start: invite the newcomer to be the first card */
              <>
                <div>
                  <p className="font-bold text-white">Ancora nessun giocatore</p>
                  <p className="mt-1 text-sm text-[var(--muted-text)]">
                    Crea la tua carta e sii il primo della Riviera 🏐
                  </p>
                </div>
                <Link
                  href="/auth/signin?callbackUrl=%2Fprofile&mode=register"
                  className="flex min-h-[3.25rem] items-center justify-center gap-2 rounded-2xl px-6 font-black text-black"
                  style={{ background: "var(--accent)" }}
                >
                  Crea la tua carta
                </Link>
              </>
            )}
          </div>
        ) : tab === "ranking" ? (
          <>
            {board.established.map((player, index) => (
              <RankRow key={player.id} player={player} pos={index + 1} />
            ))}
            {board.provisional.length > 0 && (
              <>
                <ProvisionalSectionHeading className={board.established.length > 0 ? "pt-4 pb-1" : "pb-1"} />
                {board.provisional.map((player) => (
                  <RankRow key={player.id} player={player} pos={null} />
                ))}
              </>
            )}
          </>
        ) : (
          ranked.map((player) => (
            <SanderCardMini key={player.id} player={player} />
          ))
        )}
      </div>
    </>
  )
}

/** One leaderboard row; `pos` is null for provisional players (no place yet). */
function RankRow({ player, pos }: { player: Player; pos: number | null }) {
  const isTop3 = pos !== null && pos <= 3
  const medalColor =
    pos === 1 ? "var(--gold)"
    : pos === 2 ? "var(--silver)"
    : pos === 3 ? "var(--bronze)"
    : undefined
  const games = ratedGames(player)

  return (
    <Link
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
        ) : pos !== null ? (
          <span className="text-sm font-bold text-[var(--muted-text)]">{pos}</span>
        ) : (
          <span className="text-sm font-bold text-[var(--muted-text)]" aria-label="Senza posizione">–</span>
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
            src={resizedPhoto(player.avatarUrl, "thumb")}
            alt={player.name}
            className="h-full w-full rounded-full object-cover"
          />
        ) : (
          player.name.slice(0, 2).toUpperCase()
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-white truncate">{player.name}</p>
        {pos === null ? (
          <ProvisionalBadge games={games} />
        ) : (
          <p className="text-xs text-[var(--muted-text)]">
            Liv. {player.level} · {player.matchesWon}V {player.matchesLost}S
          </p>
        )}
      </div>
      <div className="text-right shrink-0">
        <p
          className="text-lg font-black"
          style={{ color: isTop3 ? medalColor : pos === null ? "var(--muted-text)" : "var(--accent)" }}
        >
          {Math.round(player.glickoRating)}
        </p>
        <p className="text-xs font-bold uppercase tracking-widest text-[var(--muted-text)]">
          punti
        </p>
      </div>
    </Link>
  )
}
