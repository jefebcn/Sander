export const dynamic = "force-dynamic"

import { Trophy, Volleyball, Activity } from "lucide-react"
import Link from "next/link"
import { getRecentMatchResults, getRecentSessions, getRecentTournamentEvents } from "@/actions/feed"
import { PageHeader } from "@/components/layout/PageHeader"
import { formatDate } from "@/lib/utils"

// ─── Type label helpers ───────────────────────────────────────────────────────

function tournamentTypeLabel(type: string) {
  switch (type) {
    case "KING_OF_THE_BEACH":  return "KOTB"
    case "BRACKETS":           return "Brackets"
    case "ROUND_ROBIN":        return "Round Robin"
    case "DOUBLE_ELIMINATION": return "DE"
    default:                   return type
  }
}

// ─── Feed event types ─────────────────────────────────────────────────────────

type FeedItem =
  | { kind: "match";      ts: Date; data: Awaited<ReturnType<typeof getRecentMatchResults>>[number] }
  | { kind: "session";    ts: Date; data: Awaited<ReturnType<typeof getRecentSessions>>[number] }
  | { kind: "tournament"; ts: Date; data: Awaited<ReturnType<typeof getRecentTournamentEvents>>[number] }

// ─── Card renderers ───────────────────────────────────────────────────────────

function MatchResultCard({ match }: { match: Awaited<ReturnType<typeof getRecentMatchResults>>[number] }) {
  const teamA = match.players.filter((p) => p.team === 0).map((p) => p.player)
  const teamB = match.players.filter((p) => p.team === 1).map((p) => p.player)
  const aWon = (match.teamAScore ?? 0) > (match.teamBScore ?? 0)

  return (
    <div className="rounded-2xl bg-[var(--surface-2)] p-4">
      <div className="mb-2 flex items-center justify-between">
        <Link
          href={`/tournaments/${match.tournament.id}`}
          className="text-xs font-bold uppercase tracking-wider text-[var(--accent)]"
        >
          {match.tournament.name} · {tournamentTypeLabel(match.tournament.type)}
        </Link>
        <span className="text-xs text-[var(--muted-text)]">
          {match.bracketSection !== "WB" ? match.bracketSection + " · " : ""}R{match.round}
        </span>
      </div>

      <div className="flex items-center gap-3">
        {/* Team A */}
        <div className={`flex-1 text-right ${aWon ? "text-[var(--accent)]" : "text-[var(--foreground)]"}`}>
          {teamA.map((p) => (
            <p key={p.id} className="font-bold leading-tight text-sm">
              {p.name}
            </p>
          ))}
        </div>

        {/* Score */}
        <div className="flex shrink-0 items-center gap-1.5 rounded-xl bg-[var(--surface-3)] px-3 py-1.5">
          <span className={`text-xl font-black tabular-nums ${aWon ? "text-[var(--accent)]" : "text-[var(--muted-text)]"}`}>
            {match.teamAScore}
          </span>
          <span className="text-[var(--muted-text)]">–</span>
          <span className={`text-xl font-black tabular-nums ${!aWon ? "text-[var(--accent)]" : "text-[var(--muted-text)]"}`}>
            {match.teamBScore}
          </span>
        </div>

        {/* Team B */}
        <div className={`flex-1 ${!aWon ? "text-[var(--accent)]" : "text-[var(--foreground)]"}`}>
          {teamB.map((p) => (
            <p key={p.id} className="font-bold leading-tight text-sm">
              {p.name}
            </p>
          ))}
        </div>
      </div>
    </div>
  )
}

function SessionCard({ session }: { session: Awaited<ReturnType<typeof getRecentSessions>>[number] }) {
  return (
    <Link
      href={`/sessions/${session.id}`}
      className="flex items-start gap-3 rounded-2xl bg-[var(--surface-2)] p-4"
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--surface-3)]">
        <Volleyball className="h-4 w-4 text-[var(--accent)]" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-bold text-sm">{session.title}</p>
        <p className="text-xs text-[var(--muted-text)]">
          {session.location} · {session.participants.length} giocatori ·{" "}
          {formatDate(session.date)}
        </p>
      </div>
    </Link>
  )
}

function TournamentEventCard({
  tournament,
}: {
  tournament: Awaited<ReturnType<typeof getRecentTournamentEvents>>[number]
}) {
  const winner = tournament.standings[0]?.player
  return (
    <Link
      href={`/tournaments/${tournament.id}`}
      className="flex items-start gap-3 rounded-2xl bg-[var(--surface-2)] p-4"
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--surface-3)]">
        <Trophy className={`h-4 w-4 ${tournament.status === "COMPLETED" ? "text-[var(--gold)]" : "text-[var(--accent)]"}`} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-bold text-sm">{tournament.name}</p>
        <p className="text-xs text-[var(--muted-text)]">
          {tournament.status === "COMPLETED"
            ? winner
              ? `Vince ${winner.name} 🏆`
              : "Completato"
            : "In corso"}
          {" · "}
          {tournamentTypeLabel(tournament.type)}
        </p>
      </div>
    </Link>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function FeedPage() {
  const [matches, sessions, tournaments] = await Promise.all([
    getRecentMatchResults(),
    getRecentSessions(),
    getRecentTournamentEvents(),
  ])

  // Merge into a unified chronological feed
  const feed: FeedItem[] = [
    ...matches.map((m) => ({ kind: "match" as const,      ts: m.updatedAt, data: m })),
    ...sessions.map((s) => ({ kind: "session" as const,   ts: s.updatedAt, data: s })),
    ...tournaments.map((t) => ({ kind: "tournament" as const, ts: t.updatedAt, data: t })),
  ].sort((a, b) => b.ts.getTime() - a.ts.getTime())

  return (
    <div className="pb-6">
      <PageHeader title="Feed" subtitle="Attività recente" />

      <div className="space-y-3 px-4">
        {feed.length === 0 && (
          <div className="flex flex-col items-center gap-3 pt-16 text-center">
            <Activity className="h-12 w-12 opacity-20" />
            <p className="text-[var(--muted-text)]">Nessuna attività recente</p>
          </div>
        )}

        {feed.map((item, i) => {
          const stagger = i < 6 ? `stagger-${i + 1}` : ""
          const cls = `slide-up ${stagger}`
          if (item.kind === "match") {
            return (
              <div key={`m-${i}`} className={cls}>
                <MatchResultCard match={item.data} />
              </div>
            )
          }
          if (item.kind === "session") {
            return (
              <div key={`s-${i}`} className={cls}>
                <SessionCard session={item.data} />
              </div>
            )
          }
          return (
            <div key={`t-${i}`} className={cls}>
              <TournamentEventCard tournament={item.data} />
            </div>
          )
        })}
      </div>
    </div>
  )
}
