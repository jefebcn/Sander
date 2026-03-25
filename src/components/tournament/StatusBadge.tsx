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

const LABELS: Record<Status, string> = {
  DRAFT: "Bozza",
  LIVE: "LIVE",
  COMPLETED: "Completato",
}

interface StatusBadgeProps extends VariantProps<typeof badgeVariants> {
  status: Status
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span className={cn(badgeVariants({ status }), className)} aria-label={`Stato: ${LABELS[status]}`}>
      {status === "LIVE" && (
        <span className="live-dot h-2 w-2 rounded-full bg-[var(--live)]" aria-hidden="true" />
      )}
      {status === "DRAFT" && (
        <span className="h-2 w-2 rounded-full bg-[var(--muted-text)]" aria-hidden="true" />
      )}
      {status === "COMPLETED" && (
        <span className="h-2 w-2 rounded-full bg-[var(--completed)]" aria-hidden="true" />
      )}
      {LABELS[status]}
    </span>
  )
}
