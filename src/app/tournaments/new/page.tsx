export const dynamic = "force-dynamic"

import Link from "next/link"
import { ChevronRight, FilePlus2, Trophy } from "lucide-react"
import { listPlayers } from "@/actions/players"
import { PageHeader } from "@/components/layout/PageHeader"
import { CreateTournamentForm } from "@/components/tournament/CreateTournamentForm"
import { getCurrentPlayer, getCurrentSession } from "@/lib/getCurrentPlayer"
import { isAdminEmail } from "@/lib/isAdmin"
import { myManagedClubs } from "@/lib/clubAccess"
import { TOURNAMENT_TEMPLATES, type TournamentTemplateKey } from "@/lib/club"
import { db } from "@/lib/db"

interface Props { searchParams: Promise<{ club?: string; template?: string }> }

/** Tournaments are created by approved clubs (for themselves) and by SANDER admins. */
export default async function NewTournamentPage({ searchParams }: Props) {
  const { club: clubParam, template } = await searchParams
  const [player, session] = await Promise.all([getCurrentPlayer(), getCurrentSession()])
  const isAdmin = isAdminEmail(session?.user?.email)
  const clubs = player ? await myManagedClubs(player.id) : []
  // The club in the link, else the only one this player runs.
  const club = clubs.find((c) => c.id === clubParam) ?? (clubs.length === 1 && !isAdmin ? clubs[0] : null)

  if (!isAdmin && clubs.length === 0) {
    return (
      <div>
        <PageHeader title="Nuovo Torneo" backHref="/tournaments" />
        <div className="mx-4 flex flex-col gap-3 rounded-2xl bg-[var(--surface-2)] p-5">
          <Trophy className="h-7 w-7 text-[var(--compete)]" aria-hidden="true" />
          <p className="text-lg font-bold text-white">I tornei li organizzano i club</p>
          <p className="text-base text-[var(--muted-text)]">
            Sei una società, un circolo o un bagno? Iscrivi il club: una volta approvato crei i tuoi tornei, gestisci
            iscrizioni e quote, e i tuoi giocatori ti seguono.
          </p>
          <Link href="/club" className="btn btn-primary w-full">Iscrivi il tuo club</Link>
        </div>
      </div>
    )
  }

  if (!isAdmin && !club) {
    return (
      <div>
        <PageHeader title="Nuovo Torneo" subtitle="Per quale club?" backHref="/tournaments" />
        <div className="flex flex-col gap-2 px-4">
          {clubs.map((c) => (
            <Link key={c.id} href={`/tournaments/new?club=${c.id}`} className="btn btn-secondary w-full">{c.name}</Link>
          ))}
        </div>
      </div>
    )
  }

  // A club picks a ready-made tournament first (or starts from scratch).
  if (club && template === undefined) {
    return (
      <div>
        <PageHeader title="Nuovo Torneo" subtitle={`Torneo di ${club.name}`} backHref={`/c/${club.slug}/gestione`} />
        <div className="flex flex-col gap-2 px-4">
          <p className="eyebrow text-[var(--accent)]">Parti da un modello</p>
          {(Object.keys(TOURNAMENT_TEMPLATES) as TournamentTemplateKey[]).map((key) => (
            <Link
              key={key}
              href={`/tournaments/new?club=${club.id}&template=${key}`}
              className="flex min-h-[4.5rem] items-center gap-3 rounded-2xl bg-[var(--surface-2)] px-4 py-3"
            >
              <Trophy className="h-6 w-6 shrink-0 text-[var(--compete)]" aria-hidden="true" />
              <span className="min-w-0 flex-1">
                <span className="block text-base font-bold text-white">{TOURNAMENT_TEMPLATES[key].label}</span>
                <span className="block text-sm text-[var(--muted-text)]">{TOURNAMENT_TEMPLATES[key].hint}</span>
              </span>
              <ChevronRight className="h-5 w-5 text-[var(--muted-text)]" aria-hidden="true" />
            </Link>
          ))}
          <Link href={`/tournaments/new?club=${club.id}&template=`} className="btn btn-secondary mt-2 w-full gap-2">
            <FilePlus2 className="h-5 w-5" aria-hidden="true" /> Da zero
          </Link>
        </div>
      </div>
    )
  }

  const preset = template && template in TOURNAMENT_TEMPLATES ? TOURNAMENT_TEMPLATES[template as TournamentTemplateKey].values : null
  const venue = club ? await db.club.findUnique({ where: { id: club.id }, select: { address: true, city: true } }) : null
  const players = await listPlayers()
  return (
    <div>
      <PageHeader title="Nuovo Torneo" subtitle={club ? `Torneo di ${club.name}` : undefined} backHref={club ? `/c/${club.slug}/gestione` : "/tournaments"} />
      {club && (
        <p className="mx-4 mb-3 rounded-2xl bg-[var(--surface-2)] p-4 text-base text-[var(--muted-text)]">
          La quota si paga al campo (contanti o Satispay): dalla pagina del torneo segni chi ha pagato. I giocatori si
          iscrivono in coppia invitando il compagno con un link.
        </p>
      )}
      <CreateTournamentForm
        players={players}
        clubId={club?.id ?? null}
        initial={{
          ...(preset ? { ...preset } : {}),
          location: venue ? [venue.address, venue.city].filter(Boolean).join(", ") : undefined,
        }}
      />
    </div>
  )
}
