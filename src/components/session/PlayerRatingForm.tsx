"use client"

import { useTransition } from "react"
import { Star, ThumbsUp, ThumbsDown, Trophy, Shield, Zap, Crown, Flame, Target, Users, Heart } from "lucide-react"
import { toast } from "sonner"
import { ratePlayer } from "@/actions/sessions"
import { cn } from "@/lib/utils"

type RatingType = "SUPER" | "TOP" | "FLOP"

const BADGE_META = {
  MVP_PARTITA:         { label: "MVP",   icon: Trophy,  color: "#f59e0b" },
  MURO_IMPENETRABILE:  { label: "Muro",  icon: Shield,  color: "#3b82f6" },
  DIFESA_ACROBATICA:   { label: "Dif.",  icon: Zap,     color: "#8b5cf6" },
  LEADER_CARISMATICO:  { label: "Lead.", icon: Crown,   color: "#ec4899" },
  SCHIACCIATA_POTENTE: { label: "Slam",  icon: Flame,   color: "#ef4444" },
  SERVIZIO_PRECISO:    { label: "Srv.",  icon: Target,  color: "#10b981" },
  SPIRITO_DI_SQUADRA:  { label: "Team",  icon: Users,   color: "#06b6d4" },
  FAIR_PLAY:           { label: "Fair",  icon: Heart,   color: "#f97316" },
} as const

type BadgeKey = keyof typeof BADGE_META

const BADGE_KEYS = Object.keys(BADGE_META) as BadgeKey[]

interface ExistingRating {
  raterId: string
  ratedId: string
  type: RatingType
}

interface ExistingBadgeAward {
  giverId: string
  receiverId: string
  badge: string
}

interface PlayerRatingFormProps {
  sessionId: string
  coParticipants: { id: string; name: string }[]
  currentPlayerId: string
  existingRatings: ExistingRating[]
  existingBadgeAwards: ExistingBadgeAward[]
}

const VOTE_BUTTONS: { type: RatingType; icon: React.ElementType; label: string; activeClass: string }[] = [
  { type: "SUPER", icon: Star, label: "Super", activeClass: "bg-[var(--gold)]/20 text-[var(--gold)] border-[var(--gold)]" },
  { type: "TOP", icon: ThumbsUp, label: "Top", activeClass: "bg-[var(--live)]/20 text-[var(--live)] border-[var(--live)]" },
  { type: "FLOP", icon: ThumbsDown, label: "Flop", activeClass: "bg-[var(--danger)]/20 text-[var(--danger)] border-[var(--danger)]" },
]

export function PlayerRatingForm({
  sessionId,
  coParticipants,
  currentPlayerId,
  existingRatings,
  existingBadgeAwards,
}: PlayerRatingFormProps) {
  const [isPending, startTransition] = useTransition()

  function getMyRating(ratedId: string): RatingType | null {
    return existingRatings.find((r) => r.raterId === currentPlayerId && r.ratedId === ratedId)?.type ?? null
  }

  function getMyBadges(ratedId: string): string[] {
    return existingBadgeAwards
      .filter((b) => b.giverId === currentPlayerId && b.receiverId === ratedId)
      .map((b) => b.badge)
  }

  function handleRate(ratedId: string, type: RatingType) {
    const currentBadges = getMyBadges(ratedId)
    const badges = type === "FLOP" ? [] : currentBadges
    startTransition(async () => {
      try {
        await ratePlayer({ sessionId, ratedId, type, badges })
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Errore")
      }
    })
  }

  function handleBadgeToggle(ratedId: string, badge: BadgeKey) {
    const myRating = getMyRating(ratedId)
    if (!myRating || myRating === "FLOP") return

    const currentBadges = getMyBadges(ratedId)
    let newBadges: string[]
    if (currentBadges.includes(badge)) {
      newBadges = currentBadges.filter((b) => b !== badge)
    } else if (currentBadges.length >= 3) {
      toast.error("Massimo 3 badge per giocatore")
      return
    } else {
      newBadges = [...currentBadges, badge]
    }

    startTransition(async () => {
      try {
        await ratePlayer({ sessionId, ratedId, type: myRating, badges: newBadges })
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
          const myBadges = getMyBadges(player.id)
          const showBadges = myRating === "SUPER" || myRating === "TOP"

          return (
            <div key={player.id} className="rounded-2xl bg-[var(--surface-1)] p-3">
              <p className="mb-2 font-semibold">{player.name}</p>
              <div className="grid grid-cols-3 gap-2">
                {VOTE_BUTTONS.map(({ type, icon: Icon, label, activeClass }) => (
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

              {showBadges && (
                <div className="mt-3">
                  <p className="mb-2 text-[0.65rem] font-bold uppercase tracking-wider text-[var(--muted-text)]">
                    Badge ({myBadges.length}/3)
                  </p>
                  <div className="grid grid-cols-4 gap-1.5">
                    {BADGE_KEYS.map((key) => {
                      const meta = BADGE_META[key]
                      const selected = myBadges.includes(key)
                      const maxed = !selected && myBadges.length >= 3
                      return (
                        <button
                          key={key}
                          onClick={() => handleBadgeToggle(player.id, key)}
                          disabled={isPending || maxed}
                          className={cn(
                            "flex flex-col items-center gap-1 rounded-xl p-1.5 border-2 transition-all active:scale-95",
                            selected
                              ? "border-current"
                              : maxed
                                ? "border-transparent bg-[var(--surface-2)] opacity-40"
                                : "border-transparent bg-[var(--surface-2)]",
                          )}
                          style={selected ? { borderColor: meta.color, background: `${meta.color}15` } : {}}
                        >
                          <meta.icon
                            className="h-4 w-4"
                            style={{ color: selected ? meta.color : "var(--muted-text)" }}
                          />
                          <span
                            className="text-[0.5rem] leading-tight text-center"
                            style={{ color: selected ? meta.color : "var(--muted-text)" }}
                          >
                            {meta.label}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
