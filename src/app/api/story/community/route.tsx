import { ImageResponse } from "next/og"
import { db } from "@/lib/db"

export const runtime = "nodejs"

const ACCENT = "#c9f31d"

export async function GET() {
  const [players, sessions, tournaments] = await Promise.all([
    db.player.count().catch(() => 0),
    db.session.count({ where: { status: "COMPLETED" } }).catch(() => 0),
    db.tournament.count().catch(() => 0),
  ])

  const stats: [string, string][] = [
    [String(players), "GIOCATORI"],
    [String(sessions), "PARTITE"],
    [String(tournaments), "TORNEI"],
  ]

  return new ImageResponse(
    (
      <div
        style={{
          width: 1080,
          height: 1920,
          display: "flex",
          flexDirection: "column",
          padding: "110px 80px",
          color: "#fff",
          fontFamily: "sans-serif",
          background:
            "radial-gradient(ellipse 75% 45% at 100% 0%, rgba(201,243,29,0.2) 0%, transparent 60%)," +
            "linear-gradient(170deg, #0d1209 0%, #090b09 45%, #040504 100%)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 46, fontWeight: 900, letterSpacing: -1 }}>
            SANDER<span style={{ color: ACCENT }}>.</span>
          </span>
          <span style={{ fontSize: 28, color: "rgba(255,255,255,0.45)" }}>sanderbv.it</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", marginTop: 70 }}>
          <span style={{ fontSize: 36, fontWeight: 900, letterSpacing: 8, color: ACCENT }}>
            LA COMMUNITY
          </span>
          <span style={{ fontSize: 120, fontWeight: 900, letterSpacing: -4, lineHeight: 1 }}>
            cresce 🔥
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 28, marginTop: 90 }}>
          {stats.map(([v, label]) => (
            <div
              key={label}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "48px 56px",
                borderRadius: 36,
                background: "rgba(255,255,255,0.05)",
                border: "2px solid rgba(201,243,29,0.15)",
              }}
            >
              <span style={{ fontSize: 40, fontWeight: 800, color: "rgba(255,255,255,0.6)", letterSpacing: 3 }}>
                {label}
              </span>
              <span style={{ fontSize: 128, fontWeight: 900, color: ACCENT, lineHeight: 1 }}>{v}</span>
            </div>
          ))}
        </div>

        <div style={{ flex: 1 }} />

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 40, fontWeight: 700, color: "rgba(255,255,255,0.55)" }}>
            Il beach volley della Riviera
          </span>
          <span style={{ fontSize: 52, fontWeight: 900, color: ACCENT }}>Unisciti · sanderbv.it</span>
        </div>
      </div>
    ),
    { width: 1080, height: 1920 },
  )
}
