import { ORDER_STATUS, type ShopOrderStatus } from "@/lib/shop"
import { cn } from "@/lib/utils"

const TONE = {
  accent: "bg-[var(--accent-soft)] text-[var(--accent)]",
  social: "bg-[color-mix(in_srgb,var(--social)_16%,transparent)] text-[var(--social)]",
  muted: "bg-[var(--surface-3)] text-[var(--muted-text)]",
  danger: "bg-[color-mix(in_srgb,var(--danger)_16%,transparent)] text-[var(--danger)]",
} as const

export function OrderStatusBadge({ status, className }: { status: string; className?: string }) {
  const s = ORDER_STATUS[status as ShopOrderStatus] ?? ORDER_STATUS.PENDING
  return <span className={cn("inline-flex items-center rounded-full px-3 py-1 text-xs font-extrabold", TONE[s.tone], className)}>{s.label}</span>
}
