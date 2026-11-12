"use client"

import { useState, type ReactNode } from "react"
import { colorPhotos, type ColorOption } from "@/lib/shop"
import { ProductGallery } from "./ProductGallery"
import { ProductBuy, type BuyVariant } from "./ProductBuy"

/**
 * Photos, the product's text (children, server-rendered) and the buy box,
 * sharing the chosen colour: picking a colour swaps the photos.
 */
export function ProductDetail({
  name,
  images,
  colorImages,
  colors,
  priceCents,
  variants,
  signedIn,
  slug,
  children,
}: {
  name: string
  images: string[]
  colorImages: unknown
  colors: ColorOption[] | null
  priceCents: number
  variants: BuyVariant[]
  signedIn: boolean
  slug: string
  children: ReactNode
}) {
  // The first colour leads, unless it has nothing left.
  const [color, setColor] = useState<string | null>(colors ? (colors.find((c) => c.sizes.some((z) => z.stock > 0)) ?? colors[0]).name : null)
  const photos = colorPhotos(colorImages, color, images)

  return (
    <>
      <ProductGallery key={color ?? "all"} images={photos} alt={color ? `${name}, ${color.toLowerCase()}` : name} />
      {children}
      <ProductBuy priceCents={priceCents} variants={variants} signedIn={signedIn} slug={slug} colors={colors} color={color} onColor={setColor} />
    </>
  )
}
