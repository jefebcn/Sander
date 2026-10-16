import { put } from "@vercel/blob"
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { isAdminEmail, canManageTournament } from "@/lib/isAdmin"
import { imageExtension, verifiedImageType } from "@/lib/imageUpload"

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

    const formData = await req.formData()
    const file = formData.get("file") as File | null
    if (!file) {
      return NextResponse.json({ error: "Nessun file" }, { status: 400 })
    }

    // Checked from the file's bytes: the declared type is whatever the client says.
    const type = await verifiedImageType(file)
    if (!type) {
      return NextResponse.json({ error: "Formato non supportato: usa JPG, PNG o WebP" }, { status: 400 })
    }

    if (file.size > 8 * 1024 * 1024) {
      return NextResponse.json({ error: "File troppo grande (max 8 MB)" }, { status: 400 })
    }

    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return NextResponse.json({ url: null })
    }

    // Name and content type come from the checked type, never from the client's
    // file name, so a "cover.html" can't be served as a page.
    const blob = await put(`tournament-covers/${Date.now()}.${imageExtension(type)}`, file, {
      access: "public",
      contentType: type,
    })

    return NextResponse.json({ url: blob.url })
  } catch (err) {
    console.error("[tournament-cover upload]", err)
    return NextResponse.json(
      { error: "Errore durante l'upload. Riprova." },
      { status: 500 },
    )
  }
}
