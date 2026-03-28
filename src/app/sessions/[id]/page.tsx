export const dynamic = "force-dynamic"

import type { Metadata } from "next"
import { MapPin, Calendar, Euro, FileText } from "lucide-react"
import { notFound } from "next/navigation"
import Link from "next/link"
import { getSession } from "@/actions/sessions"
import { getCurrentPlayer } from "@/lib/getCurrentPlayer"
import { ShareButton } from "@/components/ui/ShareButton"
import { SessionStatusBadge } from "@/components/session/SessionStatusBadge"
import { ParticipantList } from "@/components/session/ParticipantList"
import { PlayerRatingForm } from "@/components/session/PlayerRatingForm"
import { PageHeader } from "@/components/layout/PageHeader"

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> }
): Promise<Metadata> {
  const { id } = await params
  const session = await getSession(id).catch(() => null)
  const title = session ? `${session.title} — SANDER` : "SANDER — Beach Volleyball"
  return {
    title,
    openGraph: {
      title,
      description: session
        ? `${session.location} · Unisciti alla partita su SANDER 🏐`
        : "Beach Volleyball Tournament Manager",
      images: [{ url: "/sander-logo.png", width: 512, height: 512, alt: "SANDER" }],
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

        {/* Share — full-width prominent button */}
        {(session.status === "OPEN" || session.status === "FULL") && (
          <ShareButton
            path={`/sessions/${session.id}`}
            title={session.title}
            text={`Unisciti a "${session.title}" su SANDER 🏐`}
            fullWidth
          />
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
