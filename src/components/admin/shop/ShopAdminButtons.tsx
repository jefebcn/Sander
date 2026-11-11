"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { adminSetShopOrderStatus, adminToggleShopProduct } from "@/actions/shop"
import { cn } from "@/lib/utils"

/** On/off switch for "in vendita" or "in evidenza in home". */
export function ProductToggle({ productId, field, value, label }: { productId: string; field: "active" | "featured"; value: boolean; label: string }) {
  const [pending, startTransition] = useTransition()
  const router = useRouter()
  return (
    <button
      type="button"
      role="switch"
      aria-checked={value}
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const res = await adminToggleShopProduct({ productId, field, value: !value })
          if (!res.ok) return void toast.error(res.error)
          toast.success(res.message)
          router.refresh()
        })
      }
      className="flex min-h-[3rem] items-center gap-2 text-sm font-bold text-white"
    >
      <span className={cn("relative h-7 w-12 rounded-full transition-colors", value ? "bg-[var(--accent)]" : "bg-[var(--surface-3)]")}>
        <span className={cn("absolute top-1 h-5 w-5 rounded-full bg-white transition-all", value ? "left-6" : "left-1")} />
      </span>
      {label}
    </button>
  )
}

const ACTION = {
  READY: { label: "Segna pronto", cls: "bg-[var(--accent-soft)] text-[var(--accent)]" },
  DELIVERED: { label: "Consegnato", cls: "bg-[var(--surface-3)] text-white" },
  PAID: { label: "Rimetti in preparazione", cls: "bg-[var(--surface-3)] text-white" },
  CANCELLED: { label: "Annulla e rimborsa", cls: "text-[var(--danger)] ring-1 ring-[var(--danger)]/40" },
} as const

export function OrderActions({ orderId, number, actions }: { orderId: string; number: number; actions: (keyof typeof ACTION)[] }) {
  const [pending, startTransition] = useTransition()
  const router = useRouter()
  if (actions.length === 0) return null
  return (
    <div className="flex flex-wrap gap-2">
      {actions.map((a) => (
        <button
          key={a}
          type="button"
          disabled={pending}
          onClick={() => {
            if (a === "CANCELLED" && !window.confirm(`Annullare l'ordine #${number}? Il cliente viene rimborsato sulla carta e i pezzi tornano in vendita.`)) return
            startTransition(async () => {
              const res = await adminSetShopOrderStatus({ orderId, status: a })
              if (!res.ok) return void toast.error(res.error)
              toast.success(res.message)
              router.refresh()
            })
          }}
          className={cn("flex min-h-[3rem] items-center gap-1.5 rounded-full px-4 text-sm font-extrabold disabled:opacity-60", ACTION[a].cls)}
        >
          {pending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
          {ACTION[a].label}
        </button>
      ))}
    </div>
  )
}
