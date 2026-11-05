export const dynamic = "force-dynamic"

import Link from "next/link"
import type { Metadata } from "next"
import { notFound, redirect } from "next/navigation"
import { CheckCircle2 } from "lucide-react"
import { db } from "@/lib/db"
import { getCurrentPlayer, getCurrentSession } from "@/lib/getCurrentPlayer"
import { canManageTournament } from "@/lib/isAdmin"
import { formatPrice } from "@/lib/utils"
import { qrDataUrl, siteUrl } from "@/lib/shareImage"
import { SEAT_FREE_STATUSES } from "@/lib/tournament/capacity"
import { PageHeader } from "@/components/layout/PageHeader"
import { CheckInActions } from "@/components/tournament/CheckInActions"

export const metadata: Metadata = { title: "Check-in — SANDER", robots: { index: false } }

interface Props { params: Promise<{ id: string; regId: string }> }

/**
 * One URL, two views: the player opens it to show the QR at the desk; the
 * organiser scans that QR with the phone camera, lands here and checks the
 * player in (and takes the fee) with one tap.
 */
export default async function CheckInTicketPage({ params }: Props) {
  const { id, regId } = await params
  const [session, me] = await Promise.all([getCurrentSession(), getCurrentPlayer()])
  if (!session?.user) redirect(`/auth/signin?callbackUrl=/tournaments/${id}/checkin/${regId}`)

  const reg = await db.tournamentRegistration.findFirst({
    where: { id: regId, tournamentId: id },
    select: {
      id: true, playerId: true, paymentStatus: true, isSpectator: true, checkedInAt: true,
      player: { select: { name: true } },
      tournament: { select: { name: true, priceCents: true, priceCurrency: true } },
    },
  })
  if (!reg || (SEAT_FREE_STATUSES as readonly string[]).includes(reg.paymentStatus)) notFound()
  const manager = await canManageTournament(session.user.email, id)
  if (!manager && reg.playerId !== me?.id) redirect(`/tournaments/${id}`)

  const price = (reg.tournament.priceCents ?? 0) > 0 ? formatPrice(reg.tournament.priceCents, reg.tournament.priceCurrency) : null
  const owes = !!price && reg.paymentStatus === "PENDING"
  const status = (
    <div className="flex items-start gap-3 rounded-2xl bg-[var(--surface-2)] p-4">
      <CheckCircle2 className={`mt-0.5 h-5 w-5 shrink-0 ${reg.checkedInAt ? "text-[var(--live)]" : "text-[var(--muted-text)]"}`} aria-hidden="true" />
      <p className="text-base text-white">
        {reg.checkedInAt ? "Check-in fatto." : "Check-in da fare."} {reg.isSpectator ? "Spettatore." : owes ? `Quota da pagare: ${price}.` : price ? "Quota pagata." : ""}
      </p>
    </div>
  )

  return (
    <div className="pb-10">
      <PageHeader eyebrow={reg.tournament.name} tone="compete" title={reg.player.name} backHref={manager ? `/tournaments/${id}/checkin` : `/tournaments/${id}`} />
      <div className="flex flex-col gap-4 px-4">
        {status}
        {manager ? (
          <>
            <CheckInActions registrationId={reg.id} arrived={!!reg.checkedInAt} owes={owes} price={price} />
            <Link href={`/tournaments/${id}/checkin`} className="btn btn-secondary w-full">Tutti gli iscritti</Link>
          </>
        ) : (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={await qrDataUrl(`${siteUrl()}/tournaments/${id}/checkin/${reg.id}`, 640)}
              alt="QR per il check-in"
              className="mx-auto w-full max-w-xs rounded-3xl bg-white p-3"
            />
            <p className="text-center text-base text-[var(--muted-text)]">
              Mostralo all&apos;organizzatore quando arrivi: lo inquadra con la fotocamera e sei dentro.{owes ? ` Porta la quota: ${price}.` : ""}
            </p>
          </>
        )}
      </div>
    </div>
  )
}
