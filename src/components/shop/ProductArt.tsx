import { ShoppingBag } from "lucide-react"
import { resizedPhoto, type PhotoSize } from "@/lib/photo"
import { cn } from "@/lib/utils"

/** A product's cover photo on the shop's soft spotlight, or a placeholder. */
export function ProductArt({ src, alt, size = "card", className }: { src?: string | null; alt: string; size?: PhotoSize; className?: string }) {
  return (
    <div
      className={cn(
        "relative flex items-center justify-center overflow-hidden rounded-[var(--radius-md)] bg-[radial-gradient(circle_at_50%_40%,var(--surface-3),var(--surface-1)_70%)]",
        className,
      )}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={resizedPhoto(src, size)} alt={alt} className="h-full w-full object-cover" loading="lazy" />
      ) : (
        <ShoppingBag className="h-10 w-10 text-[var(--muted-text)]" aria-hidden="true" />
      )}
    </div>
  )
}
