import Link from "next/link"
import { CalendarDays, ClipboardCheck, ExternalLink, Eye, Image as ImageIcon, Megaphone, PlusCircle, QrCode, Settings2, Trophy, UserCog, Users } from "lucide-react"
import { db } from "@/lib/db"
import { clubDashboard, isUpcoming } from "@/lib/clubDashboard"
import { clubChecklist } from "@/lib/club"
import { holdsSeat } from "@/lib/tournament/capacity"
import { euro } from "@/lib/shop"
import { formatDate } from "@/lib/utils"
import { StatusBadge } from "@/components/tournament/StatusBadge"
import { Eyebrow, ListGroup, ListRow, Segments } from "./ProfileUI"

export type ClubTab = "plancia" | "tornei" | "gestione"
export const CLUB_TABS: ClubTab[] = ["plancia", "tornei", "gestione"]

const MONTHS = ["gen", "feb", "mar", "apr", "mag", "giu", "lug", "ago", "set", "ott", "nov", "dic"]

function Kpi({ label, value, hint, tone }: { label: string; value: string; hint: string; tone?: "warn" }) {
  return (
    <div className="flex flex-col gap-1 rounded-[1.25rem] bg-[var(--surface-2)] px-4 py-3">
      <span className="text-xs font-extrabold uppercase tracking-[0.12em] text-[var(--muted-text)]">{label}</span>
      <span className={tone === "warn" ? "font-display text-3xl font-extrabold leading-none text-[var(--compete)]" : "font-display text-3xl font-extrabold leading-none text-white"}>{value}</span>
      <span className={tone === "warn" ? "text-sm font-bold text-[var(--compete)]" : "text-sm font-bold text-[var(--accent)]"}>{hint}</span>
    </div>
  )
}

/** The profile in club mode: the club's dashboard instead of the staff member's card. */
export async function ClubProfile({ clubId, tab, header }: { clubId: string; tab: ClubTab; header: React.ReactNode }) {
  const now = new Date()
  const [club, tournaments, followers] = await Promise.all([
    db.club.findUniqueOrThrow({ where: { id: clubId } }),
    db.tournament.findMany({
      where: { clubId },
      orderBy: { date: "desc" },
      take: 100,
      select: {
        id: true, name: true, date: true, status: true, type: true, priceCents: true, maxTeams: true,
        registrations: { select: { createdAt: true, paymentStatus: true, isSpectator: true, checkedInAt: true } },
        _count: { select: { waitlist: true } },
      },
    }),
    db.clubFollow.count({ where: { clubId } }),
  ])
  const dash = clubDashboard(tournaments.map((t) => ({ ...t, waitlist: t._count.waitlist })), now)
  const steps = clubChecklist({ ...club, tournaments: tournaments.length })
  const stepsLeft = steps.filter((s) => !s.done).length
  const newTournament = `/tournaments/new?club=${club.id}`
  const manage = `/c/${club.slug}/gestione`
  const maxWeek = Math.max(1, ...dash.weekly)

  return (
    <div className="flex flex-col gap-3 px-4 pb-6">
      {header}
      <Segments
        active={tab}
        items={[
          { id: "plancia", label: "Plancia", href: "/profile" },
          { id: "tornei", label: "Tornei", href: "/profile?tab=tornei" },
          { id: "gestione", label: "Gestione", href: "/profile?tab=gestione" },
        ]}
      />

      {tab === "plancia" && (
        <>
          {stepsLeft > 0 && (
            <Link href={manage} className="flex min-h-[3.5rem] items-center justify-between gap-3 rounded-[1.25rem] bg-[var(--accent-soft)] px-4 py-3 ring-1 ring-[var(--accent-line)]">
              <span className="text-base font-bold text-white">Completa la pagina del club</span>
              <span className="text-base font-extrabold text-[var(--accent)]">{steps.length - stepsLeft}/{steps.length}</span>
            </Link>
          )}
          <div className="grid grid-cols-2 gap-2">
            <Kpi label="Iscritti" value={String(dash.upcomingPlayers)} hint="ai prossimi tornei" />
            {dash.unpaidCount > 0 ? (
              <Kpi label="Da incassare" value={euro(dash.unpaidCents)} hint={`${dash.unpaidCount} ${dash.unpaidCount === 1 ? "quota" : "quote"}`} tone="warn" />
            ) : (
              <Kpi label="Da incassare" value="0 €" hint="tutto in regola" />
            )}
            <Kpi label="Follower" value={String(followers)} hint="ricevono i tuoi tornei" />
            <Kpi label="Presenze" value={String(dash.checkinsThisMonth)} hint={`check-in di ${MONTHS[now.getMonth()]}`} />
          </div>

          <Eyebrow>Prossimo torneo</Eyebrow>
          {dash.next ? (
            <Link href={`/tournaments/${dash.next.id}`} className="block rounded-[1.25rem] bg-[var(--surface-2)] p-4 active:bg-[var(--surface-3)]">
              <span className="block text-lg font-extrabold text-white">{dash.next.name}</span>
              <span className="block text-sm text-[var(--muted-text)]">{formatDate(dash.next.date)}</span>
              {dash.next.maxPlayers ? (
                <span className="mt-3 block h-2 overflow-hidden rounded-full bg-[var(--surface-4)]">
                  <span className="block h-full rounded-full bg-[var(--accent)]" style={{ width: `${Math.min(100, Math.round((dash.next.players / dash.next.maxPlayers) * 100))}%` }} />
                </span>
              ) : null}
              <span className="mt-2 flex justify-between text-sm font-bold text-[var(--muted-text)]">
                <span>
                  {dash.next.players} iscritti{dash.next.maxPlayers ? ` su ${dash.next.maxPlayers}` : ""}
                </span>
                {dash.next.waitlist > 0 && <span>{dash.next.waitlist} in attesa</span>}
              </span>
            </Link>
          ) : (
            <div className="rounded-[1.25rem] bg-[var(--surface-2)] p-4 text-base text-[var(--muted-text)]">
              Nessun torneo in programma. Creane uno e metti il link nella bio di Instagram.
            </div>
          )}

          <Eyebrow>Azioni rapide</Eyebrow>
          <div className="grid grid-cols-3 gap-2">
            {[
              { href: newTournament, icon: PlusCircle, label: "Crea torneo" },
              { href: `${manage}#scrivi`, icon: Megaphone, label: "Scrivi ai giocatori" },
              { href: dash.next ? `/tournaments/${dash.next.id}/checkin` : "/profile?tab=tornei", icon: ClipboardCheck, label: "Check-in" },
            ].map(({ href, icon: Icon, label }) => (
              <Link key={label} href={href} className="flex min-h-[5.5rem] flex-col items-center justify-center gap-1.5 rounded-[1.25rem] bg-[var(--surface-2)] px-2 text-center text-sm font-extrabold text-white active:bg-[var(--surface-3)]">
                <Icon className="h-6 w-6 text-[var(--accent)]" aria-hidden="true" />
                {label}
              </Link>
            ))}
          </div>

          <Eyebrow>Iscrizioni, ultime 8 settimane</Eyebrow>
          <div className="rounded-[1.25rem] bg-[var(--surface-2)] p-4">
            <div className="flex h-24 items-end gap-1.5" role="img" aria-label={`Iscrizioni per settimana: ${dash.weekly.join(", ")}`}>
              {dash.weekly.map((n, i) => (
                <div key={i} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
                  {n > 0 && <span className="text-xs font-bold text-[var(--muted-text)]">{n}</span>}
                  <span
                    className={i === dash.weekly.length - 1 ? "w-full rounded-t-md bg-[var(--accent)]" : "w-full rounded-t-md bg-[var(--surface-4)]"}
                    style={{ height: `${Math.max(4, Math.round((n / maxWeek) * 80))}%` }}
                  />
                </div>
              ))}
            </div>
            <p className="mt-2 flex justify-between text-xs font-bold text-[var(--muted-text)]">
              <span>8 settimane fa</span>
              <span>questa settimana</span>
            </p>
          </div>
        </>
      )}

      {tab === "tornei" && (
        <>
          <Link href={newTournament} className="btn btn-primary w-full gap-2">
            <PlusCircle className="h-5 w-5" aria-hidden="true" /> Nuovo torneo del club
          </Link>
          {tournaments.length === 0 && (
            <p className="rounded-[1.25rem] bg-[var(--surface-2)] p-4 text-base text-[var(--muted-text)]">Ancora nessun torneo.</p>
          )}
          {(["upcoming", "past"] as const).map((group) => {
            const list = tournaments.filter((t) => isUpcoming(t, now) === (group === "upcoming"))
            if (group === "upcoming") list.reverse()
            if (list.length === 0) return null
            return (
              <div key={group} className="flex flex-col gap-2">
                <Eyebrow>{group === "upcoming" ? "In programma" : "Passati"}</Eyebrow>
                {list.map((t) => {
                  const seats = t.registrations.filter(holdsSeat)
                  const unpaid = (t.priceCents ?? 0) > 0 ? seats.filter((r) => r.paymentStatus === "PENDING").length : 0
                  return (
                    <div key={t.id} className="rounded-[1.25rem] bg-[var(--surface-2)] p-4">
                      <Link href={`/tournaments/${t.id}`} className="flex items-start justify-between gap-2">
                        <span className="min-w-0">
                          <span className="block truncate text-base font-extrabold text-white">{t.name}</span>
                          <span className="block text-sm text-[var(--muted-text)]">{formatDate(t.date)}</span>
                        </span>
                        <StatusBadge status={t.status as "DRAFT" | "LIVE" | "COMPLETED"} />
                      </Link>
                      <p className="mt-2 flex items-center gap-1.5 text-base text-white">
                        <Users className="h-4 w-4 text-[var(--accent)]" aria-hidden="true" />
                        {seats.length} iscritti
                        {unpaid > 0 && <span className="text-[var(--compete)]"> · {unpaid} da pagare</span>}
                        {t._count.waitlist > 0 && <span className="text-[var(--muted-text)]"> · {t._count.waitlist} in attesa</span>}
                      </p>
                      {group === "upcoming" && (
                        <div className="mt-3 grid grid-cols-2 gap-2">
                          <Link href={`/tournaments/${t.id}`} className="btn btn-secondary min-h-[3.5rem]">Apri</Link>
                          <Link href={`/tournaments/${t.id}/checkin`} className="btn btn-secondary min-h-[3.5rem] gap-1 px-2">
                            <ClipboardCheck className="h-5 w-5" aria-hidden="true" /> Check-in
                          </Link>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )
          })}
        </>
      )}

      {tab === "gestione" && (
        <>
          <ListGroup>
            <ListRow href={`${manage}#pagina`} icon={<Settings2 className="h-5 w-5 text-[var(--accent)]" />} title="Pagina del club" subtitle="Logo, campi, servizi, foto, contatti" />
            <ListRow href={`${manage}#scrivi`} icon={<Megaphone className="h-5 w-5 text-[var(--accent)]" />} title="Scrivi ai giocatori" subtitle="Notifica a follower o iscritti" />
            <ListRow href={`${manage}#staff`} icon={<UserCog className="h-5 w-5 text-[var(--social)]" />} title="Staff" subtitle="Chi gestisce il club con te" />
            <ListRow href={`${manage}#circuiti`} icon={<Trophy className="h-5 w-5 text-[var(--compete)]" />} title="Circuiti" subtitle="Tappe e classifica generale" />
          </ListGroup>
          <Eyebrow>Promuovi</Eyebrow>
          <ListGroup>
            <ListRow href={`/c/${club.slug}/link`} icon={<ExternalLink className="h-5 w-5 text-[var(--accent)]" />} title="Link in bio" subtitle="La pagina da mettere su Instagram" />
            <ListRow href={`/c/${club.slug}/qr`} external icon={<QrCode className="h-5 w-5 text-[var(--accent)]" />} title="QR da stampare" subtitle="Per farti seguire al campo" />
            <ListRow href={`${manage}#tornei`} icon={<ImageIcon className="h-5 w-5 text-[var(--accent)]" />} title="Locandine dei tornei" subtitle="Storia e post per Instagram" />
          </ListGroup>
          <Eyebrow>Il club</Eyebrow>
          <ListGroup>
            <ListRow href={`/c/${club.slug}`} icon={<Eye className="h-5 w-5" />} title="Guarda la pagina pubblica" subtitle="Come la vedono i giocatori" />
            <ListRow href={manage} icon={<CalendarDays className="h-5 w-5" />} title="Gestione completa" subtitle="Tutte le impostazioni in una pagina" />
          </ListGroup>
        </>
      )}
    </div>
  )
}
