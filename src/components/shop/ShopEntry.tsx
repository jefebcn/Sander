import Link from "next/link"
import { ArrowRight, ChevronRight, ShoppingBag } from "lucide-react"
import { db } from "@/lib/db"
import { euro, productImages } from "@/lib/shop"
import { ProductArt } from "./ProductArt"

/** What the entry points need: is the shop open, and is a product in the spotlight. */
export async function homeShop() {
  const products = await db.shopProduct.findMany({
    where: { active: true },
    orderBy: [{ featured: "desc" }, { sortOrder: "asc" }, { createdAt: "desc" }],
    take: 1,
    select: { slug: true, name: true, priceCents: true, images: true, featured: true },
  })
  const top = products[0]
  return { open: !!top, featured: top?.featured ? { ...top, cover: productImages(top.images)[0] ?? null } : null }
}

/** Header icon next to messages and notifications (mirrors MessagesBell). */
export function ShopBell() {
  return (
    <Link
      href="/shop"
      aria-label="Shop"
      className="relative flex h-12 w-12 items-center justify-center rounded-full bg-[var(--surface-3)] ring-1 ring-white/15 transition-transform active:scale-90"
    >
      <ShoppingBag className="h-5 w-5 text-white" />
    </Link>
  )
}

/** The home's "novità" card: only while the admin keeps a product "In home". */
export function ShopFeaturedCard({ p }: { p: { slug: string; name: string; priceCents: number; cover: string | null } }) {
  return (
    <Link
      href={`/shop/${p.slug}`}
      className="pressable flex items-center gap-4 rounded-[var(--radius-lg)] bg-[var(--surface-2)] p-3.5 ring-1 ring-[var(--accent-line)]"
    >
      <ProductArt src={p.cover} alt={p.name} className="h-28 w-28 shrink-0" />
      <div className="min-w-0 flex-1">
        <span className="inline-block rounded-full bg-[var(--accent-soft)] px-2.5 py-1 text-[11px] font-extrabold tracking-wider text-[var(--accent)]">NOVITÀ · SHOP</span>
        <p className="font-display mt-1.5 text-xl font-extrabold leading-tight text-white">{p.name}</p>
        <p className="mt-0.5 text-sm text-[var(--muted-text)]">{euro(p.priceCents)} · ritiro gratis al torneo</p>
        <span className="mt-1.5 inline-flex items-center gap-1 text-sm font-extrabold text-[var(--accent)]">
          Vai allo shop <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </span>
      </div>
    </Link>
  )
}

/** Fixed row on the profile, under the card buttons. */
export function ShopProfileRow() {
  return (
    <Link href="/shop" className="pressable flex min-h-[4.5rem] items-center gap-3.5 rounded-[var(--radius-md)] bg-[var(--surface-2)] px-4">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--accent-soft)] text-[var(--accent)]">
        <ShoppingBag className="h-5 w-5" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-base font-extrabold text-white">Shop SANDER</span>
        <span className="block truncate text-sm text-[var(--muted-text)]">Maglie, canotte, accessori · I miei ordini</span>
      </span>
      <ChevronRight className="h-5 w-5 shrink-0 text-[var(--muted-text)]" aria-hidden="true" />
    </Link>
  )
}

/** After a tournament sign-up: the shirt to wear there, picked up at the court. */
export async function ShopUpsell() {
  const shop = await homeShop().catch(() => ({ open: false, featured: null }))
  if (!shop.open) return null
  return (
    <Link href={shop.featured ? `/shop/${shop.featured.slug}` : "/shop"} className="pressable flex items-center gap-3.5 rounded-[var(--radius-md)] bg-[var(--surface-2)] p-3.5 ring-1 ring-[var(--accent-line)]">
      {shop.featured ? (
        <ProductArt src={shop.featured.cover} alt={shop.featured.name} size="thumb" className="h-16 w-16 shrink-0" />
      ) : (
        <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--accent-soft)] text-[var(--accent)]">
          <ShoppingBag className="h-7 w-7" aria-hidden="true" />
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="block text-base font-extrabold text-white">Vuoi la maglia per il torneo?</span>
        <span className="block text-sm text-[var(--muted-text)]">La ritiri gratis al campo, il giorno della gara.</span>
      </span>
      <ChevronRight className="h-5 w-5 shrink-0 text-[var(--muted-text)]" aria-hidden="true" />
    </Link>
  )
}
