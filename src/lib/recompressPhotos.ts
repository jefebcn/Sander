import sharp from "sharp"
import { put, del } from "@vercel/blob"
import { db } from "@/lib/db"

/* ────────────────────────────────────────────────────────────────────────── */
/*  One-off clean-up of photos uploaded before uploads were shrunk in the      */
/*  browser (lib/shrinkImage.ts): camera originals of 2–4 MB. Each is          */
/*  re-encoded as a WebP with a 1600 px long edge, every row pointing at it    */
/*  is moved to the new file, and only then is the original deleted.          */
/*  Run from /admin/sistema in batches (a stateless offset into the list).     */
/* ────────────────────────────────────────────────────────────────────────── */

const BLOB_HOST = /\.public\.blob\.vercel-storage\.com$/
/** Re-encoded files end like this, so a second run skips them. */
const DONE_SUFFIX = "-c.webp"
/** Below this the photo is already fine. */
const MIN_BYTES = 350 * 1024
const MAX_EDGE = 1600
export const RECOMPRESS_BATCH = 6

export interface RecompressBatchResult {
  total: number
  nextOffset: number | null
  compressed: number
  savedBytes: number
  failed: number
}

function isCandidate(url: string | null): url is string {
  if (!url || url.endsWith(DONE_SUFFIX)) return false
  try {
    return BLOB_HOST.test(new URL(url).hostname)
  } catch {
    return false
  }
}

/** Every uploaded photo the app shows, once each, in a stable order. */
async function candidateUrls(): Promise<string[]> {
  const [players, photos, tournaments, registrations] = await Promise.all([
    db.player.findMany({ where: { avatarUrl: { not: null } }, select: { avatarUrl: true } }),
    db.playerPhoto.findMany({ select: { url: true } }),
    db.tournament.findMany({ where: { coverUrl: { not: null } }, select: { coverUrl: true } }),
    db.tournamentRegistration.findMany({ where: { teamLogoUrl: { not: null } }, select: { teamLogoUrl: true } }),
  ])
  const all = [
    ...players.map((p) => p.avatarUrl),
    ...photos.map((p) => p.url),
    ...tournaments.map((t) => t.coverUrl),
    ...registrations.map((r) => r.teamLogoUrl),
  ].filter(isCandidate)
  return [...new Set(all)].sort()
}

/** "https://x.public.blob…/avatars/u1/123.jpg" → "avatars/u1/123-c.webp" */
function compressedPathname(url: string): string {
  return new URL(url).pathname.replace(/^\//, "").replace(/\.[a-z0-9]+$/i, "") + DONE_SUFFIX
}

/** Bytes saved: 0 when the photo was already small enough and stays as it is. */
async function recompressOne(url: string): Promise<number> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`download ${res.status}`)
  const original = Buffer.from(await res.arrayBuffer())
  if (original.length < MIN_BYTES) return 0
  const smaller = await sharp(original)
    .rotate()
    .resize(MAX_EDGE, MAX_EDGE, { fit: "inside", withoutEnlargement: true })
    .webp({ quality: 80 })
    .toBuffer()
  if (smaller.length > original.length * 0.8) return 0

  const blob = await put(compressedPathname(url), smaller, {
    access: "public",
    contentType: "image/webp",
    addRandomSuffix: false,
    allowOverwrite: true,
  })
  await db.$transaction([
    db.player.updateMany({ where: { avatarUrl: url }, data: { avatarUrl: blob.url } }),
    db.playerPhoto.updateMany({ where: { url }, data: { url: blob.url } }),
    db.tournament.updateMany({ where: { coverUrl: url }, data: { coverUrl: blob.url } }),
    db.tournamentRegistration.updateMany({ where: { teamLogoUrl: url }, data: { teamLogoUrl: blob.url } }),
  ])
  // Nothing points at the original any more.
  await del(url).catch((e) => console.error("recompress: could not delete", url, e))
  return original.length - smaller.length
}

export async function recompressBatch(offset: number): Promise<RecompressBatchResult> {
  const urls = await candidateUrls()
  // Photos replaced in earlier batches drop out of the list, so the next batch
  // starts at the same offset minus the ones just replaced.
  const batch = urls.slice(offset, offset + RECOMPRESS_BATCH)
  let compressed = 0
  let savedBytes = 0
  let failed = 0
  for (const url of batch) {
    try {
      const saved = await recompressOne(url)
      if (saved > 0) {
        compressed++
        savedBytes += saved
      }
    } catch (e) {
      failed++
      console.error("recompress failed", url, e)
    }
  }
  const next = offset + batch.length - compressed
  return {
    total: urls.length,
    nextOffset: offset + batch.length < urls.length ? next : null,
    compressed,
    savedBytes,
    failed,
  }
}
