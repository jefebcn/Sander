"use client"

import { useState, useTransition } from "react"
import { UserPlus, UserMinus, Search } from "lucide-react"
import { toast } from "sonner"
import { joinSession, leaveSession, assignTeam, cancelSession } from "@/actions/sessions"
import { cn } from "@/lib/utils"
import { CompleteSessionForm } from "./CompleteSessionForm"
import { AddPlayerSheet } from "./AddPlayerSheet"

type Participant = {
  id: string
  team: number | null
  player: { id: string; name: string; preferredRole: string; level: number }
}

interface ParticipantListProps {
  session: {
    id: string
    organizerId: string
    status: string
    maxPlayers: number
    format: string
  }
  participants: Participant[]
  currentPlayerId: string | null
}

const FORMAT_LABEL: Record<string, string> = {
  TWO_VS_TWO: "2 vs 2",
  THREE_VS_THREE: "3 vs 3",
  FOUR_VS_FOUR: "4 vs 4",
}

export function ParticipantList({ session, participants, currentPlayerId }: ParticipantListProps) {
  const [isPending, startTransition] = useTransition()
  const [addPlayerOpen, setAddPlayerOpen] = useState(false)

  const isOrganizer = currentPlayerId === session.organizerId
  const isParticipant = participants.some((p) => p.player.id === currentPlayerId)
  const spotsLeft = session.maxPlayers - participants.length
  const canJoin = !isParticipant && spotsLeft > 0 && session.status === "OPEN"

  const teamA = participants.filter((p) => p.team === 0)
  const teamB = participants.filter((p) => p.team === 1)
  const unassigned = participants.filter((p) => p.team === null)

  function handleJoin() {
    startTransition(async () => {
      try {
        await joinSession(session.id)
        toast.success("Sei entrato nella sessione!")
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Errore")
      }
    })
  }

  function handleLeave() {
    startTransition(async () => {
      try {
        await leaveSession(session.id)
        toast.success("Hai lasciato la sessione")
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Errore")
      }
    })
  }

  function handleAssign(participantId: string, team: 0 | 1 | null) {
    startTransition(async () => {
      try {
        await assignTeam({ sessionId: session.id, participantId, team })
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Errore")
      }
    })
  }

  function handleCancel() {
    startTransition(async () => {
      try {
        await cancelSession(session.id)
        toast.success("Sessione annullata")
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Errore")
      }
    })
  }

  return (
    <div className="space-y-4">
      {/* Format + spots */}
      <div className="flex items-center justify-between rounded-2xl bg-[var(--surface-1)] px-4 py-3">
        <span className="font-semibold">{FORMAT_LABEL[session.format]}</span>
        <span className="text-sm text-[var(--muted-text)]">
          {participants.length}/{session.maxPlayers} giocatori
          {session.status === "OPEN" && spotsLeft > 0 && (
            <span className="ml-1 text-[var(--accent)]">({spotsLeft} posti liberi)</span>
          )}
        </span>
      </div>

      {/* Teams (if any assigned) */}
      {(teamA.length > 0 || teamB.length > 0) && (
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Team A", members: teamA, teamIdx: 0 as const },
            { label: "Team B", members: teamB, teamIdx: 1 as const },
          ].map(({ label, members, teamIdx }) => (
            <div key={label} className="rounded-2xl bg-[var(--surface-1)] p-3">
              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-[var(--muted-text)]">{label}</p>
              <div className="space-y-2">
                {members.map((p) => (
                  <PlayerRow
                    key={p.id}
                    participant={p}
                    isOrganizer={isOrganizer}
                    onAssign={handleAssign}
                    isPending={isPending}
                  />
                ))}
                {members.length === 0 && (
                  <p className="text-xs text-[var(--muted-text)]">Vuoto</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Unassigned */}
      {unassigned.length > 0 && (
        <div className="rounded-2xl bg-[var(--surface-1)] p-3">
          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-[var(--muted-text)]">
            {teamA.length === 0 && teamB.length === 0 ? "Partecipanti" : "Non assegnati"}
          </p>
          <div className="space-y-2">
            {unassigned.map((p) => (
              <PlayerRow
                key={p.id}
                participant={p}
                isOrganizer={isOrganizer}
                onAssign={handleAssign}
                isPending={isPending}
              />
            ))}
          </div>
        </div>
      )}

      {/* Join / Leave */}
      {currentPlayerId && session.status !== "COMPLETED" && session.status !== "CANCELLED" && (
        <div>
          {canJoin && (
            <button
              onClick={handleJoin}
              disabled={isPending}
              className="flex min-h-[3.5rem] w-full items-center justify-center gap-2 rounded-2xl bg-[var(--accent)] font-bold text-black transition-all active:scale-[0.98] disabled:opacity-50"
            >
              <UserPlus className="h-5 w-5" aria-hidden="true" />
              Unisciti
            </button>
          )}
          {isParticipant && !isOrganizer && (
            <button
              onClick={handleLeave}
              disabled={isPending}
              className="flex min-h-[3.5rem] w-full items-center justify-center gap-2 rounded-2xl bg-[var(--surface-2)] font-semibold text-[var(--muted-text)] transition-all active:scale-[0.98] disabled:opacity-50"
            >
              <UserMinus className="h-5 w-5" aria-hidden="true" />
              Lascia sessione
            </button>
          )}
        </div>
      )}

      {/* Organizer controls */}
      {isOrganizer && session.status !== "COMPLETED" && session.status !== "CANCELLED" && (
        <div className="space-y-2 border-t border-[var(--border)] pt-4">
          {/* Add player directly */}
          <button
            onClick={() => setAddPlayerOpen(true)}
            disabled={isPending}
            className="flex min-h-[3.5rem] w-full items-center justify-center gap-2 rounded-2xl bg-[var(--surface-2)] font-semibold text-[var(--foreground)] transition-all hover:bg-[var(--surface-3)] active:scale-[0.98] disabled:opacity-40"
          >
            <Search className="h-5 w-5" aria-hidden="true" />
            Aggiungi giocatore
          </button>

          <CompleteSessionForm sessionId={session.id} participants={participants} />
          <button
            onClick={handleCancel}
            disabled={isPending}
            className="flex min-h-[3.5rem] w-full items-center justify-center gap-2 rounded-2xl bg-[var(--danger)]/15 font-semibold text-[var(--danger)] transition-all active:scale-[0.98] disabled:opacity-40"
          >
            Annulla sessione
          </button>
        </div>
      )}

      {/* Add player sheet */}
      {addPlayerOpen && (
        <AddPlayerSheet
          sessionId={session.id}
          existingPlayerIds={participants.map((p) => p.player.id)}
          onClose={() => setAddPlayerOpen(false)}
          onDone={() => setAddPlayerOpen(false)}
        />
      )}
    </div>
  )
}

function PlayerRow({
  participant,
  isOrganizer,
  onAssign,
  isPending,
}: {
  participant: Participant
  isOrganizer: boolean
  onAssign: (id: string, team: 0 | 1 | null) => void
  isPending: boolean
}) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--surface-3)] text-xs font-black">
        {participant.player.name.slice(0, 2).toUpperCase()}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{participant.player.name}</p>
        <p className="text-xs text-[var(--muted-text)]">Lv.{participant.player.level}</p>
      </div>
      {isOrganizer && (
        <div className="flex gap-1">
          <button
            onClick={() => onAssign(participant.id, participant.team === 0 ? null : 0)}
            disabled={isPending}
            className={cn(
              "rounded-lg px-2 py-1 text-xs font-bold transition-colors",
              participant.team === 0
                ? "bg-blue-500/20 text-blue-300"
                : "bg-[var(--surface-3)] text-[var(--muted-text)]",
            )}
          >
            A
          </button>
          <button
            onClick={() => onAssign(participant.id, participant.team === 1 ? null : 1)}
            disabled={isPending}
            className={cn(
              "rounded-lg px-2 py-1 text-xs font-bold transition-colors",
              participant.team === 1
                ? "bg-orange-500/20 text-orange-300"
                : "bg-[var(--surface-3)] text-[var(--muted-text)]",
            )}
          >
            B
          </button>
        </div>
      )}
    </div>
  )
}
