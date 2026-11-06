export const dynamic = "force-dynamic"

import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { BadgeCheck, Camera, ChevronRight, Clock, Crown, Globe, LayoutGrid, Mail, MapPin, Navigation, Settings, Trophy, Users } from "lucide-react"
import { db } from "@/lib/db"
import { getCurrentPlayer, getCurrentSession } from "@/lib/getCurrentPlayer"
import { canManageClub } from "@/lib/clubAccess"
import { TOURNAMENT_CARD_SELECT } from "@/lib/clubQueries"
import { CLUB_SERVICES, COURT_TYPES, mapsUrl } from "@/lib/club"
import { bagnoLabel, parseBagno } from "@/lib/bagni"
import { formatWhen } from "@/lib/datetime"
import { formatPrice } from "@/lib/utils"
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
      include: { _count: { select: { followers: true } }, circuits: { orderBy: { createdAt: "desc" }, select: { id: true, name: true } } },
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
  // Games players set up at this bagno: the club's beach is alive between tournaments too.
  const bagnoGames = club.bagno
    ? (await db.session.findMany({
        where: { location: { contains: String(club.bagno) }, status: { in: ["OPEN", "FULL"] }, date: { gte: new Date(Date.now() - 3 * 3600_000) } },
        orderBy: { date: "asc" },
        take: 20,
        select: { id: true, title: true, date: true, location: true, maxPlayers: true, _count: { select: { participants: true } } },
      })).filter((g) => parseBagno(g.location) === club.bagno).slice(0, 4)
    : []

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
          <p className="eyebrow flex items-center gap-1 text-[var(--tone)]">
            Club
            {club.status === "APPROVED" && (
              <span className="flex items-center gap-1 normal-case tracking-normal text-[var(--accent)]">
                · <BadgeCheck className="h-4 w-4" aria-hidden="true" /> verificato
              </span>
            )}
          </p>
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
                : "Club non attivo: non è visibile su SANDER. Per riaprirlo scrivici."}
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

        {club.photos.length > 0 && (
          <div className="-mx-4 flex snap-x gap-2 overflow-x-auto px-4 pb-1">
            {club.photos.map((url) => (
              <span key={url} className="relative h-40 w-60 shrink-0 snap-start overflow-hidden rounded-2xl bg-[var(--surface-2)]">
                <Image src={url} alt={`Campi di ${club.name}`} fill sizes="240px" className="object-cover" />
              </span>
            ))}
          </div>
        )}

        {(club.courts || club.openingHours || club.courtPriceCents != null || club.services.length > 0) && (
          <section className="flex flex-col gap-3 rounded-2xl bg-[var(--surface-2)] p-4">
            <h2 className="eyebrow text-[var(--tone)]">I campi</h2>
            {(club.courts || club.courtType) && (
              <p className="flex items-center gap-2 text-base text-white">
                <LayoutGrid className="h-5 w-5 shrink-0 text-[var(--tone)]" aria-hidden="true" />
                {[club.courts ? `${club.courts} ${club.courts === 1 ? "campo" : "campi"}` : null, club.courtType ? COURT_TYPES[club.courtType as keyof typeof COURT_TYPES] : null].filter(Boolean).join(" · ")}
                {club.courtPriceCents != null && ` · ${formatPrice(club.courtPriceCents)}/ora`}
              </p>
            )}
            {club.openingHours && (
              <p className="flex items-center gap-2 text-base text-white">
                <Clock className="h-5 w-5 shrink-0 text-[var(--tone)]" aria-hidden="true" /> {club.openingHours}
              </p>
            )}
            {club.services.length > 0 && (
              <ul className="flex flex-wrap gap-2">
                {CLUB_SERVICES.filter((sv) => club.services.includes(sv.key)).map((sv) => (
                  <li key={sv.key} className="rounded-full bg-[var(--surface-3)] px-3 py-1.5 text-sm font-bold text-white">{sv.label}</li>
                ))}
              </ul>
            )}
          </section>
        )}

        <div className="grid grid-cols-1 gap-2">
          <a href={mapsUrl(club.address, club.city)} target="_blank" rel="noopener noreferrer" className="btn btn-secondary w-full gap-2">
            <Navigation className="h-5 w-5" aria-hidden="true" /> Portami lì
          </a>
          {club.bagno && (
            <Link href="/bagni" className="btn btn-secondary w-full gap-2">
              <Crown className="h-5 w-5" aria-hidden="true" /> Re del {bagnoLabel(club.bagno)}
            </Link>
          )}
        </div>

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

        {bagnoGames.length > 0 && club.bagno && (
          <section className="flex flex-col gap-2">
            <h2 className="eyebrow text-[var(--tone)]">Partite al {bagnoLabel(club.bagno)}</h2>
            {bagnoGames.map((g) => (
              <Link key={g.id} href={`/sessions/${g.id}`} className="flex min-h-[3.5rem] items-center gap-3 rounded-2xl bg-[var(--surface-2)] px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-base font-bold text-white">{g.title}</p>
                  <p className="text-sm text-[var(--muted-text)]">{formatWhen(g.date)}</p>
                </div>
                <span className="flex shrink-0 items-center gap-1 text-sm text-white">
                  <Users className="h-4 w-4 text-[var(--tone)]" aria-hidden="true" /> {g._count.participants}/{g.maxPlayers}
                </span>
                <ChevronRight className="h-5 w-5 shrink-0 text-[var(--muted-text)]" aria-hidden="true" />
              </Link>
            ))}
          </section>
        )}

        {club.circuits.length > 0 && (
          <section className="flex flex-col gap-2">
            <h2 className="eyebrow text-[var(--tone)]">Circuiti</h2>
            {club.circuits.map((c) => (
              <Link key={c.id} href={`/c/${club.slug}/circuiti/${c.id}`} className="flex min-h-[3.5rem] items-center justify-between rounded-2xl bg-[var(--surface-2)] px-4">
                <span className="text-base font-bold text-white">{c.name}</span>
                <span className="text-sm text-[var(--tone)]">Classifica generale</span>
              </Link>
            ))}
          </section>
        )}

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
