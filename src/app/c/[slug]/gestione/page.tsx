export const dynamic = "force-dynamic"

import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { CheckCircle2, Circle, Download, Image as ImageIcon, Plus, QrCode, Users } from "lucide-react"
import { db } from "@/lib/db"
import { getCurrentPlayer, getCurrentSession } from "@/lib/getCurrentPlayer"
import { canManageClub } from "@/lib/clubAccess"
import { holdsSeat } from "@/lib/tournament/capacity"
import { formatDate } from "@/lib/utils"
import { PageHeader } from "@/components/layout/PageHeader"
import { ClubForm } from "@/components/club/ClubForm"
import { CircuitCreateForm } from "@/components/club/CircuitCreateForm"
import { TournamentCircuitSelect } from "@/components/club/TournamentCircuitSelect"
import { CopyLinkButton } from "@/components/club/CopyLinkButton"
import { clubChecklist } from "@/lib/club"

interface Props { params: Promise<{ slug: string }> }

/** The club's back office: its tournaments with sign-ups and payments, and the page details. */
export default async function ClubManagePage({ params }: Props) {
  const { slug } = await params
  const [session, me] = await Promise.all([getCurrentSession(), getCurrentPlayer()])
  if (!me) redirect(`/auth/signin?callbackUrl=/c/${slug}/gestione`)
  const club = await db.club.findUnique({ where: { slug } })
  if (!club) notFound()
  if (!(await canManageClub(session?.user?.email, me.id, club.id))) redirect(`/c/${slug}`)

  const [tournaments, circuits] = await Promise.all([
    db.tournament.findMany({
      where: { clubId: club.id },
      orderBy: { date: "desc" },
      take: 30,
      select: {
        id: true, name: true, date: true, status: true, priceCents: true, maxTeams: true, type: true, circuitId: true,
        registrations: { select: { paymentStatus: true, isSpectator: true } },
      },
    }),
    db.clubCircuit.findMany({ where: { clubId: club.id }, orderBy: { createdAt: "desc" }, select: { id: true, name: true, _count: { select: { tournaments: true } } } }),
  ])
  const steps = clubChecklist({ ...club, tournaments: tournaments.length })
  const done = steps.filter((s) => s.done).length

  return (
    <div className="pb-10">
      <PageHeader eyebrow="Gestione club" tone="compete" title={club.name} backHref={`/c/${slug}`} />
      <div className="flex flex-col gap-5 px-4">
        {done < steps.length && (
          <section className="flex flex-col gap-2 rounded-2xl bg-[var(--surface-2)] p-4">
            <div className="flex items-center justify-between">
              <h2 className="eyebrow text-[var(--accent)]">Primi passi</h2>
              <span className="text-base font-bold text-white">{done}/{steps.length}</span>
            </div>
            <ul className="flex flex-col gap-2">
              {steps.map((st) => (
                <li key={st.key} className="flex items-center gap-2 text-base">
                  {st.done ? (
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-[var(--live)]" aria-hidden="true" />
                  ) : (
                    <Circle className="h-5 w-5 shrink-0 text-[var(--muted-text)]" aria-hidden="true" />
                  )}
                  <span className={st.done ? "text-[var(--muted-text)] line-through" : "text-white"}>{st.label}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <Link href={`/tournaments/new?club=${club.id}`} className="btn btn-primary w-full gap-2">
          <Plus className="h-5 w-5" aria-hidden="true" /> Nuovo torneo del club
        </Link>

        <section className="flex flex-col gap-2">
          <h2 className="eyebrow text-[var(--accent)]">Promuovi il club</h2>
          <CopyLinkButton path={`/c/${club.slug}?ref=bio`} label="Copia il link per la bio di Instagram" />
          <a href={`/c/${club.slug}/qr`} download className="btn btn-secondary w-full gap-2">
            <QrCode className="h-5 w-5" aria-hidden="true" /> QR da stampare al campo
          </a>
        </section>

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
                <div className="mt-3 grid grid-cols-3 gap-2">
                  <Link href={`/tournaments/${t.id}`} className="btn btn-secondary min-h-[3.5rem]">Apri</Link>
                  <a href={`/tournaments/${t.id}/locandina`} download className="btn btn-secondary min-h-[3.5rem] gap-1 px-2" aria-label="Scarica la locandina per Instagram">
                    <ImageIcon className="h-5 w-5" aria-hidden="true" /> Storia
                  </a>
                  <a href={`/api/tournaments/${t.id}/iscritti`} className="btn btn-secondary min-h-[3.5rem] gap-1 px-2">
                    <Download className="h-5 w-5" aria-hidden="true" /> Excel
                  </a>
                </div>
                {circuits.length > 0 && (
                  <div className="mt-3">
                    <TournamentCircuitSelect tournamentId={t.id} circuitId={t.circuitId} circuits={circuits} />
                  </div>
                )}
              </div>
            )
          })}
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="eyebrow text-[var(--accent)]">Circuiti</h2>
          <p className="text-base text-[var(--muted-text)]">
            Più tornei nella stessa stagione con una classifica generale: 100 punti al primo, 80 al secondo, 65 al terzo… e 10 a chi partecipa.
          </p>
          {circuits.map((c) => (
            <Link key={c.id} href={`/c/${club.slug}/circuiti/${c.id}`} className="flex min-h-[3.5rem] items-center justify-between rounded-2xl bg-[var(--surface-2)] px-4">
              <span className="text-base font-bold text-white">{c.name}</span>
              <span className="text-sm text-[var(--muted-text)]">{c._count.tournaments === 1 ? "1 tappa" : `${c._count.tournaments} tappe`}</span>
            </Link>
          ))}
          <CircuitCreateForm clubId={club.id} />
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
              courts: club.courts?.toString() ?? "",
              courtType: (club.courtType as "OUTDOOR" | "INDOOR" | "BOTH" | null) ?? "",
              openingHours: club.openingHours ?? "",
              courtPriceEuros: club.courtPriceCents != null ? String(club.courtPriceCents / 100).replace(".", ",") : "",
              services: club.services,
              photos: club.photos,
              bagno: club.bagno?.toString() ?? "",
            }}
          />
        </section>
      </div>
    </div>
  )
}
