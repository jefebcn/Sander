/**
 * Raster formats we accept for user uploads and serve through the image proxy.
 * SVG is deliberately excluded: it can carry scripts that would run on our own
 * origin when opened directly.
 */
export const SAFE_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"] as const

export function isSafeImageType(type: string | null | undefined): boolean {
  if (!type) return false
  const base = type.split(";")[0].trim().toLowerCase()
  return (SAFE_IMAGE_TYPES as readonly string[]).includes(base)
}

const EXT: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
}

export function imageExtension(type: string): string {
  return EXT[type.split(";")[0].trim().toLowerCase()] ?? "img"
}
