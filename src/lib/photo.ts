/* ────────────────────────────────────────────────────────────────────────── */
/*  User photos, resized for where they're shown.                              */
/*                                                                             */
/*  Avatars, Scopri photos and tournament covers are uploaded straight from    */
/*  the phone camera (often 2–4 MB each), and a list of players used to pull   */
/*  10+ MB. Served through the Next image optimizer they come back as a WebP   */
/*  of the width asked for, cached at the edge. Only photos from our blob      */
/*  store go through it (the same host is allowed in next.config `images`);   */
/*  local files, data: and blob: previews are returned as they are.            */
/*  Pure logic — usable client + server, unit-testable.                        */
/* ────────────────────────────────────────────────────────────────────────── */

/** Widths in pixels (must be in next.config `images` deviceSizes/imageSizes). */
export const PHOTO_WIDTH = {
  /** Avatars and thumbnails, up to ~100 CSS px. */
  thumb: 256,
  /** Card photos and grid tiles, up to ~240 CSS px. */
  card: 640,
  /** Full-width photos: Scopri cards, tournament covers. */
  full: 828,
} as const

export type PhotoSize = keyof typeof PHOTO_WIDTH

/** Same quality as next.config `images.qualities`. */
const QUALITY = 75

const BLOB_HOST = /\.public\.blob\.vercel-storage\.com$/

function isOptimizable(src: string): boolean {
  if (!src.startsWith("https://")) return false
  try {
    return BLOB_HOST.test(new URL(src).hostname)
  } catch {
    return false
  }
}

export function resizedPhoto(src: string, size: PhotoSize): string
export function resizedPhoto(src: string | undefined, size: PhotoSize): string | undefined
export function resizedPhoto(src: string | null | undefined, size: PhotoSize): string | null | undefined
export function resizedPhoto(src: string | null | undefined, size: PhotoSize): string | null | undefined {
  if (!src || !isOptimizable(src)) return src
  return `/_next/image?url=${encodeURIComponent(src)}&w=${PHOTO_WIDTH[size]}&q=${QUALITY}`
}
