export const dynamic = "force-dynamic"

import type { Metadata } from "next"
import Link from "next/link"
import { Info } from "lucide-react"
import { listPlayers, getMonthlyTopPlayers, awardMonthlyPodium } from "@/actions/players"
import { FilterablePlayerList } from "@/components/player/FilterablePlayerList"
import { PodiumSection } from "@/components/home/PodiumSection"
import type { PodiumPlayer } from "@/components/home/PodiumSection"
import { playerToCardData } from "@/components/player/SanderCardFut"
import type { PrismaPlayerLike } from "@/components/player/SanderCardFut"
import { PageHeader } from "@/components/layout/PageHeader"
import { SectionTabs, RANK_TABS } from "@/components/layout/SectionTabs"

export const metadata: Metadata = {
  title: "Giocatori di beach volley vicino a te | SANDER",
  description:
    "Trova giocatori di beach volley nel tuo comune: carte, livelli, rating e classifiche.",
}

interface Props {
  searchParams: Promise<{ tab?: string }>
}

export default async function PlayersPage({ searchParams }: Props) {
  const { tab } = await searchParams
  const activeTab = tab === "lista" ? "lista" : tab === "podio" ? "podio" : "ranking"

  const players = await listPlayers()

  let podiumPlayers: PodiumPlayer[] = []
  if (activeTab === "podio") {
    const [top3] = await Promise.all([
      getMonthlyTopPlayers(),
      awardMonthlyPodium(),
    ])
    podiumPlayers = top3.map(({ player }, i) => ({
      playerData: playerToCardData(player as PrismaPlayerLike),
      position: i + 1,
    }))
  }

  return (
    <div className="pb-6">
      <PageHeader
        eyebrow="Classifiche"
        tone="compete"
        title="Giocatori"
        action={
          activeTab === "ranking" ? (
            <Link
              href="/players/ranking-info"
              className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--surface-2)] text-white"
              aria-label="Come funziona il ranking"
            >
              <Info className="h-5 w-5" />
            </Link>
          ) : undefined
        }
      />
      <SectionTabs items={RANK_TABS} active="giocatori" tone="compete" className="pb-1" />

      {/* ── View filter: chips, lighter than the section tabs above ── */}
      <div className="tone-compete flex gap-2 px-4 pt-3 pb-4" role="group" aria-label="Vista">
        {[
          { id: "ranking", href: "/players", label: "Ranking" },
          { id: "podio", href: "/players?tab=podio", label: "Podio del mese" },
          { id: "lista", href: "/players?tab=lista", label: "Tutti" },
        ].map((f) => (
          <Link
            key={f.id}
            href={f.href}
            aria-current={activeTab === f.id ? "true" : undefined}
            className={
              "flex min-h-[2.75rem] items-center rounded-full px-4 text-sm font-bold transition-colors " +
              (activeTab === f.id
                ? "sel-on"
                : "sel-off")
            }
          >
            {f.label}
          </Link>
        ))}
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
