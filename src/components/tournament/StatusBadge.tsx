import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold",
  {
    variants: {
      status: {
        DRAFT: "bg-[var(--surface-3)] text-[var(--muted-text)]",
        LIVE: "bg-[var(--live)]/15 text-[var(--live)] font-bold",
        COMPLETED: "bg-[var(--completed)]/15 text-[var(--completed)]",
      },
    },
    defaultVariants: { status: "DRAFT" },
  },
)

type Status = "DRAFT" | "LIVE" | "COMPLETED"

/**
 * DRAFT is the normal "upcoming / registration phase" status, not an
 * unpublished draft — labelling it "Bozza" next to "Iscrizioni aperte" read
 * as a contradiction.
 */
function draftLabel(registrationOpen: boolean | undefined): string {
  if (registrationOpen === undefined) return "In programma"
  return registrationOpen ? "Iscrizioni aperte" : "Iscrizioni chiuse"
}

interface StatusBadgeProps extends VariantProps<typeof badgeVariants> {
  status: Status
  /** For DRAFT tournaments: whether sign-ups are currently possible. */
  registrationOpen?: boolean
  className?: string
}

export function StatusBadge({ status, registrationOpen, className }: StatusBadgeProps) {
  const label =
    status === "DRAFT" ? draftLabel(registrationOpen)
    : status === "LIVE" ? "LIVE"
    : "Completato"
  const draftOpen = status === "DRAFT" && registrationOpen === true

  return (
    <span
      className={cn(
        badgeVariants({ status }),
        draftOpen && "bg-[var(--tone-soft)] text-[var(--tone)]",
        className,
      )}
      aria-label={`Stato: ${label}`}
    >
      {status === "LIVE" && (
        <span className="live-dot h-2 w-2 rounded-full bg-[var(--live)]" aria-hidden="true" />
      )}
      {status === "DRAFT" && (
        <span className="h-2 w-2 rounded-full bg-current" aria-hidden="true" />
      )}
      {status === "COMPLETED" && (
        <span className="h-2 w-2 rounded-full bg-[var(--completed)]" aria-hidden="true" />
      )}
      {label}
    </span>
  )
}
