import { readFile } from "node:fs/promises"
import { join } from "node:path"

/* ────────────────────────────────────────────────────────────────────────── */
/*  Pieces shared by the link previews (opengraph-image) of players and        */
/*  tournaments: 1200×630, dark with SANDER lime, a photo on the right.        */
/*  Hex colours here on purpose: ImageResponse can't read the CSS variables.   */
/* ────────────────────────────────────────────────────────────────────────── */

export const SHARE_SIZE = { width: 1200, height: 630 }
export const LIME = "#c6f736"
export const INK = "#0b0b0b"

let fonts: Promise<{ name: string; data: Buffer; weight: 500 | 800; style: "normal" }[]> | null = null
/** Brand fonts for ImageResponse (it can't load web fonts), read once per instance. */
export function shareFonts() {
  const dir = join(process.cwd(), "src", "assets", "fonts")
  fonts ??= Promise.all([
    readFile(join(dir, "BricolageGrotesque-ExtraBold.ttf")),
    readFile(join(dir, "Inter-Medium.ttf")),
  ])
    .then(([display, text]) => [
      { name: "Bricolage", data: display, weight: 800 as const, style: "normal" as const },
      { name: "Inter", data: text, weight: 500 as const, style: "normal" as const },
    ])
    // Missing files must not break a shared link: fall back to the default font.
    .catch(() => [])
  return fonts
}

/** ImageResponse options shared by every preview. */
export async function shareOptions() {
  return { ...SHARE_SIZE, fonts: await shareFonts() }
}

let logo: Promise<string> | null = null
/** The app icon as a data URL, read once per instance. */
export function logoDataUrl(): Promise<string> {
  logo ??= readFile(join(process.cwd(), "public", "icon-512.png"))
    .then((b) => `data:image/png;base64,${b.toString("base64")}`)
    .catch(() => "")
  return logo
}

/**
 * A photo as a data URL, or null. The image renderer only takes PNG and JPEG,
 * and a slow or missing photo must never break the preview.
 */
export async function photoDataUrl(url: string | null | undefined): Promise<string | null> {
  if (!url) return null
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(4000) })
    const type = res.headers.get("content-type") ?? ""
    if (!res.ok || !/^image\/(jpeg|png)/.test(type)) return null
    const buf = Buffer.from(await res.arrayBuffer())
    if (buf.byteLength > 4 * 1024 * 1024) return null
    return `data:${type.split(";")[0]};base64,${buf.toString("base64")}`
  } catch {
    return null
  }
}

/** The left column every preview shares: logo, eyebrow, big title, details. */
export function ShareLayout({
  logo,
  photo,
  eyebrow,
  title,
  lines,
  badge,
}: {
  logo: string
  photo: string | null
  eyebrow: string
  title: string
  lines: string[]
  badge?: string
}) {
  return (
    <div style={{ width: "100%", height: "100%", display: "flex", background: INK, color: "#fff", fontFamily: "Inter" }}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "56px 56px 52px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          {logo && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logo} width={72} height={72} style={{ borderRadius: 18 }} alt="" />
          )}
          <span style={{ fontSize: 26, letterSpacing: 6, color: LIME }}>{eyebrow}</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ fontFamily: "Bricolage", fontWeight: 800, fontSize: title.length > 22 ? 66 : 84, lineHeight: 1.02, letterSpacing: -2 }}>{title}</div>
          {badge && (
            <div style={{ display: "flex" }}>
              <span style={{ background: LIME, color: INK, fontFamily: "Bricolage", fontWeight: 800, fontSize: 30, borderRadius: 999, padding: "8px 26px" }}>{badge}</span>
            </div>
          )}
          {lines.map((l) => (
            <div key={l} style={{ fontSize: 32, color: "rgba(255,255,255,.75)" }}>{l}</div>
          ))}
        </div>
        <div style={{ fontFamily: "Bricolage", fontWeight: 800, fontSize: 30, color: LIME }}>sanderbv.it</div>
      </div>
      {photo && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={photo} width={440} height={630} style={{ objectFit: "cover" }} alt="" />
      )}
    </div>
  )
}
