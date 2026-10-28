import { ImageResponse } from "next/og"
import { db } from "@/lib/db"
import { getDivision } from "@/lib/divisions"
import { SHARE_SIZE, ShareLayout, logoDataUrl, photoDataUrl, shareOptions } from "@/lib/shareImage"

export const alt = "Carta giocatore SANDER"
export const size = SHARE_SIZE
export const contentType = "image/png"

/** The preview a shared player link shows: name, division, rating, comune. */
export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const player = await db.player
    .findUnique({
      where: { id },
      select: { name: true, avatarUrl: true, glickoRating: true, homeCity: true, matchesWon: true, matchesLost: true },
    })
    .catch(() => null)
  const [logo, photo] = await Promise.all([logoDataUrl(), photoDataUrl(player?.avatarUrl)])

  if (!player) {
    return new ImageResponse(<ShareLayout logo={logo} photo={null} eyebrow="SANDER" title="Beach volley" lines={["Trova con chi giocare"]} />, await shareOptions())
  }
  const division = getDivision(player.glickoRating)
  const played = player.matchesWon + player.matchesLost
  const lines = [
    [player.homeCity, `Rating ${Math.round(player.glickoRating)}`].filter(Boolean).join(" · "),
    played > 0 ? `${played} partite · ${player.matchesWon} vinte` : "Carta giocatore su SANDER",
  ]
  return new ImageResponse(
    <ShareLayout logo={logo} photo={photo} eyebrow="CARTA GIOCATORE" title={player.name} badge={division.name} lines={lines} />,
    await shareOptions(),
  )
}
