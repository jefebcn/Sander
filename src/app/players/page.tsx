export const dynamic = "force-dynamic"

import Link from "next/link"
import { Info } from "lucide-react"
import { listPlayers } from "@/actions/players"
import { FilterablePlayerList } from "@/components/player/FilterablePlayerList"

interface Props {
  searchParams: Promise<{ tab?: string }>
}

export default async function PlayersPage({ searchParams }: Props) {
  const { tab } = await searchParams
  const activeTab = tab === "lista" ? "lista" : "ranking"

  const players = await listPlayers()

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

      {/* ── Filterable list ───────────────────────────────────── */}
      <FilterablePlayerList players={players} tab={activeTab} />
    </div>
  )
}
