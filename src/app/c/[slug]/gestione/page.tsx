export const dynamic = "force-dynamic"

import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { CheckCircle2, Circle, ClipboardCheck, ExternalLink, Download, Image as ImageIcon, Plus, QrCode, Users } from "lucide-react"
import { db } from "@/lib/db"
import { getCurrentPlayer, getCurrentSession } from "@/lib/getCurrentPlayer"
import { canManageClub, isClubOwner } from "@/lib/clubAccess"
import { holdsSeat } from "@/lib/tournament/capacity"
import { formatDate } from "@/lib/utils"
import { PageHeader } from "@/components/layout/PageHeader"
import { ClubForm } from "@/components/club/ClubForm"
import { CircuitCreateForm } from "@/components/club/CircuitCreateForm"
import { TournamentCircuitSelect } from "@/components/club/TournamentCircuitSelect"
import { CopyLinkButton } from "@/components/club/CopyLinkButton"
import { bioLinksOf, clubChecklist } from "@/lib/club"
import { StaffInviteButton } from "@/components/club/StaffInviteButton"
import { RemoveStaffButton } from "@/components/club/RemoveStaffButton"
import { MakeOwnerButton } from "@/components/club/MakeOwnerButton"
import { CloseClubButton } from "@/components/club/CloseClubButton"
import { ClubMessageForm } from "@/components/club/ClubMessageForm"

interface Props { params: Promise<{ slug: string }> }

/** The club's back office: its tournaments with sign-ups and payments, and the page details. */
export default async function ClubManagePage({ params }: Props) {
  const { slug } = await params
  const [session, me] = await Promise.all([getCurrentSession(), getCurrentPlayer()])
  if (!me) redirect(`/auth/signin?callbackUrl=/c/${slug}/gestione`)
  const club = await db.club.findUnique({ where: { slug } })
  if (!club) notFound()
  if (!(await canManageClub(session?.user?.email, me.id, club.id))) redirect(`/c/${slug}`)

  const [tournaments, circuits, staff, messages, followers, owner] = await Promise.all([
    db.tournament.findMany({
      where: { clubId: club.id },
      orderBy: { date: "desc" },
      take: 30,
      select: {
        id: true, name: true, date: true, status: true, priceCents: true, maxTeams: true, type: true, circuitId: true,
        registrations: { select: { paymentStatus: true, isSpectator: true, checkedInAt: true, paymentClaimedAt: true } },
        _count: { select: { waitlist: true } },
      },
    }),
    db.clubCircuit.findMany({ where: { clubId: club.id }, orderBy: { createdAt: "desc" }, select: { id: true, name: true, _count: { select: { tournaments: true } } } }),
    db.clubMember.findMany({ where: { clubId: club.id }, orderBy: [{ role: "asc" }, { createdAt: "asc" }], select: { role: true, player: { select: { id: true, name: true } } } }),
    db.clubMessage.findMany({ where: { clubId: club.id }, orderBy: { createdAt: "desc" }, take: 5, select: { id: true, createdAt: true, body: true, sentTo: true, tournament: { select: { name: true } } } }),
    db.clubFollow.count({ where: { clubId: club.id } }),
    isClubOwner(session?.user?.email, me.id, club.id),
  ])
  const upcoming = tournaments.filter((t) => t.status !== "COMPLETED")
  const audiences = [
    { tournamentId: null, label: `Follower del club (${followers})` },
    ...upcoming.map((t) => ({ tournamentId: t.id, label: `Iscritti a ${t.name} (${t.registrations.filter(holdsSeat).length})` })),
  ]
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
          <CopyLinkButton path={`/c/${club.slug}/link?ref=bio`} label="Copia il link per la bio di Instagram" />
          <Link href={`/c/${club.slug}/link`} className="btn btn-secondary w-full gap-2">
            <ExternalLink className="h-5 w-5" aria-hidden="true" /> Guarda la pagina link in bio
          </Link>
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
            const claimed = (t.priceCents ?? 0) > 0 ? players.filter((r) => r.paymentStatus === "PENDING" && r.paymentClaimedAt).length : 0
            return (
              <div key={t.id} className="rounded-2xl bg-[var(--surface-2)] p-4">
                <Link href={`/tournaments/${t.id}`} className="block">
                  <p className="text-base font-bold text-white">{t.name}</p>
                  <p className="text-sm text-[var(--muted-text)]">{formatDate(t.date)}</p>
                </Link>
                <p className="mt-2 flex items-center gap-1 text-base text-white">
                  <Users className="h-4 w-4 text-[var(--accent)]" aria-hidden="true" />
                  {players.length} iscritti{unpaid > 0 ? ` · ${unpaid} da pagare` : ""}{claimed > 0 ? ` (${claimed} da confermare)` : ""}
                  {t._count.waitlist > 0 ? ` · ${t._count.waitlist} in attesa` : ""}
                </p>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <Link href={`/tournaments/${t.id}`} className="btn btn-secondary min-h-[3.5rem]">Apri</Link>
                  <Link href={`/tournaments/${t.id}/checkin`} className="btn btn-secondary min-h-[3.5rem] gap-1 px-2">
                    <ClipboardCheck className="h-5 w-5" aria-hidden="true" /> Check-in
                  </Link>
                  <a href={`/tournaments/${t.id}/locandina`} download className="btn btn-secondary min-h-[3.5rem] gap-1 px-2" aria-label="Scarica la locandina per la storia Instagram">
                    <ImageIcon className="h-5 w-5" aria-hidden="true" /> Storia
                  </a>
                  <a href={`/tournaments/${t.id}/locandina?formato=post`} download className="btn btn-secondary min-h-[3.5rem] gap-1 px-2" aria-label="Scarica la locandina per un post Instagram">
                    <ImageIcon className="h-5 w-5" aria-hidden="true" /> Post
                  </a>
                  <a href={`/api/tournaments/${t.id}/iscritti`} className="btn btn-secondary col-span-2 min-h-[3.5rem] gap-1 px-2">
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
          <h2 className="eyebrow text-[var(--accent)]">Scrivi ai giocatori</h2>
          <p className="text-base text-[var(--muted-text)]">Arriva come notifica sul telefono. Al massimo 3 al giorno.</p>
          <ClubMessageForm clubId={club.id} audiences={audiences} />
          {messages.length > 0 && (
            <ul className="mt-1 flex flex-col gap-2">
              {messages.map((m) => (
                <li key={m.id} className="rounded-2xl bg-[var(--surface-2)] p-3">
                  <p className="text-base text-white">{m.body}</p>
                  <p className="mt-1 text-sm text-[var(--muted-text)]">
                    {formatDate(m.createdAt)} · {m.tournament ? `iscritti a ${m.tournament.name}` : "follower"} · {m.sentTo} {m.sentTo === 1 ? "giocatore" : "giocatori"}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="eyebrow text-[var(--accent)]">Staff</h2>
          <ul className="flex flex-col gap-2">
            {staff.map((m) => (
              <li key={m.player.id} className="flex min-h-[3.5rem] items-center justify-between gap-2 rounded-2xl bg-[var(--surface-2)] pl-4">
                <span className="text-base font-bold text-white">{m.player.name}</span>
                <span className="flex items-center gap-1">
                  <span className="text-sm text-[var(--muted-text)]">{m.role === "OWNER" ? "Proprietario" : "Staff"}</span>
                  {owner && m.role === "STAFF" ? (
                    <>
                      <MakeOwnerButton clubId={club.id} playerId={m.player.id} name={m.player.name} />
                      <RemoveStaffButton clubId={club.id} playerId={m.player.id} name={m.player.name} />
                    </>
                  ) : <span className="w-4" />}
                </span>
              </li>
            ))}
          </ul>
          {owner && <StaffInviteButton clubId={club.id} clubSlug={club.slug} clubName={club.name} />}
          {owner && staff.some((m) => m.role === "STAFF") && (
            <p className="text-sm text-[var(--muted-text)]">Con la corona passi il club a una persona dello staff.</p>
          )}
        </section>

        <details className="rounded-2xl bg-[var(--surface-2)] p-4">
          <summary className="flex min-h-[2.5rem] cursor-pointer items-center text-base font-bold text-white">Come funziona il giorno del torneo</summary>
          <ol className="mt-2 flex list-decimal flex-col gap-2 pl-5 text-base text-[var(--muted-text)]">
            <li>Il giorno prima gli iscritti ricevono un promemoria, con la quota da portare.</li>
            <li>All&apos;arrivo apri <b className="text-white">Check-in</b>: segni chi è arrivato e chi ha pagato, oppure inquadri il QR del giocatore con la fotocamera.</li>
            <li>Se qualcuno si ritira, il primo in lista d&apos;attesa entra da solo e riceve una notifica.</li>
            <li>Dalla pagina del torneo formi le coppie, lo avvii e segni i punteggi. A fine torneo lo concludi: classifica e circuito si aggiornano.</li>
          </ol>
        </details>

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
              whatsapp: club.whatsapp ?? "",
              bioLinks: bioLinksOf(club.bioLinks),
              paymentLink: club.paymentLink ?? "",
            }}
          />
        </section>

        {owner && (
          <section className="flex flex-col gap-2 pt-4">
            <h2 className="eyebrow text-[var(--muted-text)]">Chiudere il club</h2>
            <p className="text-base text-[var(--muted-text)]">Il club sparisce da SANDER; tornei passati e classifiche restano. Servono zero tornei in programma.</p>
            <CloseClubButton clubId={club.id} name={club.name} />
          </section>
        )}
      </div>
    </div>
  )
}
