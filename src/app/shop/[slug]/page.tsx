export const dynamic = "force-dynamic"

import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { EyeOff } from "lucide-react"
import { db } from "@/lib/db"
import { getCurrentPlayer, getCurrentSession } from "@/lib/getCurrentPlayer"
import { isAdminEmail } from "@/lib/isAdmin"
import { euro, productImages } from "@/lib/shop"
import { releaseExpiredShopHolds } from "@/lib/shopOrders"
import { BackButton } from "@/components/layout/PageHeader"
import { ProductGallery } from "@/components/shop/ProductGallery"
import { ProductBuy } from "@/components/shop/ProductBuy"

async function load(slug: string) {
  return db.shopProduct.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      description: true,
      priceCents: true,
      images: true,
      active: true,
      variants: { orderBy: { sortOrder: "asc" }, select: { id: true, label: true, stock: true } },
    },
  })
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const p = await load(slug)
  if (!p || !p.active) return { title: "Shop | SANDER" }
  return { title: `${p.name} | Shop SANDER`, description: p.description.slice(0, 160) || `${p.name}: ${euro(p.priceCents)} sullo shop SANDER.` }
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  // Pieces held by abandoned checkouts go back on sale before we show sizes.
  await releaseExpiredShopHolds(5).catch(() => 0)
  const [p, session, me] = await Promise.all([load(slug), getCurrentSession(), getCurrentPlayer()])
  const admin = isAdminEmail(session?.user?.email)
  if (!p || (!p.active && !admin)) notFound()
  const images = productImages(p.images)

  return (
    <div className="pb-28">
      <div className="flex items-center px-4 pb-2" style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 0.75rem)" }}>
        <BackButton href="/shop" />
      </div>
      <div className="flex flex-col gap-4 px-4">
        <ProductGallery images={images} alt={p.name} />
        {!p.active && (
          <p className="flex items-center gap-2 rounded-[var(--radius-sm)] bg-[var(--surface-3)] px-4 py-3 text-sm font-bold text-white">
            <EyeOff className="h-4 w-4" aria-hidden="true" /> Nascosto: lo vedi solo tu (admin)
          </p>
        )}
        <div className="flex items-start gap-3">
          <h1 className="font-display min-w-0 flex-1 text-3xl font-extrabold leading-tight text-white">{p.name}</h1>
          <p className="num shrink-0 text-3xl text-[var(--accent)]">{euro(p.priceCents)}</p>
        </div>
        {p.description && <p className="whitespace-pre-line text-base leading-relaxed text-[var(--muted-text)]">{p.description}</p>}
        <ProductBuy priceCents={p.priceCents} variants={p.variants} signedIn={!!me} slug={slug} />
      </div>
    </div>
  )
}
