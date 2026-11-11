"use client"

import { useId, useState, useTransition } from "react"
import Link from "next/link"
import { CreditCard, MapPin, Minus, Plus, ShieldCheck, Truck } from "lucide-react"
import { toast } from "sonner"
import { startShopCheckout } from "@/actions/shop"
import { euro, orderTotals, SHOP_MAX_QTY, SHOP_SHIPPING_CENTS, stockLabel, type ShopDelivery } from "@/lib/shop"
import { cn } from "@/lib/utils"

export interface BuyVariant {
  id: string
  label: string
  stock: number
}

const FIELD = "min-h-[3.5rem] w-full rounded-[var(--radius-sm)] bg-[var(--surface-3)] px-4 text-base text-white placeholder:text-[var(--muted-text)] outline-none focus:ring-2 focus:ring-[var(--accent)]"

/** Size, quantity, pickup or shipping, then SumUp. */
export function ProductBuy({ priceCents, variants, signedIn, slug }: { priceCents: number; variants: BuyVariant[]; signedIn: boolean; slug: string }) {
  const firstAvailable = variants.find((v) => v.stock > 0)
  const [variantId, setVariantId] = useState<string | null>(variants.length === 1 ? (firstAvailable?.id ?? null) : null)
  const [qty, setQty] = useState(1)
  const [delivery, setDelivery] = useState<ShopDelivery>("PICKUP")
  const [ship, setShip] = useState({ shipName: "", shipAddress: "", shipCity: "", shipZip: "", shipPhone: "" })
  const [pending, startTransition] = useTransition()
  const id = useId()

  const selected = variants.find((v) => v.id === variantId) ?? null
  const maxQty = Math.min(SHOP_MAX_QTY, selected?.stock ?? 1)
  const totals = orderTotals(priceCents, qty, delivery)
  const soldOut = !firstAvailable
  const oneSize = variants.length === 1

  function pay() {
    if (!selected) {
      toast.error("Scegli la taglia")
      return
    }
    startTransition(async () => {
      const res = await startShopCheckout({ variantId: selected.id, qty, delivery, ...(delivery === "SHIP" ? ship : {}) })
      if (res.ok) window.location.href = res.url
      else toast.error(res.error)
    })
  }

  if (soldOut) {
    return <p className="rounded-[var(--radius-md)] bg-[var(--surface-2)] p-4 text-center text-base font-bold text-[var(--muted-text)]">Esaurito: torna presto, lo stiamo rifacendo.</p>
  }

  return (
    <div className="flex flex-col gap-5">
      {!oneSize && (
        <div>
          <p className="mb-2 text-base font-extrabold text-white">Taglia</p>
          <div className="grid grid-cols-6 gap-2">
            {variants.map((v) => {
              const out = v.stock <= 0
              return (
                <button
                  key={v.id}
                  type="button"
                  disabled={out}
                  aria-pressed={v.id === variantId}
                  onClick={() => {
                    setVariantId(v.id)
                    setQty((q) => Math.min(q, Math.max(1, Math.min(SHOP_MAX_QTY, v.stock))))
                  }}
                  className={cn(
                    "min-h-[3.5rem] rounded-[var(--radius-sm)] text-base font-extrabold",
                    out ? "text-white/30 line-through" : v.id === variantId ? "sel-on" : "sel-off",
                  )}
                >
                  {v.label}
                </button>
              )
            })}
          </div>
          {selected && stockLabel(selected.stock) && <p className="mt-2 text-sm font-bold text-[var(--accent)]">{stockLabel(selected.stock)} in {selected.label}</p>}
        </div>
      )}

      <div className="flex items-center justify-between">
        <p className="text-base font-extrabold text-white">Quantità</p>
        <div className="flex items-center gap-2">
          <button type="button" aria-label="Uno in meno" disabled={qty <= 1} onClick={() => setQty((q) => q - 1)} className="flex h-14 w-14 items-center justify-center rounded-full sel-off disabled:opacity-40">
            <Minus className="h-5 w-5" aria-hidden="true" />
          </button>
          <span className="num w-8 text-center text-2xl text-white">{qty}</span>
          <button type="button" aria-label="Uno in più" disabled={qty >= maxQty} onClick={() => setQty((q) => q + 1)} className="flex h-14 w-14 items-center justify-center rounded-full sel-off disabled:opacity-40">
            <Plus className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      </div>

      <div>
        <p className="mb-2 text-base font-extrabold text-white">Consegna</p>
        <div className="grid grid-cols-2 gap-2">
          {(
            [
              { v: "PICKUP", icon: MapPin, title: "Ritiro al torneo", hint: "Gratis" },
              { v: "SHIP", icon: Truck, title: "Spedizione", hint: `${euro(SHOP_SHIPPING_CENTS)} · 3-5 giorni` },
            ] as const
          ).map((o) => (
            <button
              key={o.v}
              type="button"
              aria-pressed={delivery === o.v}
              onClick={() => setDelivery(o.v)}
              className={cn("flex min-h-[4.5rem] flex-col items-start justify-center rounded-[var(--radius-md)] px-4 text-left", delivery === o.v ? "sel-on" : "sel-off")}
            >
              <span className="flex items-center gap-1.5 text-base font-extrabold">
                <o.icon className="h-4 w-4" aria-hidden="true" />
                {o.title}
              </span>
              <span className="text-sm opacity-75">{o.hint}</span>
            </button>
          ))}
        </div>
        {delivery === "PICKUP" && <p className="mt-2 text-sm text-[var(--muted-text)]">Lo ritiri al prossimo torneo o al bagno: ti avvisiamo noi quando è pronto.</p>}
      </div>

      {delivery === "SHIP" && (
        <div className="flex flex-col gap-2">
          <label htmlFor={`${id}-name`} className="sr-only">Nome e cognome</label>
          <input id={`${id}-name`} className={FIELD} placeholder="Nome e cognome" autoComplete="name" value={ship.shipName} onChange={(e) => setShip((s) => ({ ...s, shipName: e.target.value }))} />
          <label htmlFor={`${id}-addr`} className="sr-only">Indirizzo</label>
          <input id={`${id}-addr`} className={FIELD} placeholder="Via e numero civico" autoComplete="street-address" value={ship.shipAddress} onChange={(e) => setShip((s) => ({ ...s, shipAddress: e.target.value }))} />
          <div className="grid grid-cols-[1fr_7.5rem] gap-2">
            <label htmlFor={`${id}-city`} className="sr-only">Città</label>
            <input id={`${id}-city`} className={FIELD} placeholder="Città" autoComplete="address-level2" value={ship.shipCity} onChange={(e) => setShip((s) => ({ ...s, shipCity: e.target.value }))} />
            <label htmlFor={`${id}-zip`} className="sr-only">CAP</label>
            <input id={`${id}-zip`} className={FIELD} placeholder="CAP" inputMode="numeric" autoComplete="postal-code" maxLength={5} value={ship.shipZip} onChange={(e) => setShip((s) => ({ ...s, shipZip: e.target.value.replace(/\D/g, "") }))} />
          </div>
          <label htmlFor={`${id}-tel`} className="sr-only">Telefono</label>
          <input id={`${id}-tel`} className={FIELD} placeholder="Telefono (per il corriere)" type="tel" autoComplete="tel" value={ship.shipPhone} onChange={(e) => setShip((s) => ({ ...s, shipPhone: e.target.value }))} />
        </div>
      )}

      {signedIn ? (
        <button type="button" onClick={pay} disabled={pending} className="btn btn-primary w-full text-lg disabled:opacity-60">
          <CreditCard className="h-5 w-5" aria-hidden="true" />
          {pending ? "Un attimo…" : `Paga ${euro(totals.totalCents)} con carta`}
        </button>
      ) : (
        <Link href={`/auth/signin?callbackUrl=${encodeURIComponent(`/shop/${slug}`)}`} className="btn btn-primary w-full text-lg">
          Accedi per comprare
        </Link>
      )}
      <p className="-mt-2 flex items-center justify-center gap-1.5 text-sm text-[var(--muted-text)]">
        <ShieldCheck className="h-4 w-4" aria-hidden="true" /> Pagamento sicuro con SumUp
      </p>
    </div>
  )
}
