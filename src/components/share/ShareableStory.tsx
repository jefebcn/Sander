import { SanderCardFut } from "@/components/player/SanderCardFut"
import type { PlayerCardData } from "@/components/player/SanderCardFut"

/* ────────────────────────────────────────────────────────────────────────── */
/*  Story-format (1080×1920) shareable image.                                  */
/*                                                                             */
/*  This is the viral object: rendered off-screen, captured to PNG, then       */
/*  shared to Instagram Story / WhatsApp Status. Every share carries the        */
/*  SANDER brand + a QR/URL back to the app, turning each user into a           */
/*  distribution channel.                                                       */
/* ────────────────────────────────────────────────────────────────────────── */

export type StoryVariant = "card" | "win" | "levelup" | "tier" | "record"

interface Props {
  playerData: PlayerCardData
  variant: StoryVariant
  /** Overrides the auto headline (e.g. "LIVELLO 5"). */
  headline?: string
  /** Overrides the auto subline. */
  subline?: string
  /** QR code data URL (from makeQrDataUrl). Falls back to URL text if null. */
  qrDataUrl?: string | null
  /** URL shown/encoded for download (e.g. https://www.sanderbv.it). */
  shareUrl: string
}

const ACCENT = "#c9f31d"

function tierLabel(glicko: number): string {
  if (glicko >= 2000) return "ORO"
  if (glicko >= 1500) return "ARGENTO"
  return "BRONZO"
}

function defaults(variant: StoryVariant, p: PlayerCardData): { headline: string; subline: string } {
  const rating = Math.round(p.glicko2)
  switch (variant) {
    case "win":
      return { headline: "VITTORIA", subline: "Un'altra W sul campo 🏐" }
    case "levelup":
      return { headline: "LEVEL UP", subline: "Nuovo livello sbloccato" }
    case "tier":
      return { headline: `CARTA ${tierLabel(rating)}`, subline: "Nuovo tier sbloccato" }
    case "record":
      return { headline: "NUOVO RECORD", subline: `${rating} RATING · best personale` }
    case "card":
    default:
      return { headline: "LA MIA CARTA", subline: `${tierLabel(rating)} · ${rating} RATING` }
  }
}

export function ShareableStory({
  playerData,
  variant,
  headline,
  subline,
  qrDataUrl,
  shareUrl,
}: Props) {
  const auto = defaults(variant, playerData)
  const h = headline ?? auto.headline
  const s = subline ?? auto.subline
  const urlText = shareUrl.replace(/^https?:\/\//, "").replace(/\/+$/, "").replace(/^www\./, "")

  return (
    <div
      style={{
        position: "relative",
        width: 1080,
        height: 1920,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        fontFamily: "-apple-system, 'SF Pro Display', 'Helvetica Neue', Arial, sans-serif",
        color: "#fff",
        background:
          "radial-gradient(ellipse 70% 40% at 100% 0%, rgba(201,243,29,0.18) 0%, transparent 60%)," +
          "radial-gradient(ellipse 60% 40% at 0% 100%, rgba(201,243,29,0.08) 0%, transparent 55%)," +
          "linear-gradient(170deg, #0d1209 0%, #090b09 45%, #040504 100%)",
      }}
    >
      {/* Faint logo watermark */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/sander-logo.png"
        alt=""
        crossOrigin="anonymous"
        style={{
          position: "absolute",
          top: 380,
          right: -120,
          width: 620,
          height: 620,
          opacity: 0.06,
          objectFit: "contain",
        }}
      />

      {/* ── Header ─────────────────────────────────────────────── */}
      <div
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "80px 72px 0",
          zIndex: 2,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/sander-logo.png"
            alt="SANDER"
            crossOrigin="anonymous"
            style={{ width: 72, height: 72, objectFit: "contain" }}
          />
          <span style={{ fontSize: 40, fontWeight: 900, letterSpacing: -1 }}>
            SANDER<span style={{ color: ACCENT }}>.</span>
          </span>
        </div>
        <span style={{ fontSize: 26, fontWeight: 700, color: "rgba(255,255,255,0.45)" }}>
          {urlText}
        </span>
      </div>

      {/* ── Headline ───────────────────────────────────────────── */}
      <div style={{ marginTop: 60, textAlign: "center", zIndex: 2, padding: "0 60px" }}>
        <div
          style={{
            display: "inline-block",
            background: "rgba(201,243,29,0.14)",
            border: "2px solid rgba(201,243,29,0.35)",
            color: ACCENT,
            borderRadius: 999,
            padding: "12px 34px",
            fontSize: 30,
            fontWeight: 900,
            letterSpacing: 4,
            textTransform: "uppercase",
            marginBottom: 26,
          }}
        >
          {s}
        </div>
        <div
          style={{
            fontSize: h.length > 12 ? 110 : 140,
            fontWeight: 900,
            lineHeight: 0.95,
            letterSpacing: -3,
            color: "#fff",
            textShadow: "0 6px 40px rgba(201,243,29,0.25)",
          }}
        >
          {h}
        </div>
      </div>

      {/* ── Player card ────────────────────────────────────────── */}
      <div style={{ marginTop: 50, width: 760, zIndex: 2 }}>
        <SanderCardFut playerData={playerData} className="max-w-[760px]" />
      </div>

      {/* ── Name + rating strip ────────────────────────────────── */}
      <div style={{ marginTop: 24, textAlign: "center", zIndex: 2 }}>
        <div style={{ fontSize: 52, fontWeight: 900, letterSpacing: -1 }}>
          {playerData.name}
        </div>
      </div>

      {/* ── Footer: QR + download CTA ──────────────────────────── */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          padding: "0 72px 96px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 32,
          zIndex: 2,
        }}
      >
        {qrDataUrl ? (
          <div
            style={{
              background: "#fff",
              borderRadius: 28,
              padding: 18,
              display: "flex",
              flexShrink: 0,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrDataUrl} alt="QR" style={{ width: 168, height: 168, display: "block" }} />
          </div>
        ) : null}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <span style={{ fontSize: 30, fontWeight: 700, color: "rgba(255,255,255,0.55)" }}>
            {qrDataUrl ? "Inquadra e scarica" : "Scarica l'app"}
          </span>
          <span style={{ fontSize: 46, fontWeight: 900, letterSpacing: -1, color: "#fff" }}>
            Crea la tua carta
          </span>
          <span style={{ fontSize: 34, fontWeight: 800, color: ACCENT }}>
            {urlText} →
          </span>
        </div>
      </div>
    </div>
  )
}
