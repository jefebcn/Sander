import { ImageResponse } from "next/og"
import type { NextRequest } from "next/server"
import { db } from "@/lib/db"

export const runtime = "nodejs"

const ACCENT = "#c9f31d"

const TYPE_LABEL: Record<string, string> = {
  KING_OF_THE_BEACH: "King of the Beach",
  BRACKETS: "Classico",
  ROUND_ROBIN: "Round Robin",
  DOUBLE_ELIMINATION: "Doppia Eliminazione",
  CHICECE: "Chicece",
}

export async function GET(req: NextRequest) {
  const id = new URL(req.url).searchParams.get("id") ?? ""
  const t = await db.tournament
    .findUnique({
      where: { id },
      select: {
        name: true,
        date: true,
        location: true,
        type: true,
        _count: { select: { registrations: true } },
      },
    })
    .catch(() => null)

  const name = t?.name ?? "Torneo SANDER"
  const dateLabel = t
    ? new Date(t.date).toLocaleDateString("it-IT", { day: "2-digit", month: "long", year: "numeric" })
    : ""
  const location = t?.location ?? ""
  const typeLabel = t ? (TYPE_LABEL[t.type] ?? t.type) : ""
  const players = t?._count.registrations ?? 0

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
            "radial-gradient(ellipse 80% 45% at 0% 0%, rgba(201,243,29,0.18) 0%, transparent 60%)," +
            "linear-gradient(160deg, #12160b 0%, #090b09 50%, #040504 100%)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 46, fontWeight: 900, letterSpacing: -1 }}>
            SANDER<span style={{ color: ACCENT }}>.</span>
          </span>
          <span style={{ fontSize: 28, color: "rgba(255,255,255,0.45)" }}>sanderbv.it</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", marginTop: 60 }}>
          <div
            style={{
              display: "flex",
              alignSelf: "flex-start",
              background: ACCENT,
              color: "#000",
              borderRadius: 999,
              padding: "16px 40px",
              fontSize: 34,
              fontWeight: 900,
              letterSpacing: 2,
            }}
          >
            🏆 TORNEO · ISCRIZIONI APERTE
          </div>
          <span
            style={{
              fontSize: name.length > 22 ? 90 : 118,
              fontWeight: 900,
              letterSpacing: -3,
              lineHeight: 1.02,
              marginTop: 44,
            }}
          >
            {name}
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 30, marginTop: 80 }}>
          {dateLabel && (
            <span style={{ fontSize: 52, fontWeight: 700 }}>📅 {dateLabel}</span>
          )}
          {location && (
            <span style={{ fontSize: 52, fontWeight: 700, color: "rgba(255,255,255,0.85)" }}>
              📍 {location}
            </span>
          )}
          {typeLabel && (
            <span style={{ fontSize: 44, fontWeight: 700, color: "rgba(255,255,255,0.55)" }}>
              🏐 {typeLabel}
              {players > 0 ? ` · ${players} iscritti` : ""}
            </span>
          )}
        </div>

        <div style={{ flex: 1 }} />

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 40, fontWeight: 700, color: "rgba(255,255,255,0.55)" }}>
            Prendi il tuo posto in campo
          </span>
          <span style={{ fontSize: 52, fontWeight: 900, color: ACCENT }}>Iscriviti · sanderbv.it</span>
        </div>
      </div>
    ),
    { width: 1080, height: 1920 },
  )
}
