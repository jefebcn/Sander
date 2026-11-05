export const dynamic = "force-dynamic"

import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Calendar, MapPin, Users } from "lucide-react"
import { db } from "@/lib/db"
import { getCurrentPlayer } from "@/lib/getCurrentPlayer"
import { PairInviteTokenSchema } from "@/lib/validators/club.schema"
import { formatDate, formatPrice } from "@/lib/utils"
import { BackButton } from "@/components/layout/PageHeader"
import { AcceptPairInviteButton } from "@/components/club/AcceptPairInviteButton"

interface Props { params: Promise<{ id: string; token: string }> }

export const metadata: Metadata = { title: "Invito a fare coppia — SANDER", robots: { index: false } }

/** Where the partner lands from the WhatsApp link: who invites, to what, and "Accetto". */
export default async function PairInvitePage({ params }: Props) {
  const { id, token } = await params
  if (!PairInviteTokenSchema.safeParse(token).success) notFound()
  const [invite, me] = await Promise.all([
    db.tournamentPairInvite.findUnique({
      where: { token },
      select: {
        status: true,
        tournamentId: true,
        fromId: true,
        from: { select: { name: true, firstName: true } },
        tournament: { select: { name: true, date: true, location: true, priceCents: true, priceCurrency: true, club: { select: { name: true } } } },
      },
    }),
    getCurrentPlayer(),
  ])
  if (!invite || invite.tournamentId !== id) notFound()
  const from = invite.from.firstName ?? invite.from.name.split(" ")[0]
  const t = invite.tournament
  const callback = `/tournaments/${id}/coppia/${token}`

  return (
    <div className="tone-compete pb-10">
      <div className="px-4" style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 1rem)" }}>
        <BackButton href={`/tournaments/${id}`} />
      </div>
      <div className="flex flex-col gap-4 px-4 pt-2">
        <div>
          <p className="eyebrow text-[var(--tone)]">Invito a fare coppia</p>
          <h1 className="font-hand text-[2.4rem] leading-[0.95] text-white">{from} ti vuole in coppia</h1>
        </div>
        <div className="flex flex-col gap-2 rounded-2xl bg-[var(--surface-2)] p-4 text-base text-white">
          <p className="text-lg font-bold">{t.name}</p>
          {t.club && <p className="text-[var(--muted-text)]">Organizzato da {t.club.name}</p>}
          <p className="flex items-center gap-2"><Calendar className="h-4 w-4 text-[var(--tone)]" aria-hidden="true" /> {formatDate(t.date)}</p>
          {t.location && <p className="flex items-center gap-2"><MapPin className="h-4 w-4 text-[var(--tone)]" aria-hidden="true" /> {t.location}</p>}
          <p className="flex items-center gap-2">
            <Users className="h-4 w-4 text-[var(--tone)]" aria-hidden="true" />
            {(t.priceCents ?? 0) > 0 ? `${formatPrice(t.priceCents, t.priceCurrency)} a testa, al campo` : "Gratis"}
          </p>
        </div>

        {invite.status !== "PENDING" ? (
          <p className="rounded-2xl bg-[var(--surface-2)] p-4 text-base text-[var(--muted-text)]">
            {invite.status === "ACCEPTED" ? "Questo invito è già stato accettato." : "Questo invito è stato annullato."}
          </p>
        ) : !me ? (
          <div className="flex flex-col gap-2">
            <Link href={`/auth/signin?mode=register&callbackUrl=${encodeURIComponent(callback)}`} className="btn btn-primary w-full">
              Registrati e accetta
            </Link>
            <Link href={`/auth/signin?callbackUrl=${encodeURIComponent(callback)}`} className="btn btn-secondary w-full">
              Ho già un account
            </Link>
            <p className="text-center text-sm text-[var(--muted-text)]">Serve un profilo SANDER: un minuto, ed è gratis.</p>
          </div>
        ) : me.id === invite.fromId ? (
          <p className="rounded-2xl bg-[var(--surface-2)] p-4 text-base text-[var(--muted-text)]">
            È il tuo invito: manda questo link al compagno.
          </p>
        ) : (
          <AcceptPairInviteButton token={token} />
        )}
      </div>
    </div>
  )
}
