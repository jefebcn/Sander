import { ImageResponse } from "next/og"
import { getWeeklyRecap } from "@/actions/recap"

export const runtime = "nodejs"

const ACCENT = "#c9f31d"

function initials(name: string) {
  return name.slice(0, 2).toUpperCase()
}

export async function GET() {
  const recap = await getWeeklyRecap()
  const potw = recap.playerOfWeek
  const movers = recap.movers.filter((m) => m.ratingDelta > 0).slice(0, 5)

  return new ImageResponse(
    (
      <div
        style={{
          width: 1080,
          height: 1920,
          display: "flex",
          flexDirection: "column",
          background: "linear-gradient(170deg, #0d1209 0%, #090b09 45%, #040504 100%)",
          color: "#fff",
          fontFamily: "sans-serif",
          padding: "90px 72px",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 42, fontWeight: 900, letterSpacing: -1 }}>
            SANDER<span style={{ color: ACCENT }}>.</span>
          </span>
          <span style={{ fontSize: 26, color: "rgba(255,255,255,0.45)" }}>sanderbv.it</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", marginTop: 30 }}>
          <span style={{ fontSize: 30, fontWeight: 900, letterSpacing: 6, color: ACCENT }}>
            LA SETTIMANA
          </span>
          <span style={{ fontSize: 108, fontWeight: 900, letterSpacing: -3, lineHeight: 1 }}>
            Classifica
          </span>
          <span style={{ fontSize: 30, color: "rgba(255,255,255,0.5)", marginTop: 12 }}>
            {recap.totalEvents} partite · {recap.activePlayers} giocatori attivi
          </span>
        </div>

        {/* Player of the week */}
        {potw && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 32,
              marginTop: 50,
              padding: 40,
              borderRadius: 36,
              background: "rgba(201,243,29,0.12)",
              border: "2px solid rgba(201,243,29,0.3)",
            }}
          >
            <div
              style={{
                width: 140,
                height: 140,
                borderRadius: 70,
                background: ACCENT,
                color: "#000",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 56,
                fontWeight: 900,
              }}
            >
              {initials(potw.name)}
            </div>
            <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
              <span style={{ fontSize: 26, fontWeight: 900, letterSpacing: 3, color: ACCENT }}>
                GIOCATORE DELLA SETTIMANA
              </span>
              <span style={{ fontSize: 60, fontWeight: 900, letterSpacing: -1 }}>{potw.name}</span>
            </div>
            <span style={{ fontSize: 72, fontWeight: 900, color: "#22c55e" }}>+{potw.ratingDelta}</span>
          </div>
        )}

        {/* Movers list */}
        <div style={{ display: "flex", flexDirection: "column", marginTop: 50, gap: 20 }}>
          <span style={{ fontSize: 30, fontWeight: 900, letterSpacing: 4, color: "rgba(255,255,255,0.5)" }}>
            IN SALITA
          </span>
          {movers.map((m, i) => (
            <div
              key={m.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 28,
                padding: "26px 32px",
                borderRadius: 28,
                background: "rgba(255,255,255,0.05)",
              }}
            >
              <span style={{ fontSize: 42, fontWeight: 900, color: "rgba(255,255,255,0.4)", width: 44 }}>
                {i + 1}
              </span>
              <div
                style={{
                  width: 84,
                  height: 84,
                  borderRadius: 42,
                  background: "rgba(255,255,255,0.1)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 34,
                  fontWeight: 900,
                }}
              >
                {initials(m.name)}
              </div>
              <span style={{ fontSize: 44, fontWeight: 800, flex: 1 }}>{m.name}</span>
              <span style={{ fontSize: 44, fontWeight: 900, color: "#22c55e" }}>+{m.ratingDelta}</span>
            </div>
          ))}
        </div>

        <div style={{ flex: 1 }} />

        {/* Footer CTA */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 16,
            paddingTop: 30,
          }}
        >
          <span style={{ fontSize: 38, fontWeight: 700, color: "rgba(255,255,255,0.5)" }}>
            Entra nel gioco →
          </span>
          <span style={{ fontSize: 40, fontWeight: 900, color: ACCENT }}>sanderbv.it</span>
        </div>
      </div>
    ),
    {
      width: 1080,
      height: 1920,
      headers: { "cache-control": "public, max-age=120, s-maxage=600, stale-while-revalidate=86400" },
    },
  )
}
