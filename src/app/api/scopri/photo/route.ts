import { put } from "@vercel/blob"
import { NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { imageExtension, verifiedImageType } from "@/lib/imageUpload"
import { MAX_PHOTOS } from "@/lib/scopri/rules"
import { markReadyIfComplete } from "@/lib/scopri/server"

/** Add a photo to the signed-in player's Scopri card (up to MAX_PHOTOS). */
export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autenticato" }, { status: 401 })
  }
  const player = await db.player.findUnique({ where: { userId: session.user.id }, select: { id: true } })
  if (!player) return NextResponse.json({ error: "Profilo non trovato" }, { status: 404 })

  const count = await db.playerPhoto.count({ where: { playerId: player.id } })
  if (count >= MAX_PHOTOS) {
    return NextResponse.json({ error: `Al massimo ${MAX_PHOTOS} foto: togline una` }, { status: 400 })
  }

  const formData = await req.formData()
  const file = formData.get("file") as File | null
  if (!file) return NextResponse.json({ error: "Nessun file" }, { status: 400 })

  // Checked from the file's bytes: the declared type is whatever the client says.
  const type = await verifiedImageType(file)
  if (!type) {
    return NextResponse.json({ error: "Formato non supportato: usa JPG, PNG o WebP" }, { status: 400 })
  }
  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: "Foto troppo grande (max 5 MB)" }, { status: 400 })
  }
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json({ error: "Caricamento foto non disponibile al momento" }, { status: 503 })
  }

  const blob = await put(`scopri/${session.user.id}/${Date.now()}.${imageExtension(type)}`, file, {
    access: "public",
    contentType: type,
  })
  const photo = await db.playerPhoto.create({
    data: { playerId: player.id, url: blob.url, position: count },
    select: { id: true, url: true, position: true },
  })
  await markReadyIfComplete(player.id)
  revalidatePath("/scopri/profilo")
  return NextResponse.json({ photo })
}
