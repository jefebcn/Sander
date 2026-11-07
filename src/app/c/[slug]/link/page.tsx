export const dynamic = "force-dynamic"

import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { BadgeCheck, Camera, ChevronRight, Globe, Link2, Mail, MessageCircle, Navigation, Trophy } from "lucide-react"
import { db } from "@/lib/db"
import { bioLinksOf, mapsUrl, whatsappUrl } from "@/lib/club"
import { formatDayShort } from "@/lib/datetime"

interface Props { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const club = await db.club.findFirst({ where: { slug, status: "APPROVED" }, select: { name: true, city: true } })
  return club ? { title: `${club.name} — link | SANDER`, description: `Tornei, contatti e link di ${club.name} (${club.city}).` } : { title: "Club — SANDER" }
}

const ROW = "flex min-h-[3.75rem] w-full items-center gap-3 rounded-2xl bg-[var(--surface-2)] px-4 text-base font-bold text-white ring-1 ring-white/10 active:scale-[0.99]"

/**
 * The club's link-in-bio page, in place of Linktree: next tournaments first
 * (they update themselves), then WhatsApp, the club's own links and socials.
 */
export default async function ClubLinkPage({ params }: Props) {
  const { slug } = await params
  const club = await db.club.findFirst({
    where: { slug, status: "APPROVED" },
    select: {
      id: true, slug: true, name: true, city: true, address: true, logoUrl: true, instagram: true, website: true, contactEmail: true,
      whatsapp: true, bioLinks: true,
      circuits: { orderBy: { createdAt: "desc" }, take: 1, select: { id: true, name: true } },
      tournaments: {
        where: { status: "DRAFT", isOpenForRegistration: true, date: { gte: new Date(Date.now() - 86_400_000) } },
        orderBy: { date: "asc" },
        take: 3,
        select: { id: true, name: true, date: true },
      },
    },
  })
  if (!club) notFound()
  const wa = whatsappUrl(club.whatsapp)
  const links = bioLinksOf(club.bioLinks)

  return (
    <div className="tone-compete mx-auto flex max-w-md flex-col gap-3 px-4 pb-10" style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 2rem)" }}>
      <header className="flex flex-col items-center gap-2 pb-2 text-center">
        <span className="relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-3xl bg-[var(--surface-2)] ring-1 ring-[var(--border)]">
          {club.logoUrl ? <Image src={club.logoUrl} alt="" fill sizes="96px" className="object-cover" /> : <Trophy className="h-10 w-10 text-[var(--tone)]" aria-hidden="true" />}
        </span>
        <h1 className="font-hand text-[2.3rem] leading-[0.95] text-white">{club.name}</h1>
        <p className="flex items-center gap-1 text-base text-[var(--muted-text)]">
          {club.city} · <BadgeCheck className="h-4 w-4 text-[var(--accent)]" aria-hidden="true" /> club verificato
        </p>
      </header>

      {club.tournaments.map((t) => (
        <Link key={t.id} href={`/tournaments/${t.id}?ref=bio`} className={`${ROW} bg-[var(--accent)] text-black ring-0`}>
          <Trophy className="h-5 w-5 shrink-0" aria-hidden="true" />
          <span className="min-w-0 flex-1 truncate">Iscriviti: {t.name}</span>
          <span className="shrink-0 text-sm">{formatDayShort(t.date)}</span>
        </Link>
      ))}
      {club.circuits[0] && (
        <Link href={`/c/${club.slug}/circuiti/${club.circuits[0].id}?ref=bio`} className={ROW}>
          <Trophy className="h-5 w-5 shrink-0 text-[var(--tone)]" aria-hidden="true" />
          <span className="min-w-0 flex-1 truncate">Classifica {club.circuits[0].name}</span>
          <ChevronRight className="h-5 w-5 shrink-0 text-[var(--muted-text)]" aria-hidden="true" />
        </Link>
      )}
      {wa && (
        <a href={wa} target="_blank" rel="noopener noreferrer" className={ROW}>
          <MessageCircle className="h-5 w-5 shrink-0 text-[var(--tone)]" aria-hidden="true" /> Scrivici su WhatsApp
        </a>
      )}
      {links.map((l) => (
        <a key={l.url + l.label} href={l.url} target="_blank" rel="noopener noreferrer" className={ROW}>
          <Link2 className="h-5 w-5 shrink-0 text-[var(--tone)]" aria-hidden="true" /> <span className="min-w-0 truncate">{l.label}</span>
        </a>
      ))}
      {club.instagram && (
        <a href={`https://www.instagram.com/${club.instagram}/`} target="_blank" rel="noopener noreferrer" className={ROW}>
          <Camera className="h-5 w-5 shrink-0 text-[var(--tone)]" aria-hidden="true" /> @{club.instagram}
        </a>
      )}
      {club.website && (
        <a href={club.website} target="_blank" rel="noopener noreferrer" className={ROW}>
          <Globe className="h-5 w-5 shrink-0 text-[var(--tone)]" aria-hidden="true" /> Sito
        </a>
      )}
      {club.contactEmail && (
        <a href={`mailto:${club.contactEmail}`} className={ROW}>
          <Mail className="h-5 w-5 shrink-0 text-[var(--tone)]" aria-hidden="true" /> Email
        </a>
      )}
      <a href={mapsUrl(club.address, club.city)} target="_blank" rel="noopener noreferrer" className={ROW}>
        <Navigation className="h-5 w-5 shrink-0 text-[var(--tone)]" aria-hidden="true" /> Come arrivare
      </a>
      <Link href={`/c/${club.slug}?ref=bio`} className={ROW}>
        <Trophy className="h-5 w-5 shrink-0 text-[var(--tone)]" aria-hidden="true" />
        <span className="flex-1">Tutto il club su SANDER</span>
        <ChevronRight className="h-5 w-5 shrink-0 text-[var(--muted-text)]" aria-hidden="true" />
      </Link>
      <p className="pt-4 text-center text-sm text-[var(--muted-text)]">
        Tornei e classifiche su <Link href="/?ref=bio" className="font-bold text-white">SANDER</Link>
      </p>
    </div>
  )
}
