export const dynamic = "force-dynamic"

import { MapPin, Calendar, Euro, FileText } from "lucide-react"
import { getSession } from "@/actions/sessions"
import { getCurrentPlayer } from "@/lib/getCurrentPlayer"
import { SessionStatusBadge } from "@/components/session/SessionStatusBadge"
import { ParticipantList } from "@/components/session/ParticipantList"
import { PlayerRatingForm } from "@/components/session/PlayerRatingForm"
import { PageHeader } from "@/components/layout/PageHeader"

const FORMAT_LABEL: Record<string, string> = {
  TWO_VS_TWO: "2 vs 2",
  THREE_VS_THREE: "3 vs 3",
  FOUR_VS_FOUR: "4 vs 4",
}

export default async function SessionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [session, currentPlayer] = await Promise.all([getSession(id), getCurrentPlayer()])

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
        </div>

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
