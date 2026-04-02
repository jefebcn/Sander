"use client"

import { useState, useTransition, useRef } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { CheckCircle2, Minus, Plus, UserPen } from "lucide-react"
import { toast } from "sonner"
import { submitScore } from "@/actions/matches"
import { cn } from "@/lib/utils"
import { useHaptic } from "@/lib/useHaptic"
import { PlayerPickerSheet } from "./PlayerPickerSheet"
import type { Match, MatchPlayer, Player } from "@/generated/prisma/client"

type MatchWithPlayers = Match & {
  players: (MatchPlayer & { player: Player })[]
}

interface MatchCardProps {
  match: MatchWithPlayers
  tournamentId: string
  readOnly?: boolean
  preview?: boolean
  canEditPlayers?: boolean
}

export function MatchCard({ match, tournamentId, readOnly, preview, canEditPlayers }: MatchCardProps) {
  const qc = useQueryClient()
  const haptic = useHaptic()
  const [isPending, startTransition] = useTransition()
  const [scoreA, setScoreA] = useState(match.teamAScore ?? 0)
  const [scoreB, setScoreB] = useState(match.teamBScore ?? 0)
  const cardRef = useRef<HTMLDivElement>(null)

  // Picker state: which slot is being edited
  const [pickerSlot, setPickerSlot] = useState<{ playerId: string | null; team: number } | null>(null)

  const teamA = match.players.filter((p) => p.team === 0).map((p) => p.player)
  const teamB = match.players.filter((p) => p.team === 1).map((p) => p.player)
  const allMatchPlayerIds = match.players.map((p) => p.player.id)

  const isCompleted = match.isCompleted
  const canEdit = !readOnly && !isCompleted && !preview
  // Any authenticated user can edit player slots before match is completed
  const canEditPlayerSlots = !!canEditPlayers && !readOnly && !isCompleted

  function handleSubmit() {
    haptic("success")
    startTransition(async () => {
      await submitScore({ matchId: match.id, teamAScore: scoreA, teamBScore: scoreB })
      qc.invalidateQueries({ queryKey: ["dashboard", tournamentId] })
      haptic("heavy")
      cardRef.current?.classList.add("score-flash")
      setTimeout(() => cardRef.current?.classList.remove("score-flash"), 850)
      const winnerNames =
        scoreA > scoreB
          ? teamA.map((p) => p.name).join(" & ")
          : teamB.map((p) => p.name).join(" & ")
      toast.success(`${scoreA} – ${scoreB} · Vince ${winnerNames}! 🏐`)
    })
  }

  function openPicker(playerId: string | null, team: number) {
    setPickerSlot({ playerId, team })
  }

  function closePicker() {
    setPickerSlot(null)
  }

  function onPickerDone() {
    setPickerSlot(null)
    qc.invalidateQueries({ queryKey: ["dashboard", tournamentId] })
  }

  return (
    <>
      <div
        ref={cardRef}
        className={cn(
          "rounded-2xl p-4 transition-all duration-200",
          isCompleted
            ? "bg-[var(--surface-1)] opacity-80"
            : preview
              ? "bg-[var(--surface-1)] opacity-60"
              : "bg-[var(--surface-2)] ring-1 ring-[var(--accent)]/25 shadow-lg shadow-[var(--accent)]/5",
        )}
      >
        {match.courtLabel && (
          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-[var(--accent)]">
            {match.courtLabel}
          </p>
        )}

        <div className="flex items-center gap-3">
          {/* Team A */}
          <div className="flex-1 text-right">
            {teamA.length > 0 ? (
              teamA.map((p) =>
                canEditPlayerSlots ? (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => openPicker(p.id, 0)}
                    className="flex w-full items-center justify-end gap-1 rounded-lg px-1 py-0.5 transition-colors hover:bg-[var(--surface-3)] active:scale-95"
                  >
                    <UserPen className="h-3 w-3 shrink-0 text-[var(--muted-text)]" aria-hidden="true" />
                    <span
                      className={cn(
                        "font-bold leading-tight",
                        isCompleted && (match.teamAScore ?? 0) > (match.teamBScore ?? 0)
                          ? "text-[var(--accent)]"
                          : "text-[var(--foreground)]",
                      )}
                    >
                      {p.name}
                    </span>
                  </button>
                ) : (
                  <p
                    key={p.id}
                    className={cn(
                      "font-bold leading-tight",
                      isCompleted && (match.teamAScore ?? 0) > (match.teamBScore ?? 0)
                        ? "text-[var(--accent)]"
                        : "text-[var(--foreground)]",
                    )}
                  >
                    {p.name}
                  </p>
                ),
              )
            ) : canEditPlayerSlots ? (
              <button
                type="button"
                onClick={() => openPicker(null, 0)}
                className="w-full rounded-lg px-1 py-0.5 text-right text-sm font-semibold text-[var(--accent)]/70 transition-colors hover:bg-[var(--surface-3)] active:scale-95"
              >
                + Aggiungi
              </button>
            ) : (
              <p className="text-sm italic text-[var(--muted-text)]">TBD</p>
            )}
          </div>

          {/* Score column */}
          <div className="flex shrink-0 items-center gap-2">
            {canEdit ? (
              <>
                <ScoreInput
                  value={scoreA}
                  onChange={setScoreA}
                  disabled={isPending}
                  aria-label="Punteggio squadra A"
                />
                <span className="text-lg text-[var(--muted-text)] font-light">–</span>
                <ScoreInput
                  value={scoreB}
                  onChange={setScoreB}
                  disabled={isPending}
                  aria-label="Punteggio squadra B"
                />
              </>
            ) : isCompleted ? (
              <div className="flex items-center gap-2" aria-live="polite">
                <span
                  className={cn(
                    "text-3xl font-black tabular-nums",
                    (match.teamAScore ?? 0) > (match.teamBScore ?? 0)
                      ? "text-[var(--accent)]"
                      : "text-[var(--muted-text)]",
                  )}
                >
                  {match.teamAScore}
                </span>
                <span className="text-[var(--muted-text)] text-lg">–</span>
                <span
                  className={cn(
                    "text-3xl font-black tabular-nums",
                    (match.teamBScore ?? 0) > (match.teamAScore ?? 0)
                      ? "text-[var(--accent)]"
                      : "text-[var(--muted-text)]",
                  )}
                >
                  {match.teamBScore}
                </span>
              </div>
            ) : (
              <span className="text-lg font-bold text-[var(--muted-text)]">vs</span>
            )}
          </div>

          {/* Team B */}
          <div className="flex-1">
            {teamB.length > 0 ? (
              teamB.map((p) =>
                canEditPlayerSlots ? (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => openPicker(p.id, 1)}
                    className="flex w-full items-center gap-1 rounded-lg px-1 py-0.5 transition-colors hover:bg-[var(--surface-3)] active:scale-95"
                  >
                    <span
                      className={cn(
                        "font-bold leading-tight",
                        isCompleted && (match.teamBScore ?? 0) > (match.teamAScore ?? 0)
                          ? "text-[var(--accent)]"
                          : "text-[var(--foreground)]",
                      )}
                    >
                      {p.name}
                    </span>
                    <UserPen className="h-3 w-3 shrink-0 text-[var(--muted-text)]" aria-hidden="true" />
                  </button>
                ) : (
                  <p
                    key={p.id}
                    className={cn(
                      "font-bold leading-tight",
                      isCompleted && (match.teamBScore ?? 0) > (match.teamAScore ?? 0)
                        ? "text-[var(--accent)]"
                        : "text-[var(--foreground)]",
                    )}
                  >
                    {p.name}
                  </p>
                ),
              )
            ) : canEditPlayerSlots ? (
              <button
                type="button"
                onClick={() => openPicker(null, 1)}
                className="w-full rounded-lg px-1 py-0.5 text-left text-sm font-semibold text-[var(--accent)]/70 transition-colors hover:bg-[var(--surface-3)] active:scale-95"
              >
                + Aggiungi
              </button>
            ) : (
              <p className="text-sm italic text-[var(--muted-text)]">TBD</p>
            )}
          </div>
        </div>

        {/* Confirm button */}
        {canEdit && (
          <button
            onClick={handleSubmit}
            disabled={isPending}
            className={cn(
              "mt-4 flex min-h-[3.5rem] w-full items-center justify-center gap-2 rounded-xl font-bold transition-all duration-150",
              "bg-[var(--accent)] text-black hover:bg-[var(--accent-dim)] active:scale-[0.98]",
              "disabled:opacity-50 disabled:cursor-not-allowed",
            )}
            aria-label="Conferma punteggio"
          >
            {isPending ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-black border-t-transparent" />
                Salvataggio...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
                Conferma {scoreA} – {scoreB}
              </>
            )}
          </button>
        )}
      </div>

      {/* Player picker sheet */}
      {pickerSlot && (
        <PlayerPickerSheet
          matchId={match.id}
          oldPlayerId={pickerSlot.playerId}
          team={pickerSlot.team}
          takenPlayerIds={allMatchPlayerIds.filter((id) => id !== pickerSlot.playerId)}
          onClose={closePicker}
          onDone={onPickerDone}
        />
      )}
    </>
  )
}

interface ScoreInputProps {
  value: number
  onChange: (v: number) => void
  disabled?: boolean
  "aria-label"?: string
}

function ScoreInput({ value, onChange, disabled, "aria-label": ariaLabel }: ScoreInputProps) {
  const haptic = useHaptic()

  function tap(newVal: number) {
    haptic("light")
    onChange(newVal)
  }

  return (
    <div className="flex flex-col items-center gap-1" role="group" aria-label={ariaLabel}>
      <button
        type="button"
        onClick={() => tap(Math.min(99, value + 1))}
        disabled={disabled}
        aria-label="Aumenta punteggio"
        className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--surface-3)] text-[var(--foreground)] transition-all hover:bg-[var(--surface-4)] active:scale-90 active:bg-[var(--accent)]/20 disabled:opacity-40"
      >
        <Plus className="h-5 w-5" aria-hidden="true" />
      </button>
      <input
        type="number"
        min={0}
        max={99}
        value={value}
        disabled={disabled}
        aria-label={ariaLabel}
        aria-live="polite"
        onChange={(e) => {
          const v = parseInt(e.target.value, 10)
          if (!isNaN(v) && v >= 0) onChange(Math.min(99, v))
        }}
        className="w-12 rounded-lg bg-transparent text-center text-2xl font-black tabular-nums text-white focus:outline-none focus:ring-2 focus:ring-[var(--accent)] disabled:opacity-40 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
      <button
        type="button"
        onClick={() => tap(Math.max(0, value - 1))}
        disabled={disabled}
        aria-label="Diminuisci punteggio"
        className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--surface-3)] text-[var(--foreground)] transition-all hover:bg-[var(--surface-4)] active:scale-90 active:bg-[var(--accent)]/20 disabled:opacity-40"
      >
        <Minus className="h-5 w-5" aria-hidden="true" />
      </button>
    </div>
  )
}
