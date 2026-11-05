import { ImageResponse } from "next/og"
import { db } from "@/lib/db"
import { INK, LIME, logoDataUrl, photoDataUrl, qrDataUrl, shareFonts, siteUrl } from "@/lib/shareImage"

/** A printable sign for the courts (1080×1350): club, a big QR to its page, and why to scan it. */
export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const club = await db.club.findFirst({ where: { slug, status: "APPROVED" }, select: { name: true, logoUrl: true, city: true } })
  if (!club) return new Response("Club non trovato", { status: 404 })

  const link = `${siteUrl()}/c/${slug}?ref=qr`
  const [logo, clubLogo, qr, fonts] = await Promise.all([logoDataUrl(), photoDataUrl(club.logoUrl), qrDataUrl(link, 640), shareFonts()])

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", background: INK, color: "white", fontFamily: "Inter", padding: "80px 80px 60px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          {(clubLogo || logo) && <img src={clubLogo ?? logo} alt="" width={110} height={110} style={{ borderRadius: 26, objectFit: "cover" }} />}
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontFamily: "Bricolage", fontSize: 56 }}>{club.name}</span>
            <span style={{ fontSize: 30, color: "rgba(255,255,255,0.7)" }}>{club.city}</span>
          </div>
        </div>
        <span style={{ display: "flex", marginTop: 56, fontFamily: "Bricolage", fontSize: 64, color: LIME, textAlign: "center" }}>Inquadra e gioca con noi</span>
        <img src={qr} alt="" width={600} height={600} style={{ marginTop: 40, borderRadius: 32 }} />
        <span style={{ display: "flex", marginTop: 40, fontSize: 34, color: "rgba(255,255,255,0.85)", textAlign: "center" }}>Tornei, iscrizioni in coppia e classifiche</span>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: "auto" }}>
          {logo && <img src={logo} alt="" width={56} height={56} style={{ borderRadius: 14 }} />}
          <span style={{ fontSize: 30, color: "rgba(255,255,255,0.7)" }}>su SANDER · sanderbv.it</span>
        </div>
      </div>
    ),
    {
      width: 1080,
      height: 1350,
      fonts,
      headers: { "Content-Disposition": `inline; filename="qr-${slug}.png"`, "Cache-Control": "public, max-age=3600" },
    },
  )
}
