import { db } from "@/lib/db"
import { INVITEE_SC, INVITER_SC } from "@/lib/referral"
import {
  average,
  lastMonths,
  monthKey,
  monthlyRetention,
  seasonRetention,
  sumByMonth,
  type Activity,
} from "@/lib/metrics/compute"

/* ────────────────────────────────────────────────────────────────────────── */
/*  Business metrics for /admin/metriche.                                      */
/*                                                                             */
/*  Deliberately NOT a "use server" file: every export there is a public        */
/*  endpoint, and revenue figures must only ever be read by the admin page,     */
/*  which does its own auth check before calling this.                          */
/* ────────────────────────────────────────────────────────────────────────── */

export const SC_PER_EURO = 10
const WINDOW_MONTHS = 6

export async function getAdminMetrics(now = new Date()) {
  const months = lastMonths(now, WINDOW_MONTHS)

  const [
    paidRegistrations,
    refunded,
    topUps,
    creditsInCirculation,
    players,
    sessionActivity,
    tournamentActivity,
  ] = await Promise.all([
    db.tournamentRegistration.findMany({
      where: { paymentStatus: "PAID", amountPaidCents: { gt: 0 } },
      select: { playerId: true, amountPaidCents: true, paymentMethod: true, paidAt: true, createdAt: true },
    }),
    db.tournamentRegistration.aggregate({
      where: { paymentStatus: "REFUNDED" },
      _count: true,
      _sum: { amountPaidCents: true },
    }),
    db.creditTopUp.findMany({
      select: { playerId: true, credits: true, amountCents: true, method: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    }),
    db.player.aggregate({ _sum: { sanderCredits: true } }),
    db.player.findMany({
      select: { createdAt: true, user: { select: { invitedByPlayerId: true } } },
    }),
    db.sessionParticipant.findMany({
      where: { playerId: { not: null }, session: { status: "COMPLETED", date: { lte: now } } },
      select: { playerId: true, session: { select: { date: true } } },
    }),
    db.tournamentRegistration.findMany({
      // Only tournaments already played: signing up for next month's event
      // isn't playing, and would inflate this month's actives.
      where: {
        isSpectator: false,
        paymentStatus: { in: ["FREE", "PAID"] },
        tournament: { date: { lte: now } },
      },
      select: { playerId: true, tournament: { select: { date: true } } },
    }),
  ])

  /* ── Revenue ─────────────────────────────────────────────────────────── */
  const paidTopUps = topUps.filter((t) => t.method !== "OMAGGIO")
  const tournamentByMonth = sumByMonth(
    paidRegistrations,
    (r) => r.paidAt ?? r.createdAt,
    (r) => r.amountPaidCents ?? 0,
    months,
  )
  const topUpByMonth = sumByMonth(paidTopUps, (t) => t.createdAt, (t) => t.amountCents, months)

  const tournamentTotal = paidRegistrations.reduce((s, r) => s + (r.amountPaidCents ?? 0), 0)
  const stripeTotal = paidRegistrations
    .filter((r) => r.paymentMethod === "STRIPE")
    .reduce((s, r) => s + (r.amountPaidCents ?? 0), 0)
  const topUpTotal = paidTopUps.reduce((s, t) => s + t.amountCents, 0)

  const payingPlayers = new Set([
    ...paidRegistrations.map((r) => r.playerId),
    ...paidTopUps.map((t) => t.playerId),
  ])

  /* ── Credits ─────────────────────────────────────────────────────────── */
  const referredSignups = players.filter((p) => p.user?.invitedByPlayerId).length
  const scInCirculation = creditsInCirculation._sum.sanderCredits ?? 0

  /* ── Acquisition ─────────────────────────────────────────────────────── */
  const signupsByMonth = months.map((month) => {
    const joined = players.filter((p) => monthKey(p.createdAt) === month)
    return {
      month,
      total: joined.length,
      referred: joined.filter((p) => p.user?.invitedByPlayerId).length,
    }
  })

  /* ── Retention ───────────────────────────────────────────────────────── */
  const activity: Activity[] = [
    ...sessionActivity.map((a) => ({ playerId: a.playerId!, date: a.session.date })),
    ...tournamentActivity.map((a) => ({ playerId: a.playerId, date: a.tournament.date })),
  ]

  return {
    months,
    revenue: {
      byMonth: months.map((m) => ({
        month: m,
        tournamentsCents: tournamentByMonth[m],
        topUpsCents: topUpByMonth[m],
      })),
      tournamentTotalCents: tournamentTotal,
      stripeTotalCents: stripeTotal,
      topUpTotalCents: topUpTotal,
      refundedCount: refunded._count,
      refundedCents: refunded._sum.amountPaidCents ?? 0,
      /** First recorded top-up: earlier credits were sold but never logged in euros. */
      topUpLedgerSince: topUps[0]?.createdAt ?? null,
    },
    averages: {
      tournamentEntryCents: average(paidRegistrations.map((r) => r.amountPaidCents ?? 0)),
      tournamentEntries: paidRegistrations.length,
      topUpCents: average(paidTopUps.map((t) => t.amountCents)),
      topUps: paidTopUps.length,
      revenuePerPayingPlayerCents:
        payingPlayers.size > 0 ? (tournamentTotal + topUpTotal) / payingPlayers.size : null,
      payingPlayers: payingPlayers.size,
    },
    credits: {
      inCirculation: scInCirculation,
      giftedViaTopUp: topUps.filter((t) => t.method === "OMAGGIO").reduce((s, t) => s + t.credits, 0),
      referredSignups,
      /** Upper bound: the invitee's 20 SC are only granted once they finish the profile. */
      referralCostMax: referredSignups * (INVITER_SC + INVITEE_SC),
    },
    acquisition: {
      totalPlayers: players.length,
      byMonth: signupsByMonth,
    },
    retention: {
      byMonth: monthlyRetention(activity, months),
      bySeason: seasonRetention(activity),
    },
  }
}

export type AdminMetrics = Awaited<ReturnType<typeof getAdminMetrics>>
