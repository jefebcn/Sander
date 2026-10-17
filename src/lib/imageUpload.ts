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

/**
 * The real format from the file's first bytes. The declared MIME type comes
 * from the client and can lie (an SVG sent as "image/png"), the bytes can't.
 */
export function sniffImageType(bytes: Uint8Array): string | null {
  const at = (i: number, ...sig: number[]) => sig.every((b, k) => bytes[i + k] === b)
  if (at(0, 0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)) return "image/png"
  if (at(0, 0xff, 0xd8, 0xff)) return "image/jpeg"
  if (at(0, 0x47, 0x49, 0x46, 0x38)) return "image/gif"
  if (at(0, 0x52, 0x49, 0x46, 0x46) && at(8, 0x57, 0x45, 0x42, 0x50)) return "image/webp"
  return null
}

/** Checked type of an uploaded file, or null if it isn't a safe raster image. */
export async function verifiedImageType(file: File): Promise<string | null> {
  const head = new Uint8Array(await file.slice(0, 16).arrayBuffer())
  return sniffImageType(head)
}
