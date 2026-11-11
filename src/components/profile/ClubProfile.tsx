import Link from "next/link"
import { BarChart3, CalendarDays, ChevronLeft, ChevronRight, ClipboardCheck, ExternalLink, Eye, Image as ImageIcon, Medal, Megaphone, PlusCircle, QrCode, Settings2, Trophy, UserCog, Users } from "lucide-react"
import { db } from "@/lib/db"
import { clubDashboard, isUpcoming } from "@/lib/clubDashboard"
import { clubChecklist } from "@/lib/club"
import { holdsSeat } from "@/lib/tournament/capacity"
import { euro } from "@/lib/shop"
import { formatDate } from "@/lib/utils"
import { StatusBadge } from "@/components/tournament/StatusBadge"
import { clubYearStats } from "@/lib/clubRoster"
import { loadClubRoster } from "@/lib/clubRosterQuery"
import { cn } from "@/lib/utils"
import { busyDays, courtCount, DAY_RE, layoutDay, shiftDay, weekOf } from "@/lib/clubCalendar"
import { dayKey, formatTime, hasTimeOfDay } from "@/lib/datetime"
import { romeWallTime } from "@/lib/romeMonth"
import { ClubCalendar } from "./ClubCalendar"
import { BackRow, Eyebrow, ListGroup, ListRow, Segments } from "./ProfileUI"
import { ClubPlayersList } from "./ClubPlayersList"

export type ClubTab = "plancia" | "tornei" | "giocatori" | "calendario" | "gestione" | "statistiche"
export const CLUB_TABS: ClubTab[] = ["plancia", "tornei", "giocatori", "calendario", "gestione", "statistiche"]
const WEEKDAYS = ["LUN", "MAR", "MER", "GIO", "VEN", "SAB", "DOM"]

const MONTHS = ["gen", "feb", "mar", "apr", "mag", "giu", "lug", "ago", "set", "ott", "nov", "dic"]
const MONTH_LETTERS = ["G", "F", "M", "A", "M", "G", "L", "A", "S", "O", "N", "D"]
const PLACE = ["text-[var(--gold)]", "text-[var(--silver)]", "text-[var(--bronze)]"]

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
export async function ClubProfile({ clubId, tab, year, day, header }: { clubId: string; tab: ClubTab; year?: number; day?: string; header: React.ReactNode }) {
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

  const roster = tab === "giocatori" ? await loadClubRoster(club.id) : []

  // Statistiche: one year at a time, among the years the club has tournaments in.
  const years = [...new Set([now.getFullYear(), ...tournaments.map((t) => t.date.getFullYear())])].filter((y) => y <= now.getFullYear()).sort((a, b) => b - a).slice(0, 4)
  const statYear = year && years.includes(year) ? year : now.getFullYear()
  const stats =
    tab === "statistiche"
      ? clubYearStats(
          await db.tournament.findMany({
            where: { clubId, date: { gte: new Date(statYear - 1, 0, 1), lt: new Date(statYear + 1, 0, 1) } },
            select: {
              id: true, date: true, status: true, priceCents: true,
              registrations: { select: { playerId: true, paymentStatus: true, isSpectator: true, checkedInAt: true } },
              standings: { select: { playerId: true, rank: true } },
            },
          }),
          statYear,
        )
      : null
  const statNames = stats
    ? new Map(
        (
          await db.player.findMany({
            where: { id: { in: [...stats.topAttendees.map((a) => a.playerId), ...stats.table.slice(0, 10).map((r) => r.playerId)] } },
            select: { id: true, name: true },
          })
        ).map((p) => [p.id, p.name]),
      )
    : new Map<string, string>()
  const maxMonth = stats ? Math.max(1, ...stats.monthly) : 1

  // Calendario: the week of the chosen day, the day court by court.
  const today = dayKey(now)
  const calDay = day && DAY_RE.test(day) ? day : today
  const week = weekOf(calDay)
  const courts = courtCount(club.courts)
  const weekStart = romeWallTime(week[0], "00:00")
  const weekEnd = romeWallTime(shiftDay(week[6], 1), "00:00")
  const weekEvents =
    tab === "calendario"
      ? await db.clubEvent.findMany({
          where: { clubId, startsAt: { lt: weekEnd }, endsAt: { gt: weekStart } },
          orderBy: { startsAt: "asc" },
          select: { id: true, kind: true, title: true, startsAt: true, endsAt: true, court: true, note: true },
        })
      : []
  const weekTournaments = tab === "calendario" ? tournaments.filter((t) => t.date >= weekStart && t.date < weekEnd) : []
  const busy = busyDays([...weekEvents, ...weekTournaments.map((t) => ({ startsAt: t.date }))])
  const dayLayout = tab === "calendario" ? layoutDay(calDay, weekEvents, courts) : null

  return (
    <div className="flex flex-col gap-3 px-4 pb-6">
      {header}
      <Segments
        active={tab === "statistiche" ? "plancia" : tab}
        items={[
          { id: "plancia", label: "Plancia", href: "/profile" },
          { id: "tornei", label: "Tornei", href: "/profile?tab=tornei" },
          { id: "giocatori", label: "Giocatori", href: "/profile?tab=giocatori" },
          { id: "calendario", label: "Calendario", href: "/profile?tab=calendario" },
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
          <ListGroup>
            <ListRow href="/profile?tab=statistiche" icon={<BarChart3 className="h-5 w-5 text-[var(--accent)]" />} title="Statistiche del club" subtitle="Iscrizioni e quote dell'anno, più presenti, classifica interna" />
          </ListGroup>
        </>
      )}

      {tab === "giocatori" && (
        <ClubPlayersList
          exportHref={`/api/clubs/${club.slug}/giocatori`}
          players={roster.map((r) => ({
            playerId: r.playerId,
            name: r.name,
            avatarUrl: r.avatarUrl,
            tournaments: r.tournaments,
            checkins: r.checkins,
            lastDate: r.lastDate?.toISOString() ?? null,
            unpaidCount: r.unpaidCount,
            unpaidCents: r.unpaidCents,
            follower: r.follower,
            isNew: r.isNew,
            firstSeen: r.firstSeen.toISOString(),
          }))}
        />
      )}

      {tab === "calendario" && dayLayout && (
        <>
          <div className="flex items-center gap-1">
            <Link href={`/profile?tab=calendario&giorno=${shiftDay(calDay, -7)}`} aria-label="Settimana prima" className="flex h-12 w-8 shrink-0 items-center justify-center text-[var(--muted-text)]">
              <ChevronLeft className="h-5 w-5" aria-hidden="true" />
            </Link>
            <div className="grid flex-1 grid-cols-7 gap-1">
              {week.map((d, i) => (
                <Link
                  key={d}
                  href={`/profile?tab=calendario&giorno=${d}`}
                  scroll={false}
                  aria-current={d === calDay ? "date" : undefined}
                  className={cn(
                    "flex min-h-[3.5rem] flex-col items-center justify-center rounded-xl",
                    d === calDay ? "bg-[var(--accent)] text-black" : "bg-[var(--surface-2)] text-white",
                    d === today && d !== calDay && "ring-1 ring-[var(--accent-line)]",
                  )}
                >
                  <span className={cn("text-[10px] font-bold", d === calDay ? "text-black/70" : "text-[var(--muted-text)]")}>{WEEKDAYS[i]}</span>
                  <span className="font-display text-lg font-extrabold leading-none">{Number(d.slice(8))}</span>
                  <span className={cn("mt-0.5 h-1.5 w-1.5 rounded-full", busy.has(d) ? (d === calDay ? "bg-black" : "bg-[var(--compete)]") : "bg-transparent")} />
                </Link>
              ))}
            </div>
            <Link href={`/profile?tab=calendario&giorno=${shiftDay(calDay, 7)}`} aria-label="Settimana dopo" className="flex h-12 w-8 shrink-0 items-center justify-center text-[var(--muted-text)]">
              <ChevronRight className="h-5 w-5" aria-hidden="true" />
            </Link>
          </div>
          {!club.courts && (
            <Link href={`${manage}#pagina`} className="rounded-2xl bg-[var(--surface-2)] px-4 py-3 text-sm text-[var(--muted-text)]">
              Il calendario mostra 1 campo: <span className="font-bold text-[var(--accent)]">indica quanti campi avete</span> nella pagina del club.
            </Link>
          )}
          <ClubCalendar
            clubId={club.id}
            day={calDay}
            courts={courts}
            startHour={dayLayout.startHour}
            endHour={dayLayout.endHour}
            tournaments={weekTournaments
              .filter((t) => dayKey(t.date) === calDay)
              .map((t) => ({ id: t.id, name: t.name, time: hasTimeOfDay(t.date) ? formatTime(t.date) : null }))}
            placed={dayLayout.placed.map((p) => ({
              id: p.event.id,
              kind: p.event.kind,
              title: p.event.title,
              start: formatTime(p.event.startsAt),
              end: formatTime(p.event.endsAt),
              court: p.event.court,
              note: weekEvents.find((e) => e.id === p.event.id)?.note ?? null,
              rowStart: p.rowStart,
              rowEnd: p.rowEnd,
              colStart: p.colStart,
              colEnd: p.colEnd,
            }))}
          />
        </>
      )}

      {tab === "statistiche" && stats && (
        <>
          <BackRow href="/profile" label="Plancia" />
          {years.length > 1 && (
            <div className="flex gap-2" role="group" aria-label="Anno">
              {years.map((y) => (
                <Link
                  key={y}
                  href={`/profile?tab=statistiche&anno=${y}`}
                  aria-current={y === statYear ? "page" : undefined}
                  className={cn("flex min-h-[2.75rem] items-center rounded-full px-4 text-sm font-extrabold", y === statYear ? "sel-on" : "sel-off")}
                >
                  {y}
                </Link>
              ))}
            </div>
          )}
          <div className="grid grid-cols-2 gap-2">
            <Kpi
              label="Iscrizioni"
              value={String(stats.signups)}
              hint={stats.signupsDelta === null ? `nel ${statYear}` : `${stats.signupsDelta >= 0 ? "+" : ""}${stats.signupsDelta}% sul ${statYear - 1}`}
            />
            <Kpi label="Quote segnate" value={euro(stats.collectedCents)} hint={`${stats.tournaments} ${stats.tournaments === 1 ? "torneo" : "tornei"}`} />
          </div>

          <Eyebrow>Iscrizioni per mese</Eyebrow>
          <div className="rounded-[1.25rem] bg-[var(--surface-2)] p-4">
            <div className="flex h-28 items-end gap-1" role="img" aria-label={`Iscrizioni per mese nel ${statYear}: ${stats.monthly.join(", ")}`}>
              {stats.monthly.map((n, i) => (
                <div key={i} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
                  {n > 0 && <span className="text-[11px] font-bold text-[var(--muted-text)]">{n}</span>}
                  <span
                    className={statYear === now.getFullYear() && i === now.getMonth() ? "w-full rounded-t-md bg-[var(--accent)]" : "w-full rounded-t-md bg-[var(--surface-4)]"}
                    style={{ height: `${Math.max(3, Math.round((n / maxMonth) * 80))}%` }}
                  />
                </div>
              ))}
            </div>
            <p className="mt-1.5 flex gap-1 text-center text-[11px] font-bold text-[var(--muted-text)]">
              {MONTH_LETTERS.map((m, i) => (
                <span key={i} className="flex-1">{m}</span>
              ))}
            </p>
          </div>

          <Eyebrow>Più presenti</Eyebrow>
          {stats.topAttendees.length === 0 ? (
            <p className="rounded-[1.25rem] bg-[var(--surface-2)] p-4 text-base text-[var(--muted-text)]">Ancora nessun iscritto nel {statYear}.</p>
          ) : (
            <ol className="divide-y divide-[var(--border)] overflow-hidden rounded-[1.25rem] bg-[var(--surface-2)]">
              {stats.topAttendees.map((a, i) => (
                <li key={a.playerId}>
                  <Link href={`/players/${a.playerId}`} className="flex min-h-[3.5rem] items-center gap-3 px-4 py-2 active:bg-[var(--surface-3)]">
                    <span className={cn("w-6 font-display text-lg font-extrabold", PLACE[i] ?? "text-[var(--muted-text)]")}>{i + 1}</span>
                    <span className="min-w-0 flex-1 truncate text-base font-bold text-white">{statNames.get(a.playerId) ?? "Giocatore"}</span>
                    <span className="shrink-0 text-sm text-[var(--muted-text)]">
                      {a.checkins > 0 ? `${a.checkins} ${a.checkins === 1 ? "presenza" : "presenze"} · ` : ""}{a.tournaments} {a.tournaments === 1 ? "torneo" : "tornei"}
                    </span>
                  </Link>
                </li>
              ))}
            </ol>
          )}

          <Eyebrow>Classifica interna {statYear}</Eyebrow>
          {stats.table.length === 0 ? (
            <p className="rounded-[1.25rem] bg-[var(--surface-2)] p-4 text-base text-[var(--muted-text)]">
              La classifica si forma con i tornei conclusi: punti in base al piazzamento, come nei circuiti.
            </p>
          ) : (
            <ol className="divide-y divide-[var(--border)] overflow-hidden rounded-[1.25rem] bg-[var(--surface-2)]">
              {stats.table.slice(0, 10).map((r) => (
                <li key={r.playerId}>
                  <Link href={`/players/${r.playerId}`} className="flex min-h-[3.5rem] items-center gap-3 px-4 py-2 active:bg-[var(--surface-3)]">
                    <span className={cn("w-6 font-display text-lg font-extrabold", PLACE[r.rank - 1] ?? "text-[var(--muted-text)]")}>{r.rank}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-base font-bold text-white">{statNames.get(r.playerId) ?? "Giocatore"}</span>
                      <span className="block text-sm text-[var(--muted-text)]">
                        {r.stages} {r.stages === 1 ? "torneo" : "tornei"}{r.wins > 0 ? ` · ${r.wins} ${r.wins === 1 ? "vittoria" : "vittorie"}` : ""}
                      </span>
                    </span>
                    <span className="shrink-0 font-display text-lg font-extrabold text-[var(--accent)]">{r.points}</span>
                  </Link>
                </li>
              ))}
            </ol>
          )}
          <p className="flex items-center gap-1.5 px-1 text-sm text-[var(--muted-text)]">
            <Medal className="h-4 w-4 shrink-0" aria-hidden="true" /> Punti dai tornei del club conclusi nel {statYear}, come nei circuiti.
          </p>
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
          <BackRow href="/profile" label="Plancia" />
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
