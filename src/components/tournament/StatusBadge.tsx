import { cn } from "@/lib/utils"

type Status = "DRAFT" | "LIVE" | "COMPLETED"

const config: Record<Status, { label: string; className: string }> = {
  DRAFT: {
    label: "Bozza",
    className: "bg-[var(--surface-3)] text-[var(--muted-text)]",
  },
  LIVE: {
    label: "● LIVE",
    className: "bg-[var(--live)]/20 text-[var(--live)] font-bold",
  },
  COMPLETED: {
    label: "Completato",
    className: "bg-[var(--completed)]/20 text-[var(--completed)]",
  },
}

export function StatusBadge({ status }: { status: Status }) {
  const { label, className } = config[status]
  return (
    <span className={cn("rounded-full px-2 py-0.5 text-xs", className)}>
      {label}
    </span>
  )
}
