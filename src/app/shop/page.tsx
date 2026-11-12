export const dynamic = "force-dynamic"

import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ChevronRight, EyeOff, MapPin, Receipt, Settings } from "lucide-react"
import { db } from "@/lib/db"
import { getCurrentPlayer, getCurrentSession } from "@/lib/getCurrentPlayer"
import { isAdminEmail } from "@/lib/isAdmin"
import { colorOptions, euro, productImages, SHOP_CATEGORIES, SHOP_SHIPPING_CENTS, stockLabel, swatchColor } from "@/lib/shop"
import { PageHeader } from "@/components/layout/PageHeader"
import { ProductArt } from "@/components/shop/ProductArt"
import { cn } from "@/lib/utils"

export const metadata: Metadata = {
  title: "Shop | SANDER",
  description: "Il merch ufficiale SANDER: ritiro gratis ai tornei o spedizione a casa.",
}

export default async function ShopPage({ searchParams }: { searchParams: Promise<{ cat?: string }> }) {
  const { cat } = await searchParams
  const session = await getCurrentSession()
  const admin = isAdminEmail(session?.user?.email)
  const category = SHOP_CATEGORIES.some((c) => c.id === cat) ? cat : undefined

  const [products, me, cats] = await Promise.all([
    db.shopProduct.findMany({
      where: { ...(admin ? {} : { active: true }), ...(category ? { category } : {}) },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      select: { id: true, slug: true, name: true, priceCents: true, images: true, active: true, featured: true, variants: { orderBy: { sortOrder: "asc" }, select: { id: true, label: true, stock: true } } },
    }),
    getCurrentPlayer(),
    db.shopProduct.groupBy({ by: ["category"], where: admin ? {} : { active: true } }),
  ])
  // Category tabs only once there is more than one category to pick from.
  const tabs = SHOP_CATEGORIES.filter((c) => cats.some((x) => x.category === c.id))
  // Nothing on sale: the shop doesn't exist yet for players.
  if (!admin && products.length === 0 && !category) notFound()

  const myOrders = me ? await db.shopOrder.count({ where: { playerId: me.id, status: { in: ["PAID", "READY", "DELIVERED"] } } }) : 0

  return (
    <div className="pb-28">
      <PageHeader
        title="Shop"
        backHref="/"
        action={
          admin ? (
            <Link href="/admin/shop" aria-label="Gestisci shop" className="flex h-14 w-14 items-center justify-center">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--surface-3)] ring-1 ring-white/15">
                <Settings className="h-5 w-5 text-white" aria-hidden="true" />
              </span>
            </Link>
          ) : undefined
        }
      />

      <div className="flex flex-col gap-4 px-4">
        <div className="flex items-center gap-3 rounded-[var(--radius-md)] bg-[var(--surface-2)] px-4 py-3">
          <MapPin className="h-5 w-5 shrink-0 text-[var(--accent)]" aria-hidden="true" />
          <div className="min-w-0">
            <p className="text-base font-extrabold text-white">Ritiro gratis ai tornei</p>
            <p className="text-sm text-[var(--muted-text)]">Oppure spedizione a casa · {euro(SHOP_SHIPPING_CENTS)}</p>
          </div>
        </div>

        {myOrders > 0 && (
          <Link href="/shop/ordini" className="flex min-h-[3.5rem] items-center gap-3 rounded-[var(--radius-md)] bg-[var(--surface-2)] px-4">
            <Receipt className="h-5 w-5 text-white" aria-hidden="true" />
            <span className="flex-1 text-base font-bold text-white">I miei ordini</span>
            <ChevronRight className="h-5 w-5 text-[var(--muted-text)]" aria-hidden="true" />
          </Link>
        )}

        {tabs.length > 1 && (
          <nav className="flex gap-2 overflow-x-auto [scrollbar-width:none]" aria-label="Categorie">
            {[{ id: undefined, label: "Tutto" }, ...tabs].map((c) => (
              <Link
                key={c.label}
                href={c.id ? `/shop?cat=${c.id}` : "/shop"}
                aria-current={category === c.id ? "page" : undefined}
                className={cn("flex min-h-[2.75rem] shrink-0 items-center rounded-full px-4 text-sm font-bold", category === c.id ? "sel-on" : "sel-off")}
              >
                {c.label}
              </Link>
            ))}
          </nav>
        )}

        {products.length === 0 ? (
          <p className="py-10 text-center text-base text-[var(--muted-text)]">Niente in questa categoria, per ora.</p>
        ) : (
          <ul className="grid grid-cols-2 gap-3">
            {products.map((p) => {
              const stock = p.variants.reduce((n, v) => n + Math.max(0, v.stock), 0)
              const badge = !p.active ? null : stockLabel(stock)
              const colors = colorOptions(p.variants)
              return (
                <li key={p.id}>
                  <Link href={`/shop/${p.slug}`} className="pressable block rounded-[var(--radius-lg)] bg-[var(--surface-2)] p-2.5">
                    <div className="relative">
                      <ProductArt src={productImages(p.images)[0]} alt={p.name} className="aspect-square w-full" />
                      {!p.active && (
                        <span className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-black/70 px-2.5 py-1 text-xs font-extrabold text-white">
                          <EyeOff className="h-3.5 w-3.5" aria-hidden="true" /> Nascosto
                        </span>
                      )}
                      {p.active && p.featured && !badge && (
                        <span className="absolute left-2 top-2 rounded-full bg-[var(--accent)] px-2.5 py-1 text-xs font-extrabold text-black">Nuovo</span>
                      )}
                      {badge && (
                        <span className={cn("absolute left-2 top-2 rounded-full px-2.5 py-1 text-xs font-extrabold", stock === 0 ? "bg-black/70 text-white" : "bg-[var(--danger)] text-white")}>{badge}</span>
                      )}
                    </div>
                    <div className="px-1 pb-1 pt-2.5">
                      <p className="line-clamp-2 text-base font-extrabold leading-tight text-white">{p.name}</p>
                      <div className="mt-1 flex items-center justify-between gap-2">
                        <p className="num text-xl text-[var(--accent)]">{euro(p.priceCents)}</p>
                        {colors && (
                          <span className="flex items-center gap-1" aria-label={`${colors.length} colori`}>
                            {colors.map((c) => (
                              <span key={c.name} className="h-3.5 w-3.5 rounded-full ring-1 ring-[var(--muted-text)]" style={{ background: swatchColor(c.name) }} aria-hidden="true" />
                            ))}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
