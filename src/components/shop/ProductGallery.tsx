"use client"

import { useRef, useState } from "react"
import { ProductArt } from "./ProductArt"
import { cn } from "@/lib/utils"

/** Swipeable photos with dots; one photo or none needs no swiping. */
export function ProductGallery({ images, alt }: { images: string[]; alt: string }) {
  const [index, setIndex] = useState(0)
  const ref = useRef<HTMLDivElement>(null)

  if (images.length <= 1) return <ProductArt src={images[0]} alt={alt} size="full" className="aspect-square w-full" />

  return (
    <div>
      <div
        ref={ref}
        onScroll={(e) => {
          const el = e.currentTarget
          setIndex(Math.round(el.scrollLeft / el.clientWidth))
        }}
        className="flex snap-x snap-mandatory overflow-x-auto rounded-[var(--radius-md)] [scrollbar-width:none]"
      >
        {images.map((src, i) => (
          <ProductArt key={src} src={src} alt={`${alt}, foto ${i + 1}`} size="full" className="aspect-square w-full shrink-0 snap-center rounded-none" />
        ))}
      </div>
      <div className="mt-2 flex justify-center gap-1.5" aria-hidden="true">
        {images.map((src, i) => (
          <span key={src} className={cn("h-1.5 rounded-full transition-all", i === index ? "w-5 bg-[var(--accent)]" : "w-1.5 bg-white/25")} />
        ))}
      </div>
    </div>
  )
}
