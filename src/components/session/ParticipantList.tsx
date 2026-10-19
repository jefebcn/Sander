"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { UserPlus, UserMinus, Search, User, X, BellRing } from "lucide-react"
import { toast } from "sonner"
import { isLateCancel } from "@/lib/scopri/reliability"
import { joinSession, leaveSession, assignTeam, cancelSession, removeParticipantFromSession, markNoShow, joinWaitlist, leaveWaitlist } from "@/actions/sessions"
import { joinWindowOpen } from "@/lib/sessionRules"
import { cn } from "@/lib/utils"
import { CompleteSessionForm } from "./CompleteSessionForm"
import { AddPlayerSheet } from "./AddPlayerSheet"
import { AddGuestButton } from "./AddGuestButton"

type Participant = {
  id: string
  team: number | null
  playerId: string | null
  guestName: string | null
  player: { id: string; name: string; preferredRole: string; level: number } | null
}

interface ParticipantListProps {
  session: {
    id: string
    organizerId: string
    status: string
    maxPlayers: number
    format: string
    date: Date | string
  }
  participants: Participant[]
  currentPlayerId: string | null
  /** 1-based place in the waitlist, or null when not queued. */
  myWaitlistPosition?: number | null
}

const FORMAT_LABEL: Record<string, string> = {
  TWO_VS_TWO: "2 vs 2",
  THREE_VS_THREE: "3 vs 3",
  FOUR_VS_FOUR: "4 vs 4",
}

export function ParticipantList({ session, participants, currentPlayerId, myWaitlistPosition = null }: ParticipantListProps) {
  const [isPending, startTransition] = useTransition()
  const [addPlayerOpen, setAddPlayerOpen] = useState(false)
  // Destructive actions ask twice: the first tap arms, the second confirms.
  const [armed, setArmed] = useState<string | null>(null)

  const isOrganizer = currentPlayerId === session.organizerId
  const isParticipant = participants.some((p) => p.player?.id === currentPlayerId)
  const spotsLeft = session.maxPlayers - participants.length
  const started = !joinWindowOpen(new Date(session.date))
  const canJoin = !isParticipant && spotsLeft > 0 && session.status === "OPEN" && !started

  const teamA = participants.filter((p) => p.team === 0)
  const teamB = participants.filter((p) => p.team === 1)
  const unassigned = participants.filter((p) => p.team === null)

  function handleJoin() {
    startTransition(async () => {
      try {
        await joinSession(session.id)
        toast.success("Sei entrato nella partita!")
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Errore")
      }
    })
  }

  function handleJoinWaitlist() {
    startTransition(async () => {
      const res = await joinWaitlist(session.id)
      if (res.ok) toast.success(`In lista d'attesa — posizione ${res.position}`)
      else toast.error(res.error)
    })
  }

  function handleLeaveWaitlist() {
    startTransition(async () => {
      try {
        await leaveWaitlist(session.id)
        toast.success("Uscito dalla lista d'attesa")
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Errore")
      }
    })
  }

  function handleLeave() {
    if (armed !== "leave") return setArmed("leave")
    setArmed(null)
    startTransition(async () => {
      try {
        await leaveSession(session.id)
        toast.success("Hai lasciato la partita")
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
    if (armed !== "cancel") return setArmed("cancel")
    setArmed(null)
    startTransition(async () => {
      try {
        await cancelSession(session.id)
        toast.success("Partita annullata")
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Errore")
      }
    })
  }

  function handleNoShow(participantId: string) {
    setArmed(null)
    startTransition(async () => {
      try {
        await markNoShow(participantId)
        toast.success("Segnato come non presentato")
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Errore")
      }
    })
  }

  function handleRemove(participantId: string) {
    if (armed !== `remove:${participantId}`) return setArmed(`remove:${participantId}`)
    setArmed(null)
    startTransition(async () => {
      try {
        await removeParticipantFromSession(participantId)
        toast.success("Giocatore rimosso")
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
        // The organiser's rows carry A/B/remove buttons: stack the teams so they fit.
        <div className={cn("grid gap-3", isOrganizer ? "grid-cols-1" : "grid-cols-2")}>
          {[
            { label: "Team A", members: teamA },
            { label: "Team B", members: teamB },
          ].map(({ label, members }) => (
            <div key={label} className="rounded-2xl bg-[var(--surface-1)] p-3">
              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-[var(--muted-text)]">{label}</p>
              <div className="space-y-2">
                {members.map((p) => (
                  <PlayerRow
                    key={p.id}
                    participant={p}
                    isOrganizer={isOrganizer}
                    onAssign={handleAssign}
                    onRemove={handleRemove}
                    onNoShow={handleNoShow}
                    started={started}
                    removeArmed={armed === `remove:${p.id}`}
                    isSelf={p.playerId === currentPlayerId}
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
                onRemove={handleRemove}
                onNoShow={handleNoShow}
                started={started}
                removeArmed={armed === `remove:${p.id}`}
                isSelf={p.playerId === currentPlayerId}
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
              {armed === "leave" ? "Tocca di nuovo per lasciare" : "Lascia partita"}
            </button>
          )}
          {isParticipant && !isOrganizer && armed === "leave" && isLateCancel(new Date(session.date)) && (
            <p className="text-center text-sm text-[var(--warning)]">
              Manca poco all&apos;inizio: lasciare adesso conta come assenza nella tua affidabilità.
            </p>
          )}
          {started && !isParticipant && !isOrganizer && session.status === "OPEN" && (
            <div className="rounded-2xl bg-[var(--surface-2)] px-4 py-4 text-center">
              <p className="text-base font-bold text-white">Partita già iniziata</p>
              <Link
                href="/sessions"
                className="mt-3 flex min-h-[3.5rem] w-full items-center justify-center gap-2 rounded-2xl bg-[var(--surface-1)] font-bold text-white"
              >
                <Search className="h-5 w-5" aria-hidden="true" />
                Trova un&apos;altra partita
              </Link>
            </div>
          )}
          {/* Nothing was rendered here before: someone arriving on a full match
              from a shared link saw no button and no explanation at all. */}
          {!isParticipant && !isOrganizer && !canJoin && !started && (
            <div className="rounded-2xl bg-[var(--surface-2)] px-4 py-4 text-center">
              <p className="text-base font-bold text-white">Posti esauriti</p>
              <p className="mt-1 text-sm text-[var(--muted-text)]">
                {myWaitlistPosition
                  ? `Sei in lista d'attesa: posizione ${myWaitlistPosition}. Ti avvisiamo se si libera un posto.`
                  : "Mettiti in lista: ti avvisiamo appena si libera un posto."}
              </p>
              {myWaitlistPosition ? (
                <button
                  onClick={handleLeaveWaitlist}
                  disabled={isPending}
                  className="mt-3 flex min-h-[3.5rem] w-full items-center justify-center gap-2 rounded-2xl bg-[var(--surface-1)] font-bold text-[var(--muted-text)] disabled:opacity-50"
                >
                  <UserMinus className="h-5 w-5" aria-hidden="true" />
                  Esci dalla lista
                </button>
              ) : (
                <button
                  onClick={handleJoinWaitlist}
                  disabled={isPending}
                  className="mt-3 flex min-h-[3.5rem] w-full items-center justify-center gap-2 rounded-2xl font-black text-black disabled:opacity-60"
                  style={{ background: "var(--accent)" }}
                >
                  <BellRing className="h-5 w-5" aria-hidden="true" />
                  Avvisami se si libera
                </button>
              )}
              <Link
                href="/sessions"
                className="mt-2 flex min-h-[3.5rem] w-full items-center justify-center gap-2 rounded-2xl bg-[var(--surface-1)] font-bold text-white"
              >
                <Search className="h-5 w-5" aria-hidden="true" />
                Trova un&apos;altra partita
              </Link>
            </div>
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

          <AddGuestButton sessionId={session.id} />

          {/* The home's "Com'è andata?" card links straight here. */}
          <div id="risultato" className="scroll-mt-24">
            <CompleteSessionForm sessionId={session.id} participants={participants} />
          </div>
          <button
            onClick={handleCancel}
            disabled={isPending}
            className="flex min-h-[3.5rem] w-full items-center justify-center gap-2 rounded-2xl bg-[var(--danger)]/15 font-semibold text-[var(--danger)] transition-all active:scale-[0.98] disabled:opacity-40"
          >
            {armed === "cancel" ? "Tocca di nuovo per annullare la partita" : "Annulla partita"}
          </button>
        </div>
      )}

      {/* Add player sheet */}
      {addPlayerOpen && (
        <AddPlayerSheet
          sessionId={session.id}
          existingPlayerIds={participants.filter((p) => p.playerId !== null).map((p) => p.player!.id)}
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
  onRemove,
  onNoShow,
  started,
  removeArmed,
  isSelf,
  isPending,
}: {
  participant: Participant
  isOrganizer: boolean
  onAssign: (id: string, team: 0 | 1 | null) => void
  onRemove: (id: string) => void
  onNoShow: (id: string) => void
  /** After the start, removing a registered player can mean "didn't show up". */
  started: boolean
  removeArmed: boolean
  isSelf: boolean
  isPending: boolean
}) {
  const isGuest = participant.playerId === null
  const name = isGuest ? participant.guestName : participant.player!.name

  return (
    <div className="flex min-w-0 items-center gap-2">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--surface-3)] text-xs font-black">
        {isGuest ? (
          <User className="h-4 w-4 text-[var(--muted-text)]" aria-hidden="true" />
        ) : (
          participant.player!.name.slice(0, 2).toUpperCase()
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">
          {name}
          {isGuest && (
            <span className="ml-1.5 text-xs font-normal text-[var(--muted-text)]">ospite</span>
          )}
        </p>
        {!isGuest && (
          <p className="text-xs text-[var(--muted-text)]">Liv. {participant.player!.level}</p>
        )}
      </div>
      {isOrganizer && (
        <div className="flex gap-1">
          {removeArmed ? (
            <>
              {started && !isGuest && (
                <button
                  onClick={() => onNoShow(participant.id)}
                  disabled={isPending}
                  className="flex min-h-[2.75rem] items-center rounded-lg bg-[var(--warning)] px-3 text-xs font-bold text-black disabled:opacity-40"
                >
                  Non si è presentato
                </button>
              )}
              <button
                onClick={() => onRemove(participant.id)}
                disabled={isPending}
                className="flex min-h-[2.75rem] items-center rounded-lg bg-[var(--danger)] px-3 text-xs font-bold text-white disabled:opacity-40"
              >
                Rimuovi
              </button>
            </>
          ) : (
            <>
              {([0, 1] as const).map((team) => (
                <button
                  key={team}
                  onClick={() => onAssign(participant.id, participant.team === team ? null : team)}
                  disabled={isPending}
                  aria-pressed={participant.team === team}
                  aria-label={`Metti ${name} nel Team ${team === 0 ? "A" : "B"}`}
                  className={cn(
                    "flex h-11 w-11 items-center justify-center rounded-lg text-sm font-bold transition-colors",
                    participant.team === team
                      ? team === 0
                        ? "bg-[var(--blocker)]/25 text-white"
                        : "bg-[var(--defender)]/25 text-white"
                      : "bg-[var(--surface-3)] text-[var(--muted-text)]",
                  )}
                >
                  {team === 0 ? "A" : "B"}
                </button>
              ))}
              {!isSelf && (
                <button
                  onClick={() => onRemove(participant.id)}
                  disabled={isPending}
                  aria-label={`Rimuovi ${name} dalla partita`}
                  className="flex h-11 w-11 items-center justify-center rounded-lg bg-[var(--danger)]/15 text-[var(--danger)] transition-colors hover:bg-[var(--danger)]/25 disabled:opacity-40"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
