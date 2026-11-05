export const dynamic = "force-dynamic"

import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { CalendarCheck, ChevronRight, ListChecks, Megaphone, Trophy } from "lucide-react"
import { db } from "@/lib/db"
import { getCurrentPlayer } from "@/lib/getCurrentPlayer"
import { PageHeader } from "@/components/layout/PageHeader"
import { ClubForm } from "@/components/club/ClubForm"

export const metadata: Metadata = {
  title: "Club — organizza i tuoi tornei su SANDER",
  description: "Società, circoli e bagni: iscrizioni in coppia, gironi automatici e risultati in diretta. Gratis.",
}

const PERKS = [
  { icon: ListChecks, title: "Iscrizioni in coppia", text: "Un link al posto del modulo Google: il giocatore invita il compagno e la coppia è dentro." },
  { icon: CalendarCheck, title: "Gironi e risultati da soli", text: "Partite, campi e classifica si creano in automatico. Punteggi in diretta dal telefono." },
  { icon: Megaphone, title: "I tuoi giocatori ti seguono", text: "Chi segue il club riceve la notifica quando esce un torneo." },
  { icon: Trophy, title: "Gratis", text: "Le quote le incassate voi al campo, contanti o Satispay. Segnate chi ha pagato con un tocco." },
]

export default async function ClubLandingPage() {
  const me = await getCurrentPlayer()
  const [clubs, mine] = await Promise.all([
    db.club.findMany({ where: { status: "APPROVED" }, orderBy: { name: "asc" }, select: { slug: true, name: true, city: true, logoUrl: true } }),
    me ? db.club.findMany({ where: { members: { some: { playerId: me.id } } }, select: { slug: true, name: true, status: true } }) : [],
  ])

  return (
    <div className="pb-10">
      <PageHeader eyebrow="Per società e circoli" tone="compete" title="Porta il tuo club su SANDER" backHref="/tournaments" />
      <div className="flex flex-col gap-5 px-4">
        <ul className="flex flex-col gap-2">
          {PERKS.map(({ icon: Icon, title, text }) => (
            <li key={title} className="flex gap-3 rounded-2xl bg-[var(--surface-2)] p-4">
              <Icon className="mt-0.5 h-5 w-5 shrink-0 text-[var(--accent)]" aria-hidden="true" />
              <span>
                <span className="block text-base font-bold text-white">{title}</span>
                <span className="block text-base text-[var(--muted-text)]">{text}</span>
              </span>
            </li>
          ))}
        </ul>

        {mine.length > 0 && (
          <section className="flex flex-col gap-2">
            <h2 className="eyebrow text-[var(--accent)]">I tuoi club</h2>
            {mine.map((c) => (
              <Link key={c.slug} href={`/c/${c.slug}`} className="flex min-h-[3.5rem] items-center justify-between rounded-2xl bg-[var(--surface-2)] px-4">
                <span className="text-base font-bold text-white">{c.name}</span>
                <span className="flex items-center gap-1 text-sm text-[var(--muted-text)]">
                  {c.status === "APPROVED" ? "Attivo" : c.status === "PENDING" ? "In attesa" : "Non attivo"}
                  <ChevronRight className="h-4 w-4" aria-hidden="true" />
                </span>
              </Link>
            ))}
          </section>
        )}

        <section className="flex flex-col gap-3">
          <h2 className="eyebrow text-[var(--accent)]">Iscrivi la tua società</h2>
          {me ? (
            <ClubForm />
          ) : (
            <Link href="/auth/signin?callbackUrl=/club" className="btn btn-primary w-full">Accedi per iscrivere il club</Link>
          )}
        </section>

        {clubs.length > 0 && (
          <section className="flex flex-col gap-2">
            <h2 className="eyebrow text-[var(--muted-text)]">Club su SANDER</h2>
            {clubs.map((c) => (
              <Link key={c.slug} href={`/c/${c.slug}`} className="flex min-h-[3.5rem] items-center gap-3 rounded-2xl bg-[var(--surface-2)] px-4 py-2">
                <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl bg-[var(--surface-3)]">
                  {c.logoUrl && <Image src={c.logoUrl} alt="" fill sizes="40px" className="object-cover" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-base font-bold text-white">{c.name}</span>
                  <span className="block text-sm text-[var(--muted-text)]">{c.city}</span>
                </span>
                <ChevronRight className="h-5 w-5 text-[var(--muted-text)]" aria-hidden="true" />
              </Link>
            ))}
          </section>
        )}
      </div>
    </div>
  )
}
