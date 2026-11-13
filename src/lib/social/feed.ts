import { db } from "@/lib/db"
import { categoryGroup, isYouthCategory, shortCategory } from "@/lib/fipav/parse"

/* ────────────────────────────────────────────────────────────────────────── */
/*  Public, read-only feed for the Instagram kit (scripts/content-instagram).  */
/*  Only what the public pages already show: no names, no contacts, no ids of  */
/*  people. Tournaments carry their id so the kit can screenshot the real      */
/*  public page.                                                               */
/* ────────────────────────────────────────────────────────────────────────── */

const DAY = 86_400_000

export interface SocialFeed {
  generatedAt: string
  tournaments: {
    id: string
    name: string
    date: string
    location: string | null
    type: string
    status: string
    gender: string | null
    level: string | null
    priceCents: number | null
    registered: number
    maxTeams: number | null
    registrationDeadline: string | null
    registrationOpen: boolean
    club: string | null
  }[]
  openMatches: { id: string; date: string; city: string | null; location: string; format: string; spotsLeft: number; maxPlayers: number }[]
  fipav: { code: string; category: string; group: string; city: string; region: string; gender: string; startDate: string; endDate: string; prizeEuro: number; club: string | null }[]
}

export async function socialFeed(now = new Date()): Promise<SocialFeed> {
  const from = new Date(now.getTime() - DAY)
  const to = new Date(now.getTime() + 28 * DAY)
  const [tournaments, sessions, fipav] = await Promise.all([
    db.tournament.findMany({
      where: { status: { in: ["DRAFT", "LIVE"] }, date: { gte: from, lte: to } },
      orderBy: { date: "asc" },
      take: 20,
      select: {
        id: true, name: true, date: true, location: true, type: true, status: true, gender: true, skillLevel: true,
        priceCents: true, maxTeams: true, registrationDeadline: true, isOpenForRegistration: true,
        club: { select: { name: true, status: true } },
        _count: { select: { registrations: { where: { isSpectator: false, paymentStatus: { notIn: ["CANCELLED", "REFUNDED"] } } } } },
      },
    }),
    db.session.findMany({
      where: { status: "OPEN", date: { gte: now, lte: new Date(now.getTime() + 4 * DAY) } },
      orderBy: { date: "asc" },
      take: 30,
      select: { id: true, date: true, city: true, location: true, format: true, maxPlayers: true, _count: { select: { participants: true } } },
    }),
    db.fipavEvent.findMany({
      where: { endDate: { gte: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())) }, startDate: { lte: to } },
      orderBy: [{ startDate: "asc" }, { prizeEuro: "desc" }],
      take: 400,
      select: { code: true, category: true, city: true, region: true, gender: true, startDate: true, endDate: true, prizeEuro: true, clubName: true },
    }),
  ])
  return {
    generatedAt: now.toISOString(),
    tournaments: tournaments.map((t) => ({
      id: t.id,
      name: t.name,
      date: t.date.toISOString(),
      location: t.location,
      type: t.type,
      status: t.status,
      gender: t.gender,
      level: t.skillLevel,
      priceCents: t.priceCents,
      registered: t._count.registrations,
      maxTeams: t.maxTeams,
      registrationDeadline: t.registrationDeadline?.toISOString() ?? null,
      registrationOpen: t.status === "DRAFT" && t.isOpenForRegistration && !(t.registrationDeadline && t.registrationDeadline < now),
      club: t.club?.status === "APPROVED" ? t.club.name : null,
    })),
    openMatches: sessions
      .map((s) => ({
        id: s.id, date: s.date.toISOString(), city: s.city, location: s.location, format: s.format,
        maxPlayers: s.maxPlayers, spotsLeft: Math.max(0, s.maxPlayers - s._count.participants),
      }))
      .filter((s) => s.spotsLeft > 0),
    // Calendar only (owner's choice): no athletes. Youth events left out.
    fipav: fipav
      .filter((e) => !isYouthCategory(e.category))
      .map((e) => ({
        code: e.code, category: shortCategory(e.category), group: categoryGroup(e.category), city: e.city, region: e.region,
        gender: e.gender, startDate: e.startDate.toISOString(), endDate: e.endDate.toISOString(), prizeEuro: e.prizeEuro, club: e.clubName,
      })),
  }
}
