import { NextResponse } from "next/server"

const ALLOWED_HOSTNAMES = [
  "flagcdn.com",
  "blob.vercel-storage.com",
  "public.blob.vercel-storage.com",
]

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

  if (!ALLOWED_HOSTNAMES.some((h) => parsed.hostname === h || parsed.hostname.endsWith(`.${h}`))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    const res = await fetch(url, { next: { revalidate: 86400 } })
    if (!res.ok) return NextResponse.json({ error: "Upstream error" }, { status: 502 })
    const blob = await res.blob()
    return new NextResponse(blob, {
      headers: {
        "Content-Type": res.headers.get("Content-Type") ?? "image/png",
        "Cache-Control": "public, max-age=86400, immutable",
        "Access-Control-Allow-Origin": "*",
      },
    })
  } catch {
    return NextResponse.json({ error: "Fetch failed" }, { status: 502 })
  }
}
