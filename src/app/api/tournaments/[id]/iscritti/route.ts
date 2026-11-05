import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { canManageTournament } from "@/lib/isAdmin"
import { registrationsCsv } from "@/lib/registrationsCsv"

/** The organiser's sign-up list as a CSV that opens in Excel (club staff, creator, admins). */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!(await canManageTournament(session?.user?.email, id))) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 403 })
  }
  const t = await db.tournament.findUnique({
    where: { id },
    select: {
      name: true,
      registrations: {
        where: { isSpectator: false },
        orderBy: [{ seedPosition: "asc" }, { createdAt: "asc" }],
        select: {
          seedPosition: true,
          teamName: true,
          paymentStatus: true,
          paymentMethod: true,
          createdAt: true,
          player: { select: { name: true, homeCity: true, user: { select: { email: true } } } },
        },
      },
    },
  })
  if (!t) return NextResponse.json({ error: "Torneo non trovato" }, { status: 404 })
  const csv = registrationsCsv(
    t.registrations.map((r) => ({
      seed: r.seedPosition,
      team: r.teamName,
      name: r.player.name,
      email: r.player.user?.email ?? null,
      city: r.player.homeCity,
      paymentStatus: r.paymentStatus,
      paymentMethod: r.paymentMethod,
      createdAt: r.createdAt,
    })),
  )
  const file = t.name.replace(/[^\w\- ]+/g, "").trim().replace(/\s+/g, "-") || "torneo"
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="iscritti-${file}.csv"`,
      "Cache-Control": "no-store",
    },
  })
}
