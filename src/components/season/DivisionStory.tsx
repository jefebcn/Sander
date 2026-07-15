import { DIVISIONS, getDivision } from "@/lib/divisions"

/* 1080×1920 shareable division emblem — "Sono in Divisione Tempesta". */

interface Props {
  playerName: string
  divisionKey: string
  rating: number
  seasonName: string
  rank?: number | null
  qrDataUrl?: string | null
  shareUrl: string
}

const ACCENT = "#c9f31d"

export function DivisionStory({
  playerName,
  divisionKey,
  rating,
  seasonName,
  rank,
  qrDataUrl,
  shareUrl,
}: Props) {
  const division = DIVISIONS.find((d) => d.key === divisionKey) ?? getDivision(rating)
  const c = division.color
  const urlText = shareUrl.replace(/^https?:\/\//, "").replace(/\/+$/, "").replace(/^www\./, "")

  return (
    <div
      style={{
        width: 1080,
        height: 1920,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "90px 72px",
        color: "#fff",
        fontFamily: "sans-serif",
        background: `radial-gradient(ellipse 80% 50% at 50% 22%, ${c}2e 0%, transparent 60%), linear-gradient(170deg, #0d1209 0%, #090b09 45%, #040504 100%)`,
      }}
    >
      {/* Header */}
      <div
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span style={{ fontSize: 42, fontWeight: 900, letterSpacing: -1 }}>
          SANDER<span style={{ color: ACCENT }}>.</span>
        </span>
        <span style={{ fontSize: 26, color: "rgba(255,255,255,0.45)" }}>{seasonName}</span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: 90 }}>
        <span style={{ fontSize: 32, fontWeight: 900, letterSpacing: 8, color: "rgba(255,255,255,0.55)" }}>
          LA MIA DIVISIONE
        </span>
      </div>

      {/* Emblem */}
      <div
        style={{
          position: "relative",
          width: 520,
          height: 520,
          marginTop: 40,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            position: "absolute",
            width: 520,
            height: 520,
            borderRadius: 150,
            background: c,
            opacity: 0.22,
            filter: "blur(60px)",
          }}
        />
        <div
          style={{
            width: 460,
            height: 460,
            borderRadius: 130,
            border: `10px solid ${c}`,
            background: "linear-gradient(160deg, #14181a 0%, #0a0c0d 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: `inset 0 0 120px ${c}33`,
          }}
        >
          <span style={{ fontSize: 240, lineHeight: 1 }}>{division.emoji}</span>
        </div>
      </div>

      <span
        style={{
          fontSize: 128,
          fontWeight: 900,
          letterSpacing: -4,
          color: c,
          marginTop: 40,
          lineHeight: 1,
        }}
      >
        {division.name}
      </span>
      <span style={{ fontSize: 46, fontWeight: 800, marginTop: 24 }}>{playerName}</span>
      <span style={{ fontSize: 32, fontWeight: 700, color: "rgba(255,255,255,0.5)", marginTop: 8 }}>
        {rating} rating{rank ? ` · #${rank} in classifica` : ""}
      </span>

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
            Scala le divisioni
          </span>
          <span style={{ fontSize: 48, fontWeight: 900, letterSpacing: -1 }}>Gioca anche tu</span>
          <span style={{ fontSize: 34, fontWeight: 800, color: ACCENT }}>{urlText} →</span>
        </div>
      </div>
    </div>
  )
}
