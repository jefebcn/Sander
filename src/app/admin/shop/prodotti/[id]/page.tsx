export const dynamic = "force-dynamic"

import type { Metadata } from "next"
import { notFound, redirect } from "next/navigation"
import { db } from "@/lib/db"
import { getCurrentSession } from "@/lib/getCurrentPlayer"
import { isAdminEmail } from "@/lib/isAdmin"
import { productImages, SIZE_PRESETS } from "@/lib/shop"
import { PageHeader } from "@/components/layout/PageHeader"
import { ShopProductForm, type ShopProductFormValues } from "@/components/admin/shop/ShopProductForm"

export const metadata: Metadata = { title: "Prodotto — Admin SANDER" }

/** /admin/shop/prodotti/nuovo creates one; any other id edits it. */
export default async function AdminShopProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getCurrentSession()
  if (!session?.user?.id) redirect(`/auth/signin?callbackUrl=/admin/shop/prodotti/${id}`)
  if (!isAdminEmail(session.user.email)) redirect("/admin/accesso")

  let initial: ShopProductFormValues
  if (id === "nuovo") {
    initial = {
      name: "",
      description: "",
      category: "MAGLIE",
      price: "",
      images: [],
      active: false,
      featured: false,
      sortOrder: 0,
      variants: SIZE_PRESETS.shirts.map((label) => ({ label, stock: 0 })),
    }
  } else {
    const p = await db.shopProduct.findUnique({ where: { id }, include: { variants: { orderBy: { sortOrder: "asc" } } } })
    if (!p) notFound()
    initial = {
      id: p.id,
      name: p.name,
      description: p.description,
      category: p.category === "ACCESSORI" ? "ACCESSORI" : "MAGLIE",
      price: (p.priceCents / 100).toString().replace(".", ","),
      images: productImages(p.images),
      active: p.active,
      featured: p.featured,
      sortOrder: p.sortOrder,
      variants: p.variants.map((v) => ({ id: v.id, label: v.label, stock: v.stock })),
    }
  }

  return (
    <div className="pb-28">
      <PageHeader title={id === "nuovo" ? "Nuovo prodotto" : "Modifica"} eyebrow="Shop" backHref="/admin/shop" />
      <ShopProductForm initial={initial} />
    </div>
  )
}
