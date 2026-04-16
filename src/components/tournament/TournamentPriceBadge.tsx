import { formatPrice } from "@/lib/utils"
import { cn } from "@/lib/utils"

export function TournamentPriceBadge({
  priceCents,
  currency = "EUR",
  className,
}: {
  priceCents: number | null | undefined
  currency?: string
  className?: string
}) {
  const isFree = priceCents == null || priceCents === 0
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-sm font-bold",
        isFree
          ? "bg-[var(--surface-2)] text-white"
          : "bg-[var(--accent)] text-black",
        className,
      )}
    >
      {formatPrice(priceCents, currency)}
    </span>
  )
}
