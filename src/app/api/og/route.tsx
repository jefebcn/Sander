import { ImageResponse } from "next/og"
import type { NextRequest } from "next/server"

export const runtime = "edge"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const title = searchParams.get("title") ?? "SANDER"
  const subtitle = searchParams.get("subtitle") ?? "Beach Volleyball"
  const type = searchParams.get("type") ?? "session" // "session" | "tournament"

  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#0d1a0d",
          gap: "24px",
          padding: "64px",
        }}
      >
        {/* Brand label */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            background: "#c8f135",
            borderRadius: "999px",
            padding: "8px 24px",
          }}
        >
          <span style={{ fontSize: "22px", fontWeight: 900, color: "#000", letterSpacing: "-0.5px" }}>
            SANDER
          </span>
          <span style={{ fontSize: "18px", color: "#000", opacity: 0.6 }}>
            {type === "tournament" ? "🏆 Torneo" : "🏐 Partita"}
          </span>
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: title.length > 30 ? "52px" : "64px",
            fontWeight: 900,
            color: "#ffffff",
            textAlign: "center",
            lineHeight: 1.1,
            letterSpacing: "-1px",
          }}
        >
          {title}
        </div>

        {/* Subtitle */}
        {subtitle && (
          <div
            style={{
              fontSize: "28px",
              color: "rgba(255,255,255,0.5)",
              textAlign: "center",
            }}
          >
            {subtitle}
          </div>
        )}
      </div>
    ),
    { width: 1200, height: 630 }
  )
}
