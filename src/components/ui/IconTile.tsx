import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

/** Rounded square holding an icon in the current area tone. */
export function IconTile({
  icon: Icon,
  className,
  size = "md",
}: {
  icon: LucideIcon
  className?: string
  size?: "md" | "lg"
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--tone-soft)] text-[var(--tone)]",
        size === "md" ? "h-11 w-11" : "h-14 w-14",
        className,
      )}
    >
      <Icon className={size === "md" ? "h-5 w-5" : "h-6 w-6"} />
    </span>
  )
}
