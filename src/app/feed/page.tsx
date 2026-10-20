export const dynamic = "force-dynamic"

import { Trophy, Volleyball } from "lucide-react"
import Link from "next/link"
import { getRecentMatchResults, getRecentSessions, getRecentTournamentEvents } from "@/actions/feed"
import { getReactionSummary, type ReactionTargetType } from "@/actions/reactions"
import { getCurrentPlayer } from "@/lib/getCurrentPlayer"
import { KudosButton } from "@/components/feed/KudosButton"
import { PageHeader } from "@/components/layout/PageHeader"
import { formatDate } from "@/lib/utils"
import { db } from "@/lib/db"
import { Gabbo } from "@/components/ui/Gabbo"

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
          className="flex min-h-[2.75rem] items-center text-sm font-bold uppercase tracking-wider text-[var(--accent)]"
        >
          {match.tournament.name} · {tournamentTypeLabel(match.tournament.type)}
        </Link>
        <span className="text-sm text-[var(--muted-text)]">
          {match.bracketSection !== "WB" ? match.bracketSection + " · " : ""}R{match.round}
        </span>
      </div>

      <div className="flex items-center gap-3">
        {/* Team A */}
        <div className={`flex-1 text-right ${aWon ? "text-[var(--accent)]" : "text-[var(--foreground)]"}`}>
          {teamA.map((p) => (
            <p key={p.id} className="font-bold leading-tight text-base">
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
            <p key={p.id} className="font-bold leading-tight text-base">
              {p.name}
            </p>
          ))}
        </div>
      </div>
    </div>
  )
}

type FeedSession = Awaited<ReturnType<typeof getRecentSessions>>[number]
type FeedSet = { setNumber: number; teamAScore: number; teamBScore: number }

function participantName(p: FeedSession["participants"][number]) {
  return p.player?.name ?? p.guestName ?? "Ospite"
}

/**
 * Self-contained: who played, who won and the sets, right in the card. The
 * detail page of a finished game may be visible only to its players, so the
 * feed must not depend on it to tell the story.
 */
function SessionCard({ session, sets }: { session: FeedSession; sets: FeedSet[] }) {
  const teamA = session.participants.filter((p) => p.team === 0)
  const teamB = session.participants.filter((p) => p.team === 1)
  const hasTeams = teamA.length > 0 && teamB.length > 0
  const aSets = sets.filter((x) => x.teamAScore > x.teamBScore).length
  const bSets = sets.filter((x) => x.teamBScore > x.teamAScore).length
  const winner: 0 | 1 | null = sets.length > 0 && aSets !== bSets ? (aSets > bSets ? 0 : 1) : null

  const teamLine = (team: FeedSession["participants"], idx: 0 | 1) => (
    <div className={`min-w-0 flex-1 ${idx === 0 ? "text-right" : ""}`}>
      {team.map((p) => (
        <p
          key={p.id}
          className={`truncate text-base font-bold leading-tight ${winner === idx ? "text-[var(--accent)]" : "text-[var(--foreground)]"}`}
        >
          {participantName(p)}
        </p>
      ))}
    </div>
  )

  return (
    <Link
      href={`/sessions/${session.id}`}
      className="block rounded-2xl bg-[var(--surface-2)] p-4 active:bg-[var(--surface-3)]"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--surface-3)]">
          <Volleyball className="h-4 w-4 text-[var(--accent)]" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-bold">{session.title}</p>
          <p className="text-sm text-[var(--muted-text)]">
            {session.location} · {formatDate(session.date)}
          </p>
        </div>
      </div>

      {hasTeams ? (
        <div className="mt-3 flex items-center gap-3">
          {teamLine(teamA, 0)}
          {sets.length > 0 ? (
            <div
              className="flex shrink-0 items-center gap-1.5 rounded-xl bg-[var(--surface-3)] px-3 py-1.5"
              aria-label={`Set vinti ${aSets} a ${bSets}`}
            >
              <span className={`text-xl font-black tabular-nums ${winner === 0 ? "text-[var(--accent)]" : "text-[var(--muted-text)]"}`}>{aSets}</span>
              <span className="text-[var(--muted-text)]" aria-hidden="true">–</span>
              <span className={`text-xl font-black tabular-nums ${winner === 1 ? "text-[var(--accent)]" : "text-[var(--muted-text)]"}`}>{bSets}</span>
            </div>
          ) : (
            <span className="shrink-0 text-sm font-bold uppercase text-[var(--muted-text)]">vs</span>
          )}
          {teamLine(teamB, 1)}
        </div>
      ) : (
        session.participants.length > 0 && (
          <p className="mt-3 text-base text-[var(--foreground)]">
            {session.participants.map(participantName).join(", ")}
          </p>
        )
      )}

      {sets.length > 0 && (
        <p className="mt-2 text-center text-sm tabular-nums text-[var(--muted-text)]">
          {sets.map((x) => `${x.teamAScore}-${x.teamBScore}`).join(" · ")}
        </p>
      )}
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
        <Trophy aria-hidden="true" className={`h-4 w-4 ${tournament.status === "COMPLETED" ? "text-[var(--gold)]" : "text-[var(--accent)]"}`} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-bold text-base">{tournament.name}</p>
        <p className="text-sm text-[var(--muted-text)]">
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

function kudosLabel(item: FeedItem) {
  if (item.kind === "session") return item.data.title
  if (item.kind === "tournament") return item.data.name
  const names = (team: number) =>
    item.data.players.filter((p) => p.team === team).map((p) => p.player.name).join(" e ")
  return `${names(0)} contro ${names(1)}`
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

  // Set scores for the finished games, so each card can show the result.
  const sessionIds = sessions.map((s) => s.id)
  const [currentPlayer, reactions, sessionSets] = await Promise.all([
    getCurrentPlayer(),
    getReactionSummary(
      feed.map((item) => ({ type: item.kind as ReactionTargetType, id: item.data.id })),
    ),
    sessionIds.length > 0
      ? db.sessionSet
          .findMany({
            where: { sessionId: { in: sessionIds } },
            select: { sessionId: true, setNumber: true, teamAScore: true, teamBScore: true },
            orderBy: { setNumber: "asc" },
          })
          .catch(() => [])
      : Promise.resolve([]),
  ])
  const setsBySession = new Map<string, FeedSet[]>()
  for (const x of sessionSets) {
    const list = setsBySession.get(x.sessionId) ?? []
    list.push(x)
    setsBySession.set(x.sessionId, list)
  }

  return (
    <div className="pb-6">
      <PageHeader title="Feed" subtitle="Attività recente" />

      <div className="space-y-3 px-4">
        {feed.length === 0 && (
          <div className="flex flex-col items-center gap-3 pt-16 text-center">
            <Gabbo pose="attesa" size={120} />
            <p className="text-[var(--muted-text)]">Nessuna attività recente</p>
          </div>
        )}

        {feed.map((item, i) => {
          const stagger = i < 6 ? `stagger-${i + 1}` : ""
          const cls = `slide-up ${stagger}`
          const state = reactions[`${item.kind}:${item.data.id}`] ?? { count: 0, reacted: false }
          const kudos = (
            <div className="mt-1.5 flex justify-end pr-1">
              <KudosButton
                targetType={item.kind as ReactionTargetType}
                targetId={item.data.id}
                initialCount={state.count}
                initialReacted={state.reacted}
                canReact={!!currentPlayer}
                label={kudosLabel(item)}
              />
            </div>
          )
          if (item.kind === "match") {
            return (
              <div key={`m-${i}`} className={cls}>
                <MatchResultCard match={item.data} />
                {kudos}
              </div>
            )
          }
          if (item.kind === "session") {
            return (
              <div key={`s-${i}`} className={cls}>
                <SessionCard session={item.data} sets={setsBySession.get(item.data.id) ?? []} />
                {kudos}
              </div>
            )
          }
          return (
            <div key={`t-${i}`} className={cls}>
              <TournamentEventCard tournament={item.data} />
              {kudos}
            </div>
          )
        })}
      </div>
    </div>
  )
}
