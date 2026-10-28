import { ImageResponse } from "next/og"
import { db } from "@/lib/db"
import { hasTimeOfDay } from "@/lib/datetime"
import { SHARE_SIZE, ShareLayout, logoDataUrl, photoDataUrl, shareOptions } from "@/lib/shareImage"

export const alt = "Torneo di beach volley su SANDER"
export const size = SHARE_SIZE
export const contentType = "image/png"

const day = new Intl.DateTimeFormat("it-IT", { timeZone: "Europe/Rome", weekday: "long", day: "numeric", month: "long" })
const time = new Intl.DateTimeFormat("it-IT", { timeZone: "Europe/Rome", hour: "2-digit", minute: "2-digit" })

/** The preview a shared tournament link shows: name, when, where, price, seats. */
export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const t = await db.tournament
    .findUnique({
      where: { id },
      select: {
        name: true,
        date: true,
        location: true,
        coverUrl: true,
        priceCents: true,
        status: true,
        _count: { select: { registrations: { where: { isSpectator: false } } } },
      },
    })
    .catch(() => null)
  const [logo, photo] = await Promise.all([logoDataUrl(), photoDataUrl(t?.coverUrl)])

  if (!t) {
    return new ImageResponse(<ShareLayout logo={logo} photo={null} eyebrow="TORNEO" title="Beach volley" lines={["Su SANDER"]} />, await shareOptions())
  }
  const when = hasTimeOfDay(t.date) ? `${day.format(t.date)} · ${time.format(t.date)}` : day.format(t.date)
  const price = t.priceCents ? `Quota ${(t.priceCents / 100).toFixed(t.priceCents % 100 ? 2 : 0)} €` : "Gratis"
  const lines = [[when, t.location].filter(Boolean).join(" · "), `${t._count.registrations} iscritti`]
  return new ImageResponse(
    <ShareLayout logo={logo} photo={photo} eyebrow="TORNEO" title={t.name} badge={price} lines={lines} />,
    await shareOptions(),
  )
}
