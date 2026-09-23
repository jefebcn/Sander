import { cn } from "@/lib/utils"

const CONFIG = {
  OPEN: { label: "Aperta", className: "bg-[var(--live)]/15 text-[var(--live)]" },
  // "Completa" read as "finished" right next to COMPLETED's "Completata".
  // It means the opposite: no seats left.
  FULL: { label: "Posti esauriti", className: "bg-[var(--warning)]/15 text-[var(--warning)]" },
  COMPLETED: { label: "Conclusa", className: "bg-[var(--completed)]/15 text-[var(--completed)]" },
  CANCELLED: { label: "Annullata", className: "bg-[var(--muted)]/15 text-[var(--muted-text)]" },
} as const

type Status = keyof typeof CONFIG

interface Props {
  status: Status
  /** Date already passed while still OPEN/FULL: nobody closed it. Showing a
      green "Aperta" here made yesterday's matches look joinable. */
  expired?: boolean
}

export function SessionStatusBadge({ status, expired = false }: Props) {
  const showExpired = expired && (status === "OPEN" || status === "FULL")
  const { label, className } = showExpired
    ? { label: "Da chiudere", className: "bg-[var(--muted)]/15 text-[var(--muted-text)]" }
    : CONFIG[status]

  return (
    <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-bold", className)}>
      {status === "OPEN" && !showExpired && (
        <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-[var(--live)] align-middle" />
      )}
      {label}
    </span>
  )
}
