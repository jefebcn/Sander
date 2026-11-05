import { ImageResponse } from "next/og"
import { db } from "@/lib/db"
import { hasTimeOfDay } from "@/lib/datetime"
import { INK, LIME, logoDataUrl, photoDataUrl, qrDataUrl, shareFonts, siteUrl } from "@/lib/shareImage"

const day = new Intl.DateTimeFormat("it-IT", { timeZone: "Europe/Rome", weekday: "long", day: "numeric", month: "long" })
const time = new Intl.DateTimeFormat("it-IT", { timeZone: "Europe/Rome", hour: "2-digit", minute: "2-digit" })
const TYPE: Record<string, string> = {
  KING_OF_THE_BEACH: "King of the Beach", BRACKETS: "Eliminazione diretta", ROUND_ROBIN: "Girone 2v2", DOUBLE_ELIMINATION: "Doppia eliminazione", CHICECE: "Chicece",
}

/**
 * The tournament poster for an Instagram story (1080×1920): club, name, when,
 * where, fee, seats and a QR to the sign-up page. Downloaded from the club's
 * back office; anyone with the link can open it, like the share preview.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const t = await db.tournament.findUnique({
    where: { id },
    select: {
      name: true, date: true, location: true, type: true, priceCents: true, maxTeams: true, coverUrl: true,
      club: { select: { name: true, logoUrl: true } },
    },
  })
  if (!t) return new Response("Torneo non trovato", { status: 404 })

  const link = `${siteUrl()}/tournaments/${id}?ref=locandina`
  const [logo, clubLogo, cover, qr, fonts] = await Promise.all([
    logoDataUrl(), photoDataUrl(t.club?.logoUrl), photoDataUrl(t.coverUrl), qrDataUrl(link), shareFonts(),
  ])
  const when = hasTimeOfDay(t.date) ? `${day.format(t.date)} · ore ${time.format(t.date)}` : day.format(t.date)
  const fee = t.priceCents ? `${(t.priceCents / 100).toFixed(t.priceCents % 100 ? 2 : 0)} € a testa` : "Gratis"
  const seats = t.maxTeams ? `${t.maxTeams} ${t.type === "KING_OF_THE_BEACH" || t.type === "CHICECE" ? "giocatori" : "coppie"}` : null

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: INK, color: "white", fontFamily: "Inter", position: "relative" }}>
        {cover && <img src={cover} alt="" width={1080} height={1920} style={{ position: "absolute", top: 0, left: 0, width: 1080, height: 1920, objectFit: "cover", opacity: 0.35 }} />}
        <div style={{ position: "absolute", top: 0, left: 0, width: 1080, height: 1920, display: "flex", background: "linear-gradient(180deg, rgba(11,11,11,0.55) 0%, rgba(11,11,11,0.2) 35%, rgba(11,11,11,0.92) 70%)" }} />
        <div style={{ display: "flex", flexDirection: "column", padding: "290px 90px 0", flex: 1, position: "relative" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
            {(clubLogo || logo) && <img src={clubLogo ?? logo} alt="" width={120} height={120} style={{ borderRadius: 28, objectFit: "cover" }} />}
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: 30, letterSpacing: 4, color: LIME }}>{(TYPE[t.type] ?? "TORNEO").toUpperCase()}</span>
              {t.club && <span style={{ fontSize: 40, fontFamily: "Bricolage" }}>{t.club.name}</span>}
            </div>
          </div>
          <div style={{ display: "flex", marginTop: 70, fontFamily: "Bricolage", fontSize: t.name.length > 28 ? 104 : 128, lineHeight: 1.02 }}>{t.name}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 18, marginTop: 60, fontSize: 44 }}>
            <span style={{ display: "flex" }}>{when}</span>
            {t.location && <span style={{ display: "flex" }}>{t.location}</span>}
            <span style={{ display: "flex", gap: 20 }}>
              <span style={{ display: "flex", background: LIME, color: INK, padding: "8px 26px", borderRadius: 999, fontFamily: "Bricolage" }}>{fee}</span>
              {seats && <span style={{ display: "flex", padding: "8px 0" }}>{seats}</span>}
            </span>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 44, padding: "0 90px 420px", position: "relative" }}>
          <img src={qr} alt="" width={300} height={300} style={{ borderRadius: 24 }} />
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <span style={{ fontFamily: "Bricolage", fontSize: 58, color: LIME }}>Iscriviti su SANDER</span>
            <span style={{ fontSize: 34, color: "rgba(255,255,255,0.8)" }}>In coppia o da solo · sanderbv.it</span>
          </div>
        </div>
      </div>
    ),
    {
      width: 1080,
      height: 1920,
      fonts,
      headers: { "Content-Disposition": `inline; filename="locandina-${id}.png"`, "Cache-Control": "public, max-age=300" },
    },
  )
}
