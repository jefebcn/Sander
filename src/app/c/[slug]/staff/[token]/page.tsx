export const dynamic = "force-dynamic"

import Link from "next/link"
import type { Metadata } from "next"
import { db } from "@/lib/db"
import { getCurrentPlayer } from "@/lib/getCurrentPlayer"
import { PageHeader } from "@/components/layout/PageHeader"
import { StaffJoinButton } from "@/components/club/StaffJoinButton"
import { StaffInviteTokenSchema } from "@/lib/validators/club.schema"

export const metadata: Metadata = { title: "Invito nello staff — SANDER", robots: { index: false } }

interface Props { params: Promise<{ slug: string; token: string }> }

/** Landing page of the staff link the club owner shares. */
export default async function StaffInvitePage({ params }: Props) {
  const { slug, token } = await params
  const valid = StaffInviteTokenSchema.safeParse(token).success
  const [club, me] = await Promise.all([
    valid ? db.club.findFirst({ where: { slug, staffInviteToken: token, status: "APPROVED" }, select: { id: true, name: true, city: true } }) : null,
    getCurrentPlayer(),
  ])
  const member = club && me ? await db.clubMember.findUnique({ where: { clubId_playerId: { clubId: club.id, playerId: me.id } }, select: { id: true } }) : null

  return (
    <div className="pb-10">
      <PageHeader eyebrow="Staff del club" tone="compete" title={club?.name ?? "Invito"} backHref={`/c/${slug}`} />
      <div className="flex flex-col gap-4 px-4">
        {!club ? (
          <p className="rounded-2xl bg-[var(--surface-2)] p-4 text-base text-white">
            Questo link non è più valido. Chiedi al club di mandartene uno nuovo.
          </p>
        ) : member ? (
          <>
            <p className="rounded-2xl bg-[var(--surface-2)] p-4 text-base text-white">Sei già nello staff di {club.name}.</p>
            <Link href={`/c/${slug}/gestione`} className="btn btn-primary w-full">Vai alla gestione</Link>
          </>
        ) : (
          <>
            <p className="rounded-2xl bg-[var(--surface-2)] p-4 text-base text-white">
              {club.name} ({club.city}) ti invita nello staff: potrai creare tornei, gestire iscrizioni e quote, fare il check-in e scrivere ai giocatori.
            </p>
            {me ? (
              <StaffJoinButton token={token} />
            ) : (
              <Link href={`/auth/signin?callbackUrl=${encodeURIComponent(`/c/${slug}/staff/${token}`)}&mode=register`} className="btn btn-primary w-full">
                Accedi per entrare nello staff
              </Link>
            )}
          </>
        )}
      </div>
    </div>
  )
}
