export const dynamic = "force-dynamic"

import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { ChevronRight, ShoppingBag } from "lucide-react"
import { db } from "@/lib/db"
import { getCurrentPlayer } from "@/lib/getCurrentPlayer"
import { euro } from "@/lib/shop"
import { PageHeader } from "@/components/layout/PageHeader"
import { OrderStatusBadge } from "@/components/shop/OrderStatusBadge"

export const metadata: Metadata = { title: "I miei ordini | SANDER" }

/** Unpaid orders younger than this still show (the buyer may be paying). */
const pendingCutoff = () => new Date(Date.now() - 40 * 60_000)

export default async function MyOrdersPage() {
  const me = await getCurrentPlayer()
  if (!me) redirect("/auth/signin?callbackUrl=/shop/ordini")

  // An unpaid order that never reached SumUp's "paid" is noise: hide it.
  const orders = await db.shopOrder.findMany({
    where: { playerId: me.id, OR: [{ status: { not: "PENDING" } }, { createdAt: { gt: pendingCutoff() } }], NOT: { status: "CANCELLED", paidAt: null } },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: { id: true, number: true, status: true, totalCents: true, createdAt: true, items: { select: { name: true, size: true, qty: true } } },
  })

  return (
    <div className="pb-28">
      <PageHeader title="I miei ordini" backHref="/shop" />
      <div className="flex flex-col gap-3 px-4">
        {orders.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <ShoppingBag className="h-10 w-10 text-[var(--muted-text)]" aria-hidden="true" />
            <p className="text-base text-[var(--muted-text)]">Ancora nessun ordine.</p>
            <Link href="/shop" className="btn btn-primary">Vai allo shop</Link>
          </div>
        ) : (
          orders.map((o) => (
            <Link key={o.id} href={`/shop/ordini/${o.id}`} className="pressable flex items-center gap-3 rounded-[var(--radius-md)] bg-[var(--surface-2)] px-4 py-3.5">
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-base font-extrabold text-white">#{o.number}</span>
                  <span className="num text-lg text-[var(--accent)]">{euro(o.totalCents)}</span>
                </div>
                <p className="truncate text-sm text-white/85">{o.items.map((i) => `${i.name} · ${i.size}${i.qty > 1 ? ` ×${i.qty}` : ""}`).join(", ")}</p>
                <div className="mt-1.5 flex items-center justify-between gap-2">
                  <OrderStatusBadge status={o.status} />
                  <span className="text-xs text-[var(--muted-text)]">{o.createdAt.toLocaleDateString("it-IT", { day: "numeric", month: "short", timeZone: "Europe/Rome" })}</span>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 shrink-0 text-[var(--muted-text)]" aria-hidden="true" />
            </Link>
          ))
        )}
      </div>
    </div>
  )
}
