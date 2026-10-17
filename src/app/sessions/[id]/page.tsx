export const dynamic = "force-dynamic"

import type { Metadata } from "next"
import { MapPin, Calendar, Euro, FileText, Coins, RefreshCw, Gauge, Pencil } from "lucide-react"
import { notFound } from "next/navigation"
import Link from "next/link"
import { getSession, getWaitlistInfo } from "@/actions/sessions"
import { getCurrentPlayer } from "@/lib/getCurrentPlayer"
import { db } from "@/lib/db"
import { ShareButton, WhatsAppShareButton } from "@/components/ui/ShareButton"
import { QRCodeButton } from "@/components/ui/QRCode"
import { SessionStatusBadge } from "@/components/session/SessionStatusBadge"
import { ParticipantList } from "@/components/session/ParticipantList"
import { SessionChat } from "@/components/chat/SessionChat"
import { SessionMatchRounds } from "@/components/session/SessionMatchRounds"
import { RematchButton } from "@/components/session/RematchButton"
import { PageHeader } from "@/components/layout/PageHeader"
import { ShareStoryButton } from "@/components/share/ShareStoryButton"
import { playerToCardData } from "@/components/player/SanderCardFut"
import { buildPromoCode, cleanInviteCode, INVITEE_SC } from "@/lib/referral"
import { Pill } from "@/components/ui/Pill"
import { MatchRecap, type MatchRecapData } from "@/components/session/MatchRecap"
import { ratingDeltaFor } from "@/lib/matchRecap"
import { startingRating, type StartLevel } from "@/lib/startLevel"
import { getCityLeaderboards } from "@/actions/territories"
import { parseCity } from "@/lib/cities"

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> }
): Promise<Metadata> {
  const { id } = await params
  const session = await getSession(id).catch(() => null)
  const title = session ? `${session.title} — SANDER` : "SANDER — Beach Volleyball"
  const ogUrl = session
    ? `/api/og?title=${encodeURIComponent(session.title)}&subtitle=${encodeURIComponent(session.location)}&type=session`
    : `/api/og?title=SANDER&subtitle=Beach+Volleyball&type=session`
  return {
    title,
    openGraph: {
      title,
      description: session
        ? `${session.location} · Unisciti alla partita su SANDER 🏐`
        : "Beach Volleyball Tournament Manager",
      images: [{ url: ogUrl, width: 1200, height: 630, alt: title }],
    },
  }
}

const FORMAT_LABEL: Record<string, string> = {
  TWO_VS_TWO: "2 vs 2",
  THREE_VS_THREE: "3 vs 3",
  FOUR_VS_FOUR: "4 vs 4",
}

export default async function SessionPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ invite?: string }>
}) {
  const { id } = await params
  // A friend's share link carries their invite code: signing up from here
  // credits them, so "come play with us" doubles as a referral.
  const { invite } = await searchParams
  const inviteCode = cleanInviteCode(invite)
  const [session, currentPlayer] = await Promise.all([getSession(id), getCurrentPlayer()])

  // Shared links carry the sharer's invite code (see `invite` above).
  const sharePath = currentPlayer
    ? `/sessions/${id}?invite=${buildPromoCode(currentPlayer.id)}`
    : `/sessions/${id}`

  // Separate sets query — graceful fallback if table doesn't exist yet
  const sets = session.status === "COMPLETED"
    ? await db.sessionSet.findMany({ where: { sessionId: id }, orderBy: { setNumber: "asc" } }).catch(() => [])
    : []

  // Multi-match mode: fetch session matches when applicable
  const sessionMatches = session.matchMode
    ? await db.sessionMatch.findMany({
        where: { sessionId: id },
        include: { players: { include: { player: { select: { id: true, name: true } } } } },
        orderBy: [{ round: "asc" }, { matchNumber: "asc" }],
      }).catch(() => [])
    : []

  // Completed sessions are private — only participants (and the organizer,
  // who may have run it without a seat and just closed it) can view them
  if (session.status === "COMPLETED") {
    const isParticipant = session.participants.some((p) => p.player?.id === currentPlayer?.id)
    if (!isParticipant && session.organizerId !== currentPlayer?.id) notFound()
  }

  // Fetch SC balance if this session costs SanderCredits
  const currentPlayerCredits =
    session.paymentType === "SC" && currentPlayer
      ? await db.player.findUnique({ where: { id: currentPlayer.id }, select: { sanderCredits: true } })
          .then((p) => p?.sanderCredits ?? 0)
      : null

  const dateObj = new Date(session.date)
  const dateStr = dateObj.toLocaleDateString("it-IT", { timeZone: "Europe/Rome",
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  })
  const timeStr = dateObj.toLocaleTimeString("it-IT", { timeZone: "Europe/Rome", hour: "2-digit", minute: "2-digit" })

  const costPerPlayer =
    session.courtCost && session.participants.length > 0
      ? (session.courtCost / session.maxPlayers / 100).toFixed(2)
      : null

  const isParticipant = currentPlayer
    ? session.participants.some((p) => p.player?.id === currentPlayer.id)
    : false

  const isOrganizer = currentPlayer?.id === session.organizerId

  const waitlist = await getWaitlistInfo(session.id)

  // Post-match recap for someone who played: result, rating moved, town rank.
  let recap: MatchRecapData | null = null
  if (session.status === "COMPLETED" && currentPlayer && isParticipant && sets.length > 0) {
    const aWins = sets.filter((s) => s.teamAScore > s.teamBScore).length
    const bWins = sets.filter((s) => s.teamBScore > s.teamAScore).length
    const myTeam = session.participants.find((p) => p.player?.id === currentPlayer.id)?.team
    if (myTeam === 0 || myTeam === 1) {
      const [history, boards] = await Promise.all([
        db.ratingHistory.findMany({
          where: { playerId: currentPlayer.id },
          select: { rating: true, sourceId: true, createdAt: true },
        }),
        getCityLeaderboards().catch(() => []),
      ])
      const baseline = currentPlayer.startLevel
        ? startingRating(currentPlayer.startLevel as StartLevel)
        : 1500
      const cityName = session.city ?? parseCity(session.location)
      const board = cityName ? boards.find((b) => b.city === cityName) : undefined
      const myIndex = board ? board.standings.findIndex((p) => p.id === currentPlayer.id) : -1
      recap = {
        won: (myTeam === 0 && aWins > bWins) || (myTeam === 1 && bWins > aWins),
        delta: ratingDeltaFor(history, session.id, baseline),
        city: board && myIndex >= 0 ? { name: board.city, rank: myIndex + 1, total: board.standings.length } : null,
      }
    }
  }

  return (
    <div className="pb-6">
      <PageHeader
        title={session.title}
        backHref="/sessions"
        subtitle={session.organizer.name}
        action={<SessionStatusBadge status={session.status as "OPEN" | "FULL" | "COMPLETED" | "CANCELLED"} />}
      />

      <div className="space-y-4 px-4">
        {recap && <MatchRecap data={recap} />}

        {/* Details card */}
        <div className="tone-play space-y-4 rounded-[var(--radius-lg)] bg-[var(--surface-2)] p-5 shadow-[var(--shadow-card)]">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="num text-5xl leading-none text-white">{timeStr}</p>
              <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold capitalize text-[var(--muted-text)]">
                <Calendar className="h-4 w-4 text-[var(--accent)]" aria-hidden="true" />
                {dateStr}
              </p>
            </div>
            <div className="flex flex-wrap justify-end gap-1.5">
              <Pill tone="play">{FORMAT_LABEL[session.format]}</Pill>
              {costPerPlayer && (
                <Pill tone="sand">
                  <Euro className="h-3.5 w-3.5" aria-hidden="true" />
                  {costPerPlayer} a testa
                </Pill>
              )}
            </div>
          </div>
          {/* Getting there is half the battle: one tap to directions. */}
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(session.location + (session.city ? `, ${session.city}` : ""))}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-h-[3.5rem] items-center gap-3 rounded-[var(--radius-md)] bg-black/25 px-4"
          >
            <MapPin className="h-5 w-5 shrink-0 text-[var(--accent)]" aria-hidden="true" />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-base font-bold text-white">{session.location}</span>
              {session.city && <span className="block text-sm text-[var(--muted-text)]">{session.city}</span>}
            </span>
            <span className="shrink-0 text-sm font-bold text-[var(--accent)]">Apri in Maps</span>
          </a>
          {session.paymentType === "SC" && session.quotaAmount && (
            <div className="flex items-center gap-3 text-sm">
              <Coins className="h-4 w-4 shrink-0 text-[var(--accent)]" aria-hidden="true" />
              <span>
                <span className="font-black text-[var(--accent)]">{session.quotaAmount} SC</span>
                {" "}a persona
                {currentPlayerCredits !== null && (
                  <span className="ml-2 text-[var(--muted-text)]">
                    · il tuo saldo:{" "}
                    <span className={currentPlayerCredits >= session.quotaAmount ? "text-white font-bold" : "text-[var(--danger)] font-bold"}>
                      {currentPlayerCredits} SC
                    </span>
                  </span>
                )}
              </span>
            </div>
          )}
          {session.notes && (
            <div className="flex items-start gap-3 text-sm">
              <FileText className="mt-0.5 h-4 w-4 shrink-0 text-[var(--muted-text)]" aria-hidden="true" />
              <span className="text-[var(--muted-text)]">{session.notes}</span>
            </div>
          )}

          {/* Score summary (COMPLETED sessions with recorded sets) */}
          {session.status === "COMPLETED" && sets.length > 0 && (() => {
            const teamAWins = sets.filter((s) => s.teamAScore > s.teamBScore).length
            const teamBWins = sets.filter((s) => s.teamBScore > s.teamAScore).length
            const myTeam = session.participants.find((p) => p.player?.id === currentPlayer?.id)?.team
            const didWin =
              (myTeam === 0 && teamAWins > teamBWins) ||
              (myTeam === 1 && teamBWins > teamAWins)
            return (
              <>
                <div className="mt-1 rounded-xl bg-black/25 p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="eyebrow text-[var(--muted-text)]">Risultato</p>
                    <p className="num text-lg text-[var(--accent)]">{teamAWins} — {teamBWins}</p>
                  </div>
                  {/* One row per team, one column per set: reads like a scoreboard. */}
                  <table className="w-full text-base">
                    <tbody>
                      {([0, 1] as const).map((team) => (
                        <tr key={team}>
                          <th scope="row" className={`py-1 pr-3 text-left text-sm font-bold ${team === myTeam ? "text-[var(--accent)]" : "text-[var(--muted-text)]"}`}>
                            {team === 0 ? "Team A" : "Team B"}
                          </th>
                          {sets.map((s) => {
                            const mine = team === 0 ? s.teamAScore : s.teamBScore
                            const theirs = team === 0 ? s.teamBScore : s.teamAScore
                            return (
                              <td key={s.id} className={`num w-10 py-1 text-center text-lg ${mine > theirs ? "text-white" : "text-[var(--muted-text)]"}`}>
                                {mine}
                              </td>
                            )
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {/* Viral moment: winner can share the victory as a Story */}
                {didWin && currentPlayer && (
                  <div className="mt-2">
                    <ShareStoryButton
                      playerData={playerToCardData(currentPlayer)}
                      variant="win"
                      subline={`Vittoria a ${session.location}`}
                    />
                  </div>
                )}
              </>
            )
          })()}
        </div>

        {/* CTA per utenti non autenticati */}
        {!currentPlayer && (session.status === "OPEN" || session.status === "FULL") && (
          <Link
            href={`/auth/signin?mode=register&callbackUrl=${encodeURIComponent(`/sessions/${session.id}`)}${inviteCode ? `&invite=${inviteCode}` : ""}`}
            className="flex min-h-[3.5rem] w-full items-center justify-center rounded-2xl font-black text-black text-base"
            style={{ background: "var(--accent)" }}
          >
            {inviteCode ? `Registrati e gioca (+${INVITEE_SC} SC in regalo)` : "Accedi per partecipare"}
          </Link>
        )}

        {/* Organizer: edit the session (fix a typo without cancelling it) */}
        {isOrganizer && (session.status === "OPEN" || session.status === "FULL") && (
          <Link
            href={`/sessions/${session.id}/edit`}
            className="flex min-h-[3.5rem] w-full items-center justify-center gap-2 rounded-2xl bg-[var(--surface-2)] font-bold text-white transition-opacity active:opacity-80"
          >
            <Pencil className="h-4 w-4 text-[var(--accent)]" />
            Modifica partita
          </Link>
        )}

        {/* Participants + actions */}
        <ParticipantList
          session={{
            id: session.id,
            organizerId: session.organizerId,
            status: session.status,
            maxPlayers: session.maxPlayers,
            format: session.format,
          }}
          participants={session.participants}
          currentPlayerId={currentPlayer?.id ?? null}
          myWaitlistPosition={waitlist.myPosition}
        />

        {/* Share + QR — below the join action on purpose: sharing is what the
            organiser does, while someone arriving from a link wants "Unisciti"
            first, not three share buttons before it. */}
        {(session.status === "OPEN" || session.status === "FULL") && (
          <div className="space-y-2">
            <p className="eyebrow text-[var(--muted-text)]">Porta qualcuno a giocare</p>
            <WhatsAppShareButton
              path={sharePath}
              text={`Ci stai? "${session.title}" a ${session.location} — entra su SANDER 🏐`}
            />
            <div className="grid grid-cols-2 gap-2">
              <ShareButton
                path={sharePath}
                title={session.title}
                text={`Unisciti a "${session.title}" su SANDER 🏐`}
                fullWidth
                label="Condividi"
              />
              <QRCodeButton path={sharePath} title={session.title} label="QR" />
            </div>
          </div>
        )}

        {/* Group chat — coordinate this game (participants only) */}
        {isParticipant && <SessionChat sessionId={session.id} />}

        {/* Live scoreboard — anyone playing this match (the board itself already
            accepts any participant, and on the sand whoever is nearest scores) */}
        {(isOrganizer || isParticipant) &&
          !session.matchMode &&
          (session.status === "OPEN" || session.status === "FULL") &&
          session.participants.some((p) => p.team === 0) &&
          session.participants.some((p) => p.team === 1) && (
            <Link
              href={`/segna?session=${session.id}`}
              className="flex min-h-[3.5rem] w-full items-center justify-center gap-2 rounded-2xl font-black text-black text-base transition-opacity active:opacity-80"
              style={{ background: "var(--accent)" }}
            >
              <Gauge className="h-5 w-5" />
              Segna dal vivo
            </Link>
          )}

        {/* Multi-match rounds (matchMode sessions) */}
        {session.matchMode && (
          <SessionMatchRounds
            sessionId={session.id}
            matches={sessionMatches as Parameters<typeof SessionMatchRounds>[0]["matches"]}
            isOrganizer={isOrganizer}
            sessionStatus={session.status}
          />
        )}

        {/* Ricrea sessione + Rematch CTA for completed sessions */}
        {session.status === "COMPLETED" && isParticipant && (
          <div className="space-y-2">
            <Link
              href={`/sessions/new?from=${session.id}`}
              className="flex min-h-[3.5rem] w-full items-center justify-center gap-2 rounded-2xl font-bold text-base transition-opacity active:opacity-80"
              style={{ background: "var(--surface-2)", color: "var(--muted-text)" }}
            >
              <RefreshCw className="h-5 w-5" />
              Ricrea sessione
            </Link>
            <RematchButton sessionId={session.id} />
          </div>
        )}

      </div>
    </div>
  )
}
