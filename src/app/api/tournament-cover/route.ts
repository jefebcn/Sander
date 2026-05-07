import { put } from "@vercel/blob"
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { isAdminEmail, canManageTournament } from "@/lib/isAdmin"

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autenticato" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const tournamentId = searchParams.get("tournamentId")

  // Allow admin always; allow organizer if tournamentId is provided
  const allowed =
    isAdminEmail(session.user.email) ||
    (tournamentId
      ? await canManageTournament(session.user.email, tournamentId)
      : true) // new tournament — any authenticated user can upload during creation

  if (!allowed) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 403 })
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json({ url: null })
  }

  const formData = await req.formData()
  const file = formData.get("file") as File | null
  if (!file) {
    return NextResponse.json({ error: "Nessun file" }, { status: 400 })
  }

  const blob = await put(`tournament-covers/${Date.now()}-${file.name}`, file, {
    access: "public",
  })

  return NextResponse.json({ url: blob.url })
}
