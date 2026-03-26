"use client"

import { useTransition } from "react"
import { Star, ThumbsUp, ThumbsDown } from "lucide-react"
import { toast } from "sonner"
import { ratePlayer } from "@/actions/sessions"
import { cn } from "@/lib/utils"

type RatingType = "SUPER" | "TOP" | "FLOP"

interface ExistingRating {
  raterId: string
  ratedId: string
  type: RatingType
}

interface PlayerRatingFormProps {
  sessionId: string
  coParticipants: { id: string; name: string }[]
  currentPlayerId: string
  existingRatings: ExistingRating[]
}

const BUTTONS: { type: RatingType; icon: React.ElementType; label: string; activeClass: string }[] = [
  { type: "SUPER", icon: Star, label: "Super", activeClass: "bg-[var(--gold)]/20 text-[var(--gold)] border-[var(--gold)]" },
  { type: "TOP", icon: ThumbsUp, label: "Top", activeClass: "bg-[var(--live)]/20 text-[var(--live)] border-[var(--live)]" },
  { type: "FLOP", icon: ThumbsDown, label: "Flop", activeClass: "bg-[var(--danger)]/20 text-[var(--danger)] border-[var(--danger)]" },
]

export function PlayerRatingForm({
  sessionId,
  coParticipants,
  currentPlayerId,
  existingRatings,
}: PlayerRatingFormProps) {
  const [isPending, startTransition] = useTransition()

  function getMyRating(ratedId: string): RatingType | null {
    return existingRatings.find((r) => r.raterId === currentPlayerId && r.ratedId === ratedId)?.type ?? null
  }

  function handleRate(ratedId: string, type: RatingType) {
    startTransition(async () => {
      try {
        await ratePlayer({ sessionId, ratedId, type })
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Errore")
      }
    })
  }

  if (coParticipants.length === 0) return null

  return (
    <div className="space-y-3">
      <p className="px-1 text-xs font-bold uppercase tracking-wider text-[var(--muted-text)]">
        Vota i tuoi compagni
      </p>
      <div className="space-y-2">
        {coParticipants.map((player) => {
          const myRating = getMyRating(player.id)
          return (
            <div key={player.id} className="rounded-2xl bg-[var(--surface-1)] p-3">
              <p className="mb-2 font-semibold">{player.name}</p>
              <div className="grid grid-cols-3 gap-2">
                {BUTTONS.map(({ type, icon: Icon, label, activeClass }) => (
                  <button
                    key={type}
                    onClick={() => handleRate(player.id, type)}
                    disabled={isPending}
                    aria-label={`Vota ${player.name}: ${label}`}
                    className={cn(
                      "flex min-h-[3rem] flex-col items-center justify-center gap-1 rounded-xl border-2 text-xs font-bold transition-all active:scale-[0.97]",
                      myRating === type
                        ? activeClass
                        : "border-[var(--border)] bg-[var(--surface-2)] text-[var(--muted-text)]",
                    )}
                  >
                    <Icon className="h-4 w-4" aria-hidden="true" />
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
