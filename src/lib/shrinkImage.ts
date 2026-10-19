/* ────────────────────────────────────────────────────────────────────────── */
/*  Shrink a photo in the browser before uploading it.                         */
/*                                                                             */
/*  Phone cameras give 3–5 MB files; on the beach's 4G that is a long wait,    */
/*  and every later view has to resize it again. The long edge is capped at    */
/*  MAX_EDGE and the result re-encoded as JPEG, which every browser can write  */
/*  (iPhone HEIC photos become JPEG too, where Safari can decode them).        */
/*  Anything that fails, or that wouldn't get smaller, uploads as it was.      */
/* ────────────────────────────────────────────────────────────────────────── */

const MAX_EDGE = 1600
const QUALITY = 0.85
/** Already small and within MAX_EDGE: re-encoding would only lose quality. */
const SMALL_ENOUGH = 500 * 1024

export async function shrinkImage(file: File): Promise<File> {
  if (typeof createImageBitmap !== "function" || !file.type.startsWith("image/") || file.type === "image/gif") return file
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" })
    const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height))
    if (scale === 1 && file.size <= SMALL_ENOUGH) {
      bitmap.close()
      return file
    }
    const canvas = document.createElement("canvas")
    canvas.width = Math.round(bitmap.width * scale)
    canvas.height = Math.round(bitmap.height * scale)
    const ctx = canvas.getContext("2d")
    if (!ctx) {
      bitmap.close()
      return file
    }
    // JPEG has no transparency: a cut-out PNG lands on white, not black.
    ctx.fillStyle = "#fff"
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    bitmap.close()
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", QUALITY))
    if (!blob || blob.size >= file.size) return file
    const name = file.name.replace(/\.[^.]+$/, "") + ".jpg"
    return new File([blob], name, { type: "image/jpeg", lastModified: Date.now() })
  } catch {
    return file
  }
}
