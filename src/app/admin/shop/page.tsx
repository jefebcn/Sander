export const dynamic = "force-dynamic"

import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { ChevronRight, ExternalLink, Plus, Receipt } from "lucide-react"
import { db } from "@/lib/db"
import { getCurrentSession } from "@/lib/getCurrentPlayer"
import { isAdminEmail } from "@/lib/isAdmin"
import { euro, productImages } from "@/lib/shop"
import { PageHeader } from "@/components/layout/PageHeader"
import { ProductArt } from "@/components/shop/ProductArt"
import { ProductToggle } from "@/components/admin/shop/ShopAdminButtons"

export const metadata: Metadata = { title: "Shop — Admin SANDER" }

export default async function AdminShopPage() {
  const session = await getCurrentSession()
  if (!session?.user?.id) redirect("/auth/signin?callbackUrl=/admin/shop")
  if (!isAdminEmail(session.user.email)) redirect("/admin/accesso")

  const [products, toPrepare] = await Promise.all([
    db.shopProduct.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      select: { id: true, slug: true, name: true, priceCents: true, images: true, active: true, featured: true, variants: { select: { label: true, stock: true }, orderBy: { sortOrder: "asc" } } },
    }),
    db.shopOrder.count({ where: { status: "PAID" } }),
  ])
  const open = products.some((p) => p.active)

  return (
    <div className="pb-28">
      <PageHeader title="Shop" eyebrow="Admin" backHref="/admin" />
      <div className="flex flex-col gap-3 px-4">
        <p className="rounded-[var(--radius-md)] bg-[var(--surface-2)] px-4 py-3 text-sm text-[var(--muted-text)]">
          {open
            ? "Lo shop è aperto: i giocatori vedono i prodotti «In vendita», l'icona in home e la voce nel profilo."
            : "Lo shop è chiuso: nessun prodotto «In vendita», quindi i giocatori non lo vedono. Accendine uno quando sei pronto."}
        </p>

        <div className="grid grid-cols-2 gap-2">
          <Link href="/admin/shop/ordini" className="relative flex min-h-[3.5rem] items-center justify-center gap-2 rounded-full bg-[var(--surface-3)] text-base font-bold text-white">
            <Receipt className="h-5 w-5" aria-hidden="true" /> Ordini
            {toPrepare > 0 && <span className="rounded-full bg-[var(--accent)] px-2 py-0.5 text-xs font-extrabold text-black">{toPrepare}</span>}
          </Link>
          <Link href="/admin/shop/prodotti/nuovo" className="btn btn-primary">
            <Plus className="h-5 w-5" aria-hidden="true" /> Prodotto
          </Link>
        </div>
        <Link href="/shop" className="flex min-h-[3rem] items-center justify-center gap-1.5 text-sm font-bold text-[var(--accent)]">
          Guarda lo shop come lo vedono i giocatori <ExternalLink className="h-4 w-4" aria-hidden="true" />
        </Link>

        {products.length === 0 && <p className="py-8 text-center text-base text-[var(--muted-text)]">Nessun prodotto: aggiungi il primo.</p>}
        {products.map((p) => {
          const stock = p.variants.reduce((n, v) => n + v.stock, 0)
          return (
            <div key={p.id} className="rounded-[var(--radius-md)] bg-[var(--surface-2)] p-3">
              <Link href={`/admin/shop/prodotti/${p.id}`} className="flex items-center gap-3">
                <ProductArt src={productImages(p.images)[0]} alt={p.name} size="thumb" className="h-16 w-16 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-base font-extrabold text-white">{p.name}</p>
                  <p className="text-sm text-[var(--muted-text)]">
                    {euro(p.priceCents)} · {stock} pezzi
                  </p>
                  <p className="truncate text-xs text-[var(--muted-text)]">{p.variants.map((v) => `${v.label} ${v.stock}`).join(" · ")}</p>
                </div>
                <ChevronRight className="h-5 w-5 shrink-0 text-[var(--muted-text)]" aria-hidden="true" />
              </Link>
              <div className="mt-1 flex flex-wrap gap-x-5">
                <ProductToggle productId={p.id} field="active" value={p.active} label="In vendita" />
                <ProductToggle productId={p.id} field="featured" value={p.featured} label="In home" />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
