import { cn } from "@/lib/utils"

const CONFIG = {
  OPEN: { label: "Aperta", className: "bg-[var(--live)]/15 text-[var(--live)]" },
  FULL: { label: "Completa", className: "bg-[var(--warning)]/15 text-[var(--warning)]" },
  COMPLETED: { label: "Completata", className: "bg-[var(--completed)]/15 text-[var(--completed)]" },
  CANCELLED: { label: "Annullata", className: "bg-[var(--muted)]/15 text-[var(--muted-text)]" },
} as const

type Status = keyof typeof CONFIG

export function SessionStatusBadge({ status }: { status: Status }) {
  const { label, className } = CONFIG[status]
  return (
    <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-bold", className)}>
      {status === "OPEN" && <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-[var(--live)] align-middle" />}
      {label}
    </span>
  )
}
