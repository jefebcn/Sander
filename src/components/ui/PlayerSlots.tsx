import { Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { resizedPhoto } from "@/lib/photo"

export interface SlotPlayer {
  name: string
  avatarUrl?: string | null
}

/**
 * The match at a glance: one circle per seat, faces for who's in, a dashed "+"
 * for every free spot (the pattern Playtomic made familiar). "2 posti liberi"
 * becomes something you see, not something you read.
 */
export function PlayerSlots({
  players,
  total,
  size = "md",
  className,
}: {
  players: SlotPlayer[]
  total: number
  size?: "sm" | "md"
  className?: string
}) {
  const seats = Math.max(total, players.length)
  const px = size === "sm" ? "h-7 w-7 text-xs" : "h-9 w-9 text-sm"
  const free = Math.max(0, total - players.length)
  return (
    <div
      className={cn("flex items-center -space-x-1.5", className)}
      aria-label={`${players.length} su ${total} giocatori${free ? `, ${free} ${free === 1 ? "posto libero" : "posti liberi"}` : ""}`}
      role="img"
    >
      {Array.from({ length: seats }, (_, i) => {
        const p = players[i]
        if (p) {
          return (
            <span
              key={i}
              className={cn(
                "flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--surface-4)] font-extrabold text-white ring-2 ring-[var(--surface-2)]",
                px,
              )}
            >
              {p.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={resizedPhoto(p.avatarUrl, "thumb")} alt="" className="h-full w-full object-cover" />
              ) : (
                p.name.slice(0, 2).toUpperCase()
              )}
            </span>
          )
        }
        return (
          <span
            key={i}
            className={cn(
              "flex shrink-0 items-center justify-center rounded-full border-2 border-dashed border-[var(--accent-line)] bg-[var(--surface-2)] text-[var(--accent)]",
              px,
            )}
          >
            <Plus className={size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4"} strokeWidth={3} aria-hidden="true" />
          </span>
        )
      })}
    </div>
  )
}
