export const dynamic = "force-dynamic"

import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Camera, Globe, Mail, MapPin, Settings, Trophy } from "lucide-react"
import { db } from "@/lib/db"
import { getCurrentPlayer, getCurrentSession } from "@/lib/getCurrentPlayer"
import { canManageClub } from "@/lib/clubAccess"
import { TOURNAMENT_CARD_SELECT } from "@/lib/clubQueries"
import { BackButton } from "@/components/layout/PageHeader"
import { TournamentCard } from "@/components/tournament/TournamentCard"
import { FollowClubButton } from "@/components/club/FollowClubButton"
import { ShareButton } from "@/components/ui/ShareButton"

interface Props { params: Promise<{ slug: string }> }

/** A tournament stays "upcoming" until a day after its date. */
const upcomingSince = () => new Date(Date.now() - 86_400_000)

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const club = await db.club.findFirst({ where: { slug, status: "APPROVED" }, select: { name: true, city: true } })
  if (!club) return { title: "Club — SANDER" }
  return {
    title: `${club.name} — tornei di beach volley | SANDER`,
    description: `I tornei di ${club.name} a ${club.city}: iscrizioni in coppia, gironi e risultati in diretta su SANDER.`,
  }
}

export default async function ClubPage({ params }: Props) {
  const { slug } = await params
  const [club, session, me] = await Promise.all([
    db.club.findUnique({
      where: { slug },
      include: { _count: { select: { followers: true } } },
    }),
    getCurrentSession(),
    getCurrentPlayer(),
  ])
  if (!club) notFound()
  const manager = await canManageClub(session?.user?.email, me?.id ?? null, club.id)
  // Not approved yet: only its own people (and admins) see it, to know where it stands.
  const owner = me ? await db.clubMember.findFirst({ where: { clubId: club.id, playerId: me.id }, select: { id: true } }) : null
  if (club.status !== "APPROVED" && !manager && !owner) notFound()

  const dayAgo = upcomingSince()
  const [upcoming, past, following] = await Promise.all([
    db.tournament.findMany({
      where: { clubId: club.id, status: { not: "COMPLETED" }, date: { gte: dayAgo } },
      orderBy: { date: "asc" },
      select: TOURNAMENT_CARD_SELECT,
    }),
    db.tournament.findMany({
      where: { clubId: club.id, OR: [{ status: "COMPLETED" }, { date: { lt: dayAgo } }] },
      orderBy: { date: "desc" },
      take: 10,
      select: TOURNAMENT_CARD_SELECT,
    }),
    me ? db.clubFollow.findUnique({ where: { clubId_playerId: { clubId: club.id, playerId: me.id } }, select: { id: true } }) : null,
  ])

  return (
    <div className="tone-compete pb-10">
      <div className="flex items-center justify-between px-4" style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 1rem)" }}>
        <BackButton href="/tournaments" />
        <div className="flex items-center gap-2">
          {manager && (
            <Link href={`/c/${club.slug}/gestione`} aria-label="Gestisci il club" className="flex h-14 w-14 items-center justify-center">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--surface-3)] text-white ring-1 ring-white/15">
                <Settings className="h-5 w-5" aria-hidden="true" />
              </span>
            </Link>
          )}
          <ShareButton path={`/c/${club.slug}`} title={club.name} text={`I tornei di ${club.name} su SANDER 🏐`} />
        </div>
      </div>

      <header className="flex items-center gap-4 px-4 pt-2 pb-4">
        <span className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-[var(--surface-2)] ring-1 ring-[var(--border)]">
          {club.logoUrl ? (
            <Image src={club.logoUrl} alt="" fill sizes="80px" className="object-cover" />
          ) : (
            <Trophy className="h-8 w-8 text-[var(--tone)]" aria-hidden="true" />
          )}
        </span>
        <div className="min-w-0">
          <p className="eyebrow text-[var(--tone)]">Club</p>
          <h1 className="font-hand text-[2.3rem] leading-[0.95] text-white">{club.name}</h1>
          <p className="mt-1 flex items-center gap-1 text-base text-[var(--muted-text)]">
            <MapPin className="h-4 w-4 shrink-0" aria-hidden="true" /> {club.address ? `${club.address}, ${club.city}` : club.city}
          </p>
        </div>
      </header>

      <div className="flex flex-col gap-4 px-4">
        {club.status !== "APPROVED" && (
          <p className="rounded-2xl bg-[var(--surface-2)] p-4 text-base text-white">
            {club.status === "PENDING"
              ? "Richiesta inviata: stiamo controllando il club. Ti avvisiamo appena è approvato, poi potrai creare i tornei."
              : club.status === "REJECTED"
                ? "Richiesta non approvata. Scrivici se pensi sia un errore."
                : "Club sospeso: per ora non è visibile. Scrivici per chiarire."}
          </p>
        )}

        {club.status === "APPROVED" && (
          <div className="flex flex-col gap-2">
            <FollowClubButton clubId={club.id} following={!!following} signedIn={!!me} slug={club.slug} />
            <p className="text-center text-sm text-[var(--muted-text)]">
              {club._count.followers === 1 ? "1 giocatore segue il club" : `${club._count.followers} giocatori seguono il club`}
            </p>
          </div>
        )}

        {club.description && <p className="whitespace-pre-line text-base text-white/85">{club.description}</p>}

        {(club.instagram || club.website || club.contactEmail) && (
          <div className="flex flex-wrap gap-2">
            {club.instagram && (
              <a href={`https://www.instagram.com/${club.instagram}/`} target="_blank" rel="noopener noreferrer" className="btn btn-secondary gap-2 px-4">
                <Camera className="h-5 w-5" aria-hidden="true" /> @{club.instagram}
              </a>
            )}
            {club.website && (
              <a href={club.website} target="_blank" rel="noopener noreferrer" className="btn btn-secondary gap-2 px-4">
                <Globe className="h-5 w-5" aria-hidden="true" /> Sito
              </a>
            )}
            {club.contactEmail && (
              <a href={`mailto:${club.contactEmail}`} className="btn btn-secondary gap-2 px-4">
                <Mail className="h-5 w-5" aria-hidden="true" /> Email
              </a>
            )}
          </div>
        )}

        <section className="flex flex-col gap-3">
          <h2 className="eyebrow text-[var(--tone)]">Prossimi tornei</h2>
          {upcoming.length === 0 ? (
            <p className="rounded-2xl bg-[var(--surface-2)] p-4 text-base text-[var(--muted-text)]">
              Nessun torneo in programma. {club.status === "APPROVED" ? "Segui il club: ti avvisiamo appena esce il prossimo." : ""}
            </p>
          ) : (
            upcoming.map((t) => <TournamentCard key={t.id} tournament={t} />)
          )}
        </section>

        {past.length > 0 && (
          <section className="flex flex-col gap-3">
            <h2 className="eyebrow text-[var(--muted-text)]">Tornei passati</h2>
            {past.map((t) => <TournamentCard key={t.id} tournament={t} />)}
          </section>
        )}
      </div>
    </div>
  )
}
