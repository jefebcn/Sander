import { NextResponse } from "next/server"

// Apple App Site Association — enables Universal Links for the Sander iOS app.
// Replace TEAM_ID with the 10-char Apple Developer Team ID from developer.apple.com → Account → Membership.
const AASA = {
  applinks: {
    details: [
      {
        appIDs: ["TEAM_ID.com.sanderbv.app"],
        components: [
          { "/": "/tournaments/*", comment: "Tournament pages" },
          { "/": "/sessions/*",    comment: "Session pages" },
          { "/": "/players/*",     comment: "Player pages" },
        ],
      },
    ],
  },
}

export function GET() {
  return NextResponse.json(AASA, {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=3600",
    },
  })
}
