"use client"

/**
 * Shared client-side node-to-image capture pipeline.
 *
 * Used by every "share" surface (card, story) so the CORS/font/proxy
 * handling lives in exactly one place.
 *
 * The tricky parts this solves:
 *  - External <img> (flag CDN, Vercel-blob photos) taint the canvas → we
 *    inline them as data URLs via the same-origin /api/img-proxy.
 *  - html-to-image needs a warm-up pass before fonts/assets render clean,
 *    so we render twice and keep the second result.
 */

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

/** Replace every external <img> src with an inlined data URL (via proxy) so
 *  html-to-image can capture without CORS taint. Returns a restore fn. */
async function inlineImages(node: HTMLElement): Promise<() => void> {
  const imgs = Array.from(node.querySelectorAll<HTMLImageElement>("img"))
  const restorers: (() => void)[] = []

  await Promise.all(
    imgs.map(async (img) => {
      const src = img.src
      if (!src || src.startsWith("data:") || src.startsWith(window.location.origin)) return
      try {
        const proxied = `/api/img-proxy?url=${encodeURIComponent(src)}`
        const res = await fetch(proxied)
        if (!res.ok) return
        const dataUrl = await blobToDataUrl(await res.blob())
        img.src = dataUrl
        restorers.push(() => {
          img.src = src
        })
      } catch {
        // leave original src — capture may still succeed
      }
    }),
  )

  // Wait for re-paint after src swaps
  await new Promise((r) => setTimeout(r, 150))
  return () => restorers.forEach((r) => r())
}

/** Wait for all <img> inside the node to finish loading. */
async function waitForImages(node: HTMLElement): Promise<void> {
  const imgs = Array.from(node.querySelectorAll<HTMLImageElement>("img"))
  await Promise.all(
    imgs.map((img) =>
      img.complete
        ? Promise.resolve()
        : new Promise<void>((res) => {
            img.onload = () => res()
            img.onerror = () => res()
          }),
    ),
  )
}

/** Capture a DOM node to a PNG Blob. `pixelRatio` scales the output. */
export async function captureNodeToBlob(
  node: HTMLElement,
  opts: { pixelRatio?: number } = {},
): Promise<Blob> {
  const { toPng } = await import("html-to-image")

  await waitForImages(node)
  const restore = await inlineImages(node)

  const toPngOpts = {
    pixelRatio: opts.pixelRatio ?? 2,
    cacheBust: true,
    skipFonts: false,
  }

  try {
    // First pass warms html-to-image's internal font/asset cache
    await toPng(node, toPngOpts)
    // Second pass produces the clean render
    const dataUrl = await toPng(node, toPngOpts)
    const res = await fetch(dataUrl)
    return res.blob()
  } finally {
    restore()
  }
}

/**
 * Share (or download as fallback) a PNG blob as a file.
 * Returns "shared" | "downloaded" | "cancelled".
 */
export async function shareOrDownloadBlob(
  blob: Blob,
  fileName: string,
  shareText?: string,
): Promise<"shared" | "downloaded" | "cancelled"> {
  const file = new File([blob], fileName, { type: "image/png" })

  if (
    typeof navigator !== "undefined" &&
    navigator.share &&
    navigator.canShare?.({ files: [file] })
  ) {
    try {
      await navigator.share({
        files: [file],
        ...(shareText ? { text: shareText } : {}),
      })
      return "shared"
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return "cancelled"
      // fall through to download on real errors
    }
  }

  // Desktop / unsupported browser: trigger download
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
  return "downloaded"
}

/** Generate a QR code as a PNG data URL. Fails soft (returns null). */
export async function makeQrDataUrl(text: string): Promise<string | null> {
  try {
    const QRCode = (await import("qrcode")).default
    return await QRCode.toDataURL(text, {
      margin: 1,
      width: 320,
      errorCorrectionLevel: "M",
      color: { dark: "#0a0d0aff", light: "#ffffffff" },
    })
  } catch {
    return null
  }
}
