import { put } from "@vercel/blob"
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { isAdminEmail, canManageTournament } from "@/lib/isAdmin"

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autenticato" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const tournamentId = searchParams.get("tournamentId")

    const allowed =
      isAdminEmail(session.user.email) ||
      (tournamentId
        ? await canManageTournament(session.user.email, tournamentId)
        : true)

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

    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Formato non supportato" }, { status: 400 })
    }

    if (file.size > 8 * 1024 * 1024) {
      return NextResponse.json({ error: "File troppo grande (max 8 MB)" }, { status: 400 })
    }

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_")
    const blob = await put(`tournament-covers/${Date.now()}-${safeName}`, file, {
      access: "public",
    })

    return NextResponse.json({ url: blob.url })
  } catch (err) {
    console.error("[tournament-cover upload]", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Errore durante l'upload" },
      { status: 500 },
    )
  }
}
