import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getCurrentPlayer, getCurrentSession } from "@/lib/getCurrentPlayer"
import { canManageClub } from "@/lib/clubAccess"
import { clubRosterCsv } from "@/lib/clubRoster"
import { loadClubRoster } from "@/lib/clubRosterQuery"
import { CLUB_SLUG_RE } from "@/lib/profileMode"

/** The club's players as a CSV for Excel: club staff and SANDER admins only. */
export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  if (!CLUB_SLUG_RE.test(slug)) return NextResponse.json({ error: "Club non trovato" }, { status: 404 })
  const [session, me] = await Promise.all([getCurrentSession(), getCurrentPlayer()])
  const club = await db.club.findUnique({ where: { slug }, select: { id: true, slug: true } })
  if (!club) return NextResponse.json({ error: "Club non trovato" }, { status: 404 })
  if (!(await canManageClub(session?.user?.email, me?.id ?? null, club.id))) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 403 })
  }
  const csv = clubRosterCsv(await loadClubRoster(club.id))
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="giocatori-${club.slug}.csv"`,
      "Cache-Control": "no-store",
    },
  })
}
