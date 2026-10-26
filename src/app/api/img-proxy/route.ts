import { NextResponse } from "next/server"
import { isSafeImageType } from "@/lib/imageUpload"

const ALLOWED_HOSTNAMES = [
  "flagcdn.com",
  "blob.vercel-storage.com",
  "public.blob.vercel-storage.com",
]

/** Uploads are capped at 8 MB; nothing bigger has a reason to pass through here. */
const MAX_BYTES = 8 * 1024 * 1024

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const url = searchParams.get("url")
  if (!url) return NextResponse.json({ error: "Missing url" }, { status: 400 })

  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return NextResponse.json({ error: "Invalid url" }, { status: 400 })
  }

  if (parsed.protocol !== "https:" || !ALLOWED_HOSTNAMES.some((h) => parsed.hostname === h || parsed.hostname.endsWith(`.${h}`))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    // No redirects: an allowed host must not bounce us somewhere else.
    const res = await fetch(url, { redirect: "manual", next: { revalidate: 86400 } })
    if (!res.ok) return NextResponse.json({ error: "Upstream error" }, { status: 502 })
    const length = Number(res.headers.get("Content-Length") ?? 0)
    if (length > MAX_BYTES) return NextResponse.json({ error: "Too large" }, { status: 413 })
    // Only raster images go out from our origin: an uploaded SVG or HTML file
    // served here would run its scripts as if it were part of SANDER.
    const type = res.headers.get("Content-Type")
    if (!isSafeImageType(type)) return NextResponse.json({ error: "Unsupported type" }, { status: 415 })
    const blob = await res.blob()
    if (blob.size > MAX_BYTES) return NextResponse.json({ error: "Too large" }, { status: 413 })
    return new NextResponse(blob, {
      headers: {
        "Content-Type": type!,
        "Cache-Control": "public, max-age=86400, immutable",
        "Access-Control-Allow-Origin": "*",
        "X-Content-Type-Options": "nosniff",
        "Content-Security-Policy": "default-src 'none'; sandbox",
      },
    })
  } catch {
    return NextResponse.json({ error: "Fetch failed" }, { status: 502 })
  }
}
