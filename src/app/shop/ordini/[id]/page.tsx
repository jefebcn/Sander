export const dynamic = "force-dynamic"

import type { Metadata } from "next"
import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { Suspense } from "react"
import { Check, Clock, MapPin, Truck } from "lucide-react"
import { db } from "@/lib/db"
import { getCurrentPlayer, getCurrentSession } from "@/lib/getCurrentPlayer"
import { isAdminEmail } from "@/lib/isAdmin"
import { euro } from "@/lib/shop"
import { PageHeader } from "@/components/layout/PageHeader"
import { SumUpReturn } from "@/components/payments/SumUpReturn"
import { OrderStatusBadge } from "@/components/shop/OrderStatusBadge"
import { QRCanvas } from "@/components/ui/QRCode"

export const metadata: Metadata = { title: "Ordine | SANDER" }

const SITE = "https://www.sanderbv.it"

export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [me, session] = await Promise.all([getCurrentPlayer(), getCurrentSession()])
  if (!me) redirect(`/auth/signin?callbackUrl=/shop/ordini/${id}`)
  const order = await db.shopOrder.findUnique({ where: { id }, include: { items: true } })
  if (!order || (order.playerId !== me.id && !isAdminEmail(session?.user?.email))) notFound()

  const paid = order.status === "PAID" || order.status === "READY" || order.status === "DELIVERED"
  const pickup = order.delivery === "PICKUP"

  return (
    <div className="pb-28">
      {/* Back from SumUp (?pagamento=…): settle right away, before its webhook. */}
      <Suspense fallback={null}>
        <SumUpReturn />
      </Suspense>
      <PageHeader title={`Ordine #${order.number}`} backHref="/shop/ordini" />

      <div className="flex flex-col gap-4 px-4">
        {paid ? (
          <div className="flex flex-col items-center gap-2 text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--accent-soft)] text-[var(--accent)]">
              <Check className="h-9 w-9" strokeWidth={3} aria-hidden="true" />
            </span>
            <p className="font-hand text-4xl text-white">{order.status === "DELIVERED" ? "Consegnato!" : order.status === "READY" ? "È pronto!" : "Ordine fatto!"}</p>
            <p className="text-base text-[var(--muted-text)]">
              {order.status === "DELIVERED"
                ? "Buone partite con la tua roba SANDER."
                : pickup
                  ? order.status === "READY"
                    ? "Ritiralo al prossimo torneo: mostra questo codice."
                    : "Lo prepariamo: ti avvisiamo quando puoi ritirarlo."
                  : order.status === "READY"
                    ? "Sta per partire: ti scriviamo con la spedizione."
                    : "Lo prepariamo e lo spediamo in pochi giorni."}
            </p>
          </div>
        ) : order.status === "PENDING" ? (
          <div className="flex items-center gap-3 rounded-[var(--radius-md)] bg-[var(--surface-2)] p-4">
            <Clock className="h-6 w-6 shrink-0 text-[var(--muted-text)]" aria-hidden="true" />
            <p className="text-base text-white">Pagamento in verifica: se hai appena pagato, si aggiorna tra pochi istanti.</p>
          </div>
        ) : (
          <div className="rounded-[var(--radius-md)] bg-[var(--surface-2)] p-4 text-base text-white">
            Ordine annullato{order.paidAt ? ": il rimborso arriva sulla carta in pochi giorni." : ": nessun addebito."}
          </div>
        )}

        <div className="flex flex-col items-center gap-3 rounded-[var(--radius-lg)] bg-[var(--surface-2)] p-5">
          {paid && pickup && order.status !== "DELIVERED" && (
            <div className="w-48 rounded-2xl bg-white p-3">
              <QRCanvas url={`${SITE}/admin/shop/ordini?n=${order.number}`} />
            </div>
          )}
          <p className="num text-2xl tracking-widest text-white">#{order.number}</p>
          <OrderStatusBadge status={order.status} />
          <dl className="mt-1 flex w-full flex-col gap-2 border-t border-[var(--border)] pt-3 text-base">
            {order.items.map((i) => (
              <div key={i.id} className="flex justify-between gap-3">
                <dt className="text-[var(--muted-text)]">{i.qty > 1 ? `${i.qty} ×` : "Prodotto"}</dt>
                <dd className="text-right font-bold text-white">{i.name} · {i.size}</dd>
              </div>
            ))}
            <div className="flex justify-between gap-3">
              <dt className="text-[var(--muted-text)]">Consegna</dt>
              <dd className="flex items-center gap-1.5 text-right font-bold text-white">
                {pickup ? <MapPin className="h-4 w-4" aria-hidden="true" /> : <Truck className="h-4 w-4" aria-hidden="true" />}
                {pickup ? "Ritiro al torneo" : `${order.shipCity ?? ""} ${order.shipZip ?? ""}`.trim()}
              </dd>
            </div>
            {order.shippingCents > 0 && (
              <div className="flex justify-between gap-3">
                <dt className="text-[var(--muted-text)]">Spedizione</dt>
                <dd className="font-bold text-white">{euro(order.shippingCents)}</dd>
              </div>
            )}
            <div className="flex justify-between gap-3">
              <dt className="text-[var(--muted-text)]">{paid ? "Pagato" : "Totale"}</dt>
              <dd className="num text-lg text-[var(--accent)]">{euro(order.totalCents)}</dd>
            </div>
          </dl>
        </div>

        <Link href="/shop" className="btn btn-secondary w-full">Torna allo shop</Link>
      </div>
    </div>
  )
}
