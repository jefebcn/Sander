export const dynamic = "force-dynamic"

import Link from "next/link"
import type { Metadata } from "next"
import { notFound, redirect } from "next/navigation"
import { db } from "@/lib/db"
import { getCurrentSession } from "@/lib/getCurrentPlayer"
import { canManageTournament } from "@/lib/isAdmin"
import { formatPrice } from "@/lib/utils"
import { SEAT_FREE_STATUSES } from "@/lib/tournament/capacity"
import { PageHeader } from "@/components/layout/PageHeader"
import { CheckInList } from "@/components/tournament/CheckInList"

export const metadata: Metadata = { title: "Check-in — SANDER", robots: { index: false } }

interface Props { params: Promise<{ id: string }> }

/** The organiser's desk on the day: arrivals, fees, waiting list. */
export default async function CheckInPage({ params }: Props) {
  const { id } = await params
  const session = await getCurrentSession()
  if (!session?.user) redirect(`/auth/signin?callbackUrl=/tournaments/${id}/checkin`)
  if (!(await canManageTournament(session.user.email, id))) redirect(`/tournaments/${id}`)

  const t = await db.tournament.findUnique({
    where: { id },
    select: {
      name: true, priceCents: true, priceCurrency: true, clubId: true,
      registrations: {
        where: { paymentStatus: { notIn: [...SEAT_FREE_STATUSES] } },
        select: { id: true, isSpectator: true, paymentStatus: true, checkedInAt: true, paymentClaimedAt: true, player: { select: { name: true } } },
      },
      waitlist: { orderBy: { createdAt: "asc" }, select: { id: true, player: { select: { name: true } }, partner: { select: { name: true } } } },
    },
  })
  if (!t) notFound()
  const price = (t.priceCents ?? 0) > 0 ? formatPrice(t.priceCents, t.priceCurrency) : null
  const entries = t.registrations.map((r) => ({
    id: r.id,
    name: r.player.name,
    spectator: r.isSpectator,
    arrived: !!r.checkedInAt,
    owes: !!price && r.paymentStatus === "PENDING",
    claimed: !!price && r.paymentStatus === "PENDING" && !!r.paymentClaimedAt,
  }))
  const players = entries.filter((e) => !e.spectator)
  const arrived = players.filter((e) => e.arrived).length
  const toPay = entries.filter((e) => e.owes).length
  const toConfirm = entries.filter((e) => e.claimed).length

  return (
    <div className="pb-10">
      <PageHeader eyebrow="Check-in" tone="compete" title={t.name} backHref={`/tournaments/${id}`} />
      <div className="flex flex-col gap-4 px-4">
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-2xl bg-[var(--surface-2)] p-4">
            <p className="eyebrow text-[var(--muted-text)]">Arrivati</p>
            <p className="text-2xl font-black text-white">{arrived}/{players.length}</p>
          </div>
          <div className="rounded-2xl bg-[var(--surface-2)] p-4">
            <p className="eyebrow text-[var(--muted-text)]">Da pagare</p>
            <p className="text-2xl font-black text-white">{toPay}</p>
            {toConfirm > 0 && <p className="text-sm text-[var(--accent)]">{toConfirm} da confermare</p>}
          </div>
        </div>
        <p className="text-base text-[var(--muted-text)]">
          Tocca <b className="text-white">Arrivato?</b> quando un giocatore arriva, <b className="text-white">Pagato</b> se paga ora. Puoi anche inquadrare con la fotocamera il QR che il giocatore trova nella pagina del torneo. «Dice di aver pagato» vuol dire che ha pagato con il vostro link: controlla sul conto e tocca Pagato.
        </p>
        <CheckInList entries={entries} price={price} />
        {t.waitlist.length > 0 && (
          <section className="flex flex-col gap-2">
            <h2 className="eyebrow text-[var(--accent)]">Lista d&apos;attesa</h2>
            <ol className="flex flex-col gap-2">
              {t.waitlist.map((w, i) => (
                <li key={w.id} className="flex min-h-[3.5rem] items-center gap-3 rounded-2xl bg-[var(--surface-2)] px-4 text-base text-white">
                  <span className="font-black text-[var(--accent)]">{i + 1}</span> {w.partner ? `${w.player.name} e ${w.partner.name} (coppia)` : w.player.name}
                </li>
              ))}
            </ol>
            <p className="text-sm text-[var(--muted-text)]">Se qualcuno si ritira, il primo della lista entra da solo e riceve una notifica. Una coppia entra quando si liberano due posti.</p>
          </section>
        )}
        <Link href={`/tournaments/${id}`} className="btn btn-secondary w-full">Torna al torneo</Link>
      </div>
    </div>
  )
}
