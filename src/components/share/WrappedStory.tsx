import type { PlayerRecap } from "@/actions/recap"

/* 1080×1920 personal "SANDER Wrapped" recap — a shareable period highlight. */

interface Props {
  playerName: string
  recap: PlayerRecap
  title?: string
  qrDataUrl?: string | null
  shareUrl: string
}

const ACCENT = "#c9f31d"

function Tile({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 8,
        padding: "40px 36px",
        borderRadius: 32,
        background: accent ? "rgba(201,243,29,0.12)" : "rgba(255,255,255,0.05)",
        border: accent ? "2px solid rgba(201,243,29,0.3)" : "2px solid transparent",
      }}
    >
      <span
        style={{
          fontSize: 84,
          fontWeight: 900,
          letterSpacing: -2,
          color: accent ? ACCENT : "#fff",
          lineHeight: 1,
        }}
      >
        {value}
      </span>
      <span style={{ fontSize: 26, fontWeight: 700, letterSpacing: 2, color: "rgba(255,255,255,0.5)" }}>
        {label}
      </span>
    </div>
  )
}

export function WrappedStory({ playerName, recap, title = "IL TUO MESE", qrDataUrl, shareUrl }: Props) {
  const urlText = shareUrl.replace(/^https?:\/\//, "").replace(/\/+$/, "").replace(/^www\./, "")
  const deltaStr = `${recap.ratingDelta >= 0 ? "+" : ""}${recap.ratingDelta}`

  return (
    <div
      style={{
        width: 1080,
        height: 1920,
        display: "flex",
        flexDirection: "column",
        padding: "90px 72px",
        color: "#fff",
        fontFamily: "sans-serif",
        background:
          "radial-gradient(ellipse 70% 40% at 100% 0%, rgba(201,243,29,0.18) 0%, transparent 60%)," +
          "linear-gradient(170deg, #0d1209 0%, #090b09 45%, #040504 100%)",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 42, fontWeight: 900, letterSpacing: -1 }}>
          SANDER<span style={{ color: ACCENT }}>.</span>
        </span>
        <span style={{ fontSize: 26, color: "rgba(255,255,255,0.45)" }}>{urlText}</span>
      </div>

      {/* Title */}
      <div style={{ display: "flex", flexDirection: "column", marginTop: 40 }}>
        <span style={{ fontSize: 34, fontWeight: 900, letterSpacing: 8, color: ACCENT }}>{title}</span>
        <span style={{ fontSize: 92, fontWeight: 900, letterSpacing: -3, lineHeight: 1, marginTop: 8 }}>
          {playerName}
        </span>
      </div>

      {/* Stat grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 24,
          marginTop: 56,
        }}
      >
        <Tile label="PARTITE" value={String(recap.matches)} />
        <Tile label="VITTORIE" value={String(recap.wins)} accent />
        <Tile label="WIN RATE" value={`${recap.winRate}%`} />
        <Tile label="RATING" value={deltaStr} accent={recap.ratingDelta >= 0} />
      </div>

      {/* Secondary line */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: 28,
          padding: "32px 36px",
          borderRadius: 28,
          background: "rgba(255,255,255,0.05)",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ fontSize: 46, fontWeight: 900 }}>{recap.peakRating}</span>
          <span style={{ fontSize: 24, color: "rgba(255,255,255,0.5)", fontWeight: 700 }}>PICCO RATING</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
          <span style={{ fontSize: 46, fontWeight: 900, color: ACCENT }}>Lv.{recap.level}</span>
          <span style={{ fontSize: 24, color: "rgba(255,255,255,0.5)", fontWeight: 700 }}>LIVELLO</span>
        </div>
      </div>

      {recap.favouriteSpot && (
        <div style={{ marginTop: 24, fontSize: 32, color: "rgba(255,255,255,0.7)", fontWeight: 700 }}>
          🏖️ Campo preferito: <span style={{ color: "#fff" }}>{recap.favouriteSpot}</span>
        </div>
      )}

      <div style={{ flex: 1 }} />

      {/* Footer */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 32 }}>
        {qrDataUrl ? (
          <div style={{ background: "#fff", borderRadius: 28, padding: 18, display: "flex" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrDataUrl} alt="QR" style={{ width: 160, height: 160, display: "block" }} />
          </div>
        ) : null}
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <span style={{ fontSize: 32, fontWeight: 700, color: "rgba(255,255,255,0.55)" }}>
            {qrDataUrl ? "Inquadra e gioca" : "Gioca anche tu"}
          </span>
          <span style={{ fontSize: 48, fontWeight: 900, letterSpacing: -1 }}>Crea la tua carta</span>
          <span style={{ fontSize: 34, fontWeight: 800, color: ACCENT }}>{urlText} →</span>
        </div>
      </div>
    </div>
  )
}
