export const dynamic = "force-dynamic"

import type { Metadata } from "next"
import { MapPin, Calendar, Euro, FileText } from "lucide-react"
import { notFound } from "next/navigation"
import Link from "next/link"
import { getSession } from "@/actions/sessions"
import { getCurrentPlayer } from "@/lib/getCurrentPlayer"
import { db } from "@/lib/db"
import { ShareButton } from "@/components/ui/ShareButton"
import { QRCodeButton } from "@/components/ui/QRCode"
import { SessionStatusBadge } from "@/components/session/SessionStatusBadge"
import { ParticipantList } from "@/components/session/ParticipantList"
import { PlayerRatingForm } from "@/components/session/PlayerRatingForm"
import { SessionMatchRounds } from "@/components/session/SessionMatchRounds"
import { PageHeader } from "@/components/layout/PageHeader"

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> }
): Promise<Metadata> {
  const { id } = await params
  const session = await getSession(id).catch(() => null)
  const title = session ? `${session.title} — SANDER` : "SANDER — Beach Volleyball"
  const ogUrl = session
    ? `/api/og?title=${encodeURIComponent(session.title)}&subtitle=${encodeURIComponent(session.location)}&type=session`
    : `/api/og?title=SANDER&subtitle=Beach+Volleyball&type=session`
  return {
    title,
    openGraph: {
      title,
      description: session
        ? `${session.location} · Unisciti alla partita su SANDER 🏐`
        : "Beach Volleyball Tournament Manager",
      images: [{ url: ogUrl, width: 1200, height: 630, alt: title }],
    },
  }
}

const FORMAT_LABEL: Record<string, string> = {
  TWO_VS_TWO: "2 vs 2",
  THREE_VS_THREE: "3 vs 3",
  FOUR_VS_FOUR: "4 vs 4",
}

export default async function SessionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [session, currentPlayer] = await Promise.all([getSession(id), getCurrentPlayer()])

  // Separate sets query — graceful fallback if table doesn't exist yet
  const sets = session.status === "COMPLETED"
    ? await db.sessionSet.findMany({ where: { sessionId: id }, orderBy: { setNumber: "asc" } }).catch(() => [])
    : []

  // Multi-match mode: fetch session matches when applicable
  const sessionMatches = session.matchMode
    ? await db.sessionMatch.findMany({
        where: { sessionId: id },
        include: { players: { include: { player: { select: { id: true, name: true } } } } },
        orderBy: [{ round: "asc" }, { matchNumber: "asc" }],
      }).catch(() => [])
    : []

  // Completed sessions are private — only participants can view them
  if (session.status === "COMPLETED") {
    const isParticipant = session.participants.some((p) => p.player.id === currentPlayer?.id)
    if (!isParticipant) notFound()
  }

  const dateObj = new Date(session.date)
  const dateStr = dateObj.toLocaleDateString("it-IT", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  })
  const timeStr = dateObj.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })

  const costPerPlayer =
    session.courtCost && session.participants.length > 0
      ? (session.courtCost / session.maxPlayers / 100).toFixed(2)
      : null

  const isParticipant = currentPlayer
    ? session.participants.some((p) => p.player.id === currentPlayer.id)
    : false

  const isOrganizer = currentPlayer?.id === session.organizerId

  const coParticipants =
    currentPlayer && isParticipant
      ? session.participants
          .filter((p) => p.player.id !== currentPlayer.id)
          .map((p) => ({ id: p.player.id, name: p.player.name }))
      : []

  return (
    <div className="pb-6">
      <PageHeader
        title={session.title}
        backHref="/sessions"
        subtitle={session.organizer.name}
        action={<SessionStatusBadge status={session.status as "OPEN" | "FULL" | "COMPLETED" | "CANCELLED"} />}
      />

      <div className="space-y-4 px-4">
        {/* Details card */}
        <div className="space-y-3 rounded-2xl bg-[var(--surface-1)] p-4">
          <div className="flex items-center gap-3 text-sm">
            <Calendar className="h-4 w-4 shrink-0 text-[var(--accent)]" aria-hidden="true" />
            <span className="capitalize">{dateStr} — {timeStr}</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <MapPin className="h-4 w-4 shrink-0 text-[var(--accent)]" aria-hidden="true" />
            <span>{session.location}</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="flex h-4 w-4 shrink-0 items-center justify-center text-xs font-black text-[var(--accent)]">
              {FORMAT_LABEL[session.format]}
            </span>
          </div>
          {costPerPlayer && (
            <div className="flex items-center gap-3 text-sm">
              <Euro className="h-4 w-4 shrink-0 text-[var(--accent)]" aria-hidden="true" />
              <span>€{costPerPlayer} a persona</span>
            </div>
          )}
          {session.notes && (
            <div className="flex items-start gap-3 text-sm">
              <FileText className="mt-0.5 h-4 w-4 shrink-0 text-[var(--muted-text)]" aria-hidden="true" />
              <span className="text-[var(--muted-text)]">{session.notes}</span>
            </div>
          )}

          {/* Score summary (COMPLETED sessions with recorded sets) */}
          {session.status === "COMPLETED" && sets.length > 0 && (() => {
            const teamAWins = sets.filter((s) => s.teamAScore > s.teamBScore).length
            const teamBWins = sets.filter((s) => s.teamBScore > s.teamAScore).length
            return (
              <div className="mt-1 rounded-xl bg-[var(--surface-2)] p-3">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-xs font-bold uppercase tracking-wider text-[var(--muted-text)]">Risultato</p>
                  <p className="text-xs font-bold text-[var(--accent)]">{teamAWins} — {teamBWins}</p>
                </div>
                <div className="grid grid-cols-[4rem_repeat(auto-fill,_2rem)] gap-1 items-center">
                  <p className="text-xs font-bold text-[var(--accent)]">Team A</p>
                  {sets.map((s) => (
                    <p key={s.id} className={`text-center text-sm font-bold ${s.teamAScore > s.teamBScore ? "text-white" : "text-[var(--muted-text)]"}`}>
                      {s.teamAScore}
                    </p>
                  ))}
                  <p className="text-xs font-bold text-[var(--muted-text)]">Team B</p>
                  {sets.map((s) => (
                    <p key={s.id} className={`text-center text-sm font-bold ${s.teamBScore > s.teamAScore ? "text-white" : "text-[var(--muted-text)]"}`}>
                      {s.teamBScore}
                    </p>
                  ))}
                </div>
              </div>
            )
          })()}
        </div>

        {/* Share + QR code */}
        {(session.status === "OPEN" || session.status === "FULL") && (
          <div className="space-y-2">
            <ShareButton
              path={`/sessions/${session.id}`}
              title={session.title}
              text={`Unisciti a "${session.title}" su SANDER 🏐`}
              fullWidth
            />
            <QRCodeButton
              path={`/sessions/${session.id}`}
              title={session.title}
            />
          </div>
        )}

        {/* CTA per utenti non autenticati */}
        {!currentPlayer && (session.status === "OPEN" || session.status === "FULL") && (
          <Link
            href={`/auth/signin?callbackUrl=${encodeURIComponent(`/sessions/${session.id}`)}`}
            className="flex min-h-[3.5rem] w-full items-center justify-center rounded-2xl font-black text-black text-base"
            style={{ background: "var(--accent)" }}
          >
            Accedi per partecipare
          </Link>
        )}

        {/* Participants + actions */}
        <ParticipantList
          session={{
            id: session.id,
            organizerId: session.organizerId,
            status: session.status,
            maxPlayers: session.maxPlayers,
            format: session.format,
          }}
          participants={session.participants}
          currentPlayerId={currentPlayer?.id ?? null}
        />

        {/* Multi-match rounds (matchMode sessions) */}
        {session.matchMode && (
          <SessionMatchRounds
            sessionId={session.id}
            matches={sessionMatches as Parameters<typeof SessionMatchRounds>[0]["matches"]}
            isOrganizer={isOrganizer}
            sessionStatus={session.status}
          />
        )}

        {/* Rating form (only after session completed + is participant) */}
        {session.status === "COMPLETED" && currentPlayer && isParticipant && (
          <PlayerRatingForm
            sessionId={session.id}
            coParticipants={coParticipants}
            currentPlayerId={currentPlayer.id}
            existingRatings={session.ratings as { raterId: string; ratedId: string; type: "SUPER" | "TOP" | "FLOP" }[]}
          />
        )}
      </div>
    </div>
  )
}
