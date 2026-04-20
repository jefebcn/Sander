import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { db } from "@/lib/db"
import { BracketView } from "@/components/tournament/BracketView"
import { TournamentBracketView } from "@/components/tournament/TournamentBracketView"
import { LiveBracketRefresher } from "@/components/tournament/LiveBracketRefresher"

export const dynamic = "force-dynamic"

export default async function BracketPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const [tournament, matches, registrations] = await Promise.all([
    db.tournament.findUniqueOrThrow({ where: { id }, select: { name: true, type: true, status: true } }),
    db.match.findMany({
      where: { tournamentId: id },
      include: { players: { include: { player: true } } },
      orderBy: [{ round: "desc" }, { matchNumber: "asc" }],
    }),
    db.tournamentRegistration.findMany({
      where: { tournamentId: id },
      select: { playerId: true, seedPosition: true, teamName: true, teamLogoUrl: true, skillLevel: true },
      orderBy: { seedPosition: "asc" },
    }),
  ])

  // Build playerId → { name, logoUrl } map from fixed-pair registration order
  const teamInfoMap: Record<string, { name: string | null; logoUrl: string | null }> = {}
  for (let i = 0; i < registrations.length; i += 2) {
    const info = {
      name: registrations[i].teamName ?? null,
      logoUrl: registrations[i].teamLogoUrl ?? null,
    }
    teamInfoMap[registrations[i].playerId] = info
    if (registrations[i + 1]) teamInfoMap[registrations[i + 1].playerId] = info
  }

  const skillLevelMap: Record<string, number | null> = {}
  for (const r of registrations) {
    skillLevelMap[r.playerId] = r.skillLevel
  }

  if (tournament.type !== "BRACKETS" && tournament.type !== "DOUBLE_ELIMINATION") {
    return (
      <div className="px-4 pt-8 text-center text-[var(--muted-text)]">
        Questa vista è disponibile solo per tornei a eliminazione diretta.
      </div>
    )
  }

  const isSingleElim = tournament.type === "BRACKETS"

  return (
    <div className="min-h-dvh" style={{ background: "var(--background)" }}>
      {/* Compact header */}
      <div
        className="flex items-center gap-3 px-4 pb-3"
        style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 1rem)" }}
      >
        <Link
          href={`/tournaments/${id}`}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--surface-2)] text-[var(--muted-text)] transition-colors hover:text-white"
          aria-label="Indietro"
        >
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <h1 className="truncate text-base font-black text-white">{tournament.name}</h1>
      </div>

      <LiveBracketRefresher isLive={tournament.status === "LIVE"} />

      {/* Bracket */}
      <div className="overflow-x-auto px-4 pb-8 pt-2">
        {isSingleElim ? (
          <TournamentBracketView matches={matches} tournamentName={tournament.name} teamInfoMap={teamInfoMap} skillLevelMap={skillLevelMap} />
        ) : (
          <BracketView matches={matches} teamInfoMap={teamInfoMap} skillLevelMap={skillLevelMap} />
        )}
      </div>
    </div>
  )
}
