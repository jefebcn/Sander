export const dynamic = "force-dynamic"

import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { Download, Plus, Users } from "lucide-react"
import { db } from "@/lib/db"
import { getCurrentPlayer, getCurrentSession } from "@/lib/getCurrentPlayer"
import { canManageClub } from "@/lib/clubAccess"
import { holdsSeat } from "@/lib/tournament/capacity"
import { formatDate } from "@/lib/utils"
import { PageHeader } from "@/components/layout/PageHeader"
import { ClubForm } from "@/components/club/ClubForm"

interface Props { params: Promise<{ slug: string }> }

/** The club's back office: its tournaments with sign-ups and payments, and the page details. */
export default async function ClubManagePage({ params }: Props) {
  const { slug } = await params
  const [session, me] = await Promise.all([getCurrentSession(), getCurrentPlayer()])
  if (!me) redirect(`/auth/signin?callbackUrl=/c/${slug}/gestione`)
  const club = await db.club.findUnique({ where: { slug } })
  if (!club) notFound()
  if (!(await canManageClub(session?.user?.email, me.id, club.id))) redirect(`/c/${slug}`)

  const tournaments = await db.tournament.findMany({
    where: { clubId: club.id },
    orderBy: { date: "desc" },
    take: 30,
    select: {
      id: true, name: true, date: true, status: true, priceCents: true, maxTeams: true, type: true,
      registrations: { select: { paymentStatus: true, isSpectator: true } },
    },
  })

  return (
    <div className="pb-10">
      <PageHeader eyebrow="Gestione club" tone="compete" title={club.name} backHref={`/c/${slug}`} />
      <div className="flex flex-col gap-5 px-4">
        <Link href={`/tournaments/new?club=${club.id}`} className="btn btn-primary w-full gap-2">
          <Plus className="h-5 w-5" aria-hidden="true" /> Nuovo torneo del club
        </Link>

        <section className="flex flex-col gap-2">
          <h2 className="eyebrow text-[var(--accent)]">Tornei</h2>
          {tournaments.length === 0 && (
            <p className="rounded-2xl bg-[var(--surface-2)] p-4 text-base text-[var(--muted-text)]">
              Ancora nessun torneo. Crealo, apri le iscrizioni e metti il link nella bio di Instagram.
            </p>
          )}
          {tournaments.map((t) => {
            const players = t.registrations.filter(holdsSeat)
            const unpaid = (t.priceCents ?? 0) > 0 ? players.filter((r) => r.paymentStatus === "PENDING").length : 0
            return (
              <div key={t.id} className="rounded-2xl bg-[var(--surface-2)] p-4">
                <Link href={`/tournaments/${t.id}`} className="block">
                  <p className="text-base font-bold text-white">{t.name}</p>
                  <p className="text-sm text-[var(--muted-text)]">{formatDate(t.date)}</p>
                </Link>
                <p className="mt-2 flex items-center gap-1 text-base text-white">
                  <Users className="h-4 w-4 text-[var(--accent)]" aria-hidden="true" />
                  {players.length} iscritti{unpaid > 0 ? ` · ${unpaid} da pagare al campo` : ""}
                </p>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <Link href={`/tournaments/${t.id}`} className="btn btn-secondary min-h-[3.5rem]">Apri</Link>
                  <a href={`/api/tournaments/${t.id}/iscritti`} className="btn btn-secondary min-h-[3.5rem] gap-2">
                    <Download className="h-5 w-5" aria-hidden="true" /> Excel
                  </a>
                </div>
              </div>
            )
          })}
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="eyebrow text-[var(--accent)]">Pagina del club</h2>
          <ClubForm
            clubId={club.id}
            initial={{
              name: club.name,
              city: club.city,
              address: club.address ?? "",
              description: club.description ?? "",
              instagram: club.instagram ? `@${club.instagram}` : "",
              website: club.website ?? "",
              contactEmail: club.contactEmail ?? "",
              logoUrl: club.logoUrl,
            }}
          />
        </section>
      </div>
    </div>
  )
}
