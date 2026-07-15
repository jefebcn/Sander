/* 1080×1920 "Duo" chemistry card — beach volley is 2v2, so the pair is the unit. */

interface Props {
  playerA: string
  playerB: string
  played: number
  won: number
  winRate: number
  qrDataUrl?: string | null
  shareUrl: string
}

const ACCENT = "#c9f31d"

function initials(name: string) {
  const parts = name.trim().split(/\s+/)
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || name.slice(0, 2).toUpperCase()
}

export function DuoStory({ playerA, playerB, played, won, winRate, qrDataUrl, shareUrl }: Props) {
  const urlText = shareUrl.replace(/^https?:\/\//, "").replace(/\/+$/, "").replace(/^www\./, "")

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
          "radial-gradient(ellipse 70% 40% at 0% 0%, rgba(201,243,29,0.16) 0%, transparent 60%)," +
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

      <div style={{ display: "flex", flexDirection: "column", marginTop: 50 }}>
        <span style={{ fontSize: 34, fontWeight: 900, letterSpacing: 8, color: ACCENT }}>LA COPPIA</span>
        <span style={{ fontSize: 96, fontWeight: 900, letterSpacing: -3, lineHeight: 1, marginTop: 8 }}>
          Affiatamento
        </span>
      </div>

      {/* Two avatars + big chemistry number */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 40, marginTop: 80 }}>
        {[playerA, playerB].map((n, i) => (
          <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
            <div
              style={{
                width: 200,
                height: 200,
                borderRadius: 100,
                background: i === 0 ? ACCENT : "rgba(255,255,255,0.1)",
                color: i === 0 ? "#000" : "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 76,
                fontWeight: 900,
                border: "4px solid rgba(201,243,29,0.4)",
              }}
            >
              {initials(n)}
            </div>
            <span style={{ fontSize: 38, fontWeight: 800, maxWidth: 300, textAlign: "center" }}>
              {n.split(" ")[0]}
            </span>
          </div>
        ))}
      </div>

      {/* Chemistry */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: 70 }}>
        <span style={{ fontSize: 220, fontWeight: 900, color: ACCENT, lineHeight: 0.9, letterSpacing: -6 }}>
          {winRate}%
        </span>
        <span style={{ fontSize: 34, fontWeight: 800, letterSpacing: 6, color: "rgba(255,255,255,0.6)" }}>
          WIN RATE INSIEME
        </span>
      </div>

      {/* Games / wins */}
      <div style={{ display: "flex", justifyContent: "center", gap: 24, marginTop: 60 }}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            padding: "28px 56px",
            borderRadius: 28,
            background: "rgba(255,255,255,0.05)",
          }}
        >
          <span style={{ fontSize: 64, fontWeight: 900 }}>{played}</span>
          <span style={{ fontSize: 24, fontWeight: 700, color: "rgba(255,255,255,0.5)" }}>PARTITE</span>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            padding: "28px 56px",
            borderRadius: 28,
            background: "rgba(201,243,29,0.12)",
          }}
        >
          <span style={{ fontSize: 64, fontWeight: 900, color: ACCENT }}>{won}</span>
          <span style={{ fontSize: 24, fontWeight: 700, color: "rgba(255,255,255,0.5)" }}>VITTORIE</span>
        </div>
      </div>

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
            Trova il tuo compagno
          </span>
          <span style={{ fontSize: 48, fontWeight: 900, letterSpacing: -1 }}>Crea la tua coppia</span>
          <span style={{ fontSize: 34, fontWeight: 800, color: ACCENT }}>{urlText} →</span>
        </div>
      </div>
    </div>
  )
}
