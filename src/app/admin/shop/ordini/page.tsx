export const dynamic = "force-dynamic"

import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { Download, MapPin, Phone, Truck } from "lucide-react"
import { db } from "@/lib/db"
import { getCurrentSession } from "@/lib/getCurrentPlayer"
import { isAdminEmail } from "@/lib/isAdmin"
import { euro, nextAdminStatuses, type ShopOrderStatus } from "@/lib/shop"
import { PageHeader } from "@/components/layout/PageHeader"
import { OrderStatusBadge } from "@/components/shop/OrderStatusBadge"
import { OrderActions } from "@/components/admin/shop/ShopAdminButtons"
import { cn } from "@/lib/utils"

export const metadata: Metadata = { title: "Ordini shop — Admin SANDER" }

const TABS = [
  { id: "PAID", label: "Da preparare" },
  { id: "READY", label: "Pronti" },
  { id: "DELIVERED", label: "Consegnati" },
  { id: "CANCELLED", label: "Annullati" },
] as const

/** ?s= picks the tab; ?n=1042 (the pickup QR) jumps straight to one order. */
export default async function AdminShopOrdersPage({ searchParams }: { searchParams: Promise<{ s?: string; n?: string }> }) {
  const session = await getCurrentSession()
  if (!session?.user?.id) redirect("/auth/signin?callbackUrl=/admin/shop/ordini")
  if (!isAdminEmail(session.user.email)) redirect("/admin/accesso")

  const { s, n } = await searchParams
  const number = n && /^\d{1,9}$/.test(n) ? Number(n) : null
  const tab = TABS.find((t) => t.id === s)?.id ?? "PAID"

  const [counts, orders] = await Promise.all([
    db.shopOrder.groupBy({ by: ["status"], _count: true, where: { status: { in: ["PAID", "READY", "DELIVERED"] } } }),
    db.shopOrder.findMany({
      where: number ? { number } : { status: tab, ...(tab === "CANCELLED" ? { paidAt: { not: null } } : {}) },
      orderBy: { createdAt: tab === "DELIVERED" || tab === "CANCELLED" ? "desc" : "asc" },
      take: 100,
      include: { items: true, player: { select: { name: true, firstName: true } } },
    }),
  ])
  const count = (st: string) => counts.find((c) => c.status === st)?._count ?? 0

  return (
    <div className="pb-28">
      <PageHeader
        title="Ordini shop"
        eyebrow="Admin"
        backHref="/admin/shop"
        action={
          <a href="/api/admin/shop/ordini.csv" aria-label="Scarica elenco ordini (CSV)" className="flex h-14 w-14 items-center justify-center">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--surface-3)] ring-1 ring-white/15">
              <Download className="h-5 w-5 text-white" aria-hidden="true" />
            </span>
          </a>
        }
      />
      <div className="flex flex-col gap-3 px-4">
        <div className="grid grid-cols-3 gap-2">
          {[
            ["PAID", "da preparare", "text-[var(--accent)]"],
            ["READY", "pronti", "text-[var(--social)]"],
            ["DELIVERED", "consegnati", "text-[var(--muted-text)]"],
          ].map(([st, l, c]) => (
            <div key={st} className="rounded-[var(--radius-md)] bg-[var(--surface-2)] p-3">
              <p className={cn("num text-2xl", c)}>{count(st)}</p>
              <p className="text-xs text-[var(--muted-text)]">{l}</p>
            </div>
          ))}
        </div>

        <nav className="flex gap-2 overflow-x-auto [scrollbar-width:none]" aria-label="Stato ordini">
          {TABS.map((t) => (
            <Link key={t.id} href={`/admin/shop/ordini?s=${t.id}`} aria-current={!number && tab === t.id ? "page" : undefined} className={cn("flex min-h-[2.75rem] shrink-0 items-center rounded-full px-4 text-sm font-bold", !number && tab === t.id ? "sel-on" : "sel-off")}>
              {t.label}
            </Link>
          ))}
        </nav>
        {number && <p className="text-sm text-[var(--muted-text)]">Ordine #{number} dal codice di ritiro · <Link href="/admin/shop/ordini" className="font-bold text-[var(--accent)]">tutti gli ordini</Link></p>}

        {orders.length === 0 && <p className="py-8 text-center text-base text-[var(--muted-text)]">Nessun ordine qui.</p>}
        {orders.map((o) => (
          <div key={o.id} className="flex flex-col gap-2 rounded-[var(--radius-md)] bg-[var(--surface-2)] p-4">
            <div className="flex items-center justify-between gap-2">
              <span className="text-base font-extrabold text-white">#{o.number} · {o.player.firstName ?? o.player.name}</span>
              <span className="num text-lg text-[var(--accent)]">{euro(o.totalCents)}</span>
            </div>
            {o.items.map((i) => (
              <p key={i.id} className="text-base text-white">{i.qty > 1 ? `${i.qty} × ` : ""}{i.name} · <b>{i.size}</b></p>
            ))}
            {o.delivery === "PICKUP" ? (
              <p className="flex items-center gap-1.5 text-sm text-[var(--muted-text)]"><MapPin className="h-4 w-4" aria-hidden="true" /> Ritiro al torneo</p>
            ) : (
              <div className="text-sm text-[var(--muted-text)]">
                <p className="flex items-center gap-1.5"><Truck className="h-4 w-4" aria-hidden="true" /> {o.shipName}, {o.shipAddress}, {o.shipZip} {o.shipCity}</p>
                {o.shipPhone && <a href={`tel:${o.shipPhone}`} className="mt-1 flex min-h-[2.5rem] items-center gap-1.5 font-bold text-white"><Phone className="h-4 w-4" aria-hidden="true" /> {o.shipPhone}</a>}
              </div>
            )}
            <div className="flex items-center justify-between gap-2">
              <OrderStatusBadge status={o.status} />
              <span className="text-xs text-[var(--muted-text)]">{(o.paidAt ?? o.createdAt).toLocaleString("it-IT", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Rome" })}</span>
            </div>
            <OrderActions orderId={o.id} number={o.number} actions={nextAdminStatuses(o.status as ShopOrderStatus).filter((a): a is "PAID" | "READY" | "DELIVERED" | "CANCELLED" => a !== "PENDING")} />
          </div>
        ))}
      </div>
    </div>
  )
}
