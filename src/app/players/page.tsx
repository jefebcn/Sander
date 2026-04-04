export const dynamic = "force-dynamic"

import Link from "next/link"
import { Info } from "lucide-react"
import { listPlayers, getMonthlyTopPlayers } from "@/actions/players"
import { FilterablePlayerList } from "@/components/player/FilterablePlayerList"
import { PodiumSection } from "@/components/home/PodiumSection"
import type { PodiumPlayer } from "@/components/home/PodiumSection"
import { playerToCardData } from "@/components/player/SanderCardFut"
import type { PrismaPlayerLike } from "@/components/player/SanderCardFut"

interface Props {
  searchParams: Promise<{ tab?: string }>
}

export default async function PlayersPage({ searchParams }: Props) {
  const { tab } = await searchParams
  const activeTab = tab === "lista" ? "lista" : tab === "podio" ? "podio" : "ranking"

  const players = await listPlayers()

  let podiumPlayers: PodiumPlayer[] = []
  if (activeTab === "podio") {
    const top3 = await getMonthlyTopPlayers()
    podiumPlayers = top3.map(({ player }, i) => ({
      playerData: playerToCardData(player as PrismaPlayerLike),
      position: i + 1,
    }))
  }

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
        <Link
          href="/players?tab=podio"
          className="flex-1 rounded-xl py-2.5 text-center text-sm font-bold transition-colors"
          style={
            activeTab === "podio"
              ? { background: "var(--accent)", color: "#000" }
              : { background: "var(--surface-2)", color: "var(--muted-text)" }
          }
        >
          Podio
        </Link>
      </div>

      {/* ── Content ───────────────────────────────────────────── */}
      {activeTab === "podio" ? (
        <div className="px-4">
          <PodiumSection players={podiumPlayers} />
        </div>
      ) : (
        <FilterablePlayerList players={players} tab={activeTab as "ranking" | "lista"} />
      )}
    </div>
  )
}
