import { put } from "@vercel/blob"
import { randomUUID } from "crypto"
import { NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { dayKey } from "@/lib/datetime"
import { romeDayStart } from "@/lib/romeMonth"
import { imageExtension, verifiedImageType } from "@/lib/imageUpload"
import { gestureFor, SELFIE_ATTEMPTS_PER_DAY } from "@/lib/scopri/selfie"
import { notifyAdmins } from "@/lib/adminNotify"

/** A live selfie with today's gesture, queued for an admin to compare with the photos. */
export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Non autenticato" }, { status: 401 })
  const player = await db.player.findUnique({
    where: { userId: session.user.id },
    select: {
      id: true,
      firstName: true,
      name: true,
      discoverProfile: { select: { photoVerifiedAt: true } },
      _count: { select: { discoverPhotos: { where: { hiddenAt: null } } } },
    },
  })
  if (!player) return NextResponse.json({ error: "Profilo non trovato" }, { status: 404 })
  if (player.discoverProfile?.photoVerifiedAt) return NextResponse.json({ error: "Le tue foto sono già verificate" }, { status: 400 })
  if (player._count.discoverPhotos === 0) {
    return NextResponse.json({ error: "Aggiungi prima almeno una foto al profilo Scopri" }, { status: 400 })
  }

  const now = new Date()
  const [pending, today] = await Promise.all([
    db.selfieCheck.count({ where: { playerId: player.id, status: "PENDING" } }),
    db.selfieCheck.count({ where: { playerId: player.id, createdAt: { gte: romeDayStart(now) } } }),
  ])
  if (pending > 0) return NextResponse.json({ error: "Hai già un selfie in verifica" }, { status: 400 })
  if (today >= SELFIE_ATTEMPTS_PER_DAY) return NextResponse.json({ error: "Per oggi basta così: riprova domani" }, { status: 429 })

  const formData = await req.formData()
  const file = formData.get("file") as File | null
  if (!file) return NextResponse.json({ error: "Nessun file" }, { status: 400 })
  const type = await verifiedImageType(file)
  if (!type) return NextResponse.json({ error: "Formato non supportato: usa JPG, PNG o WebP" }, { status: 400 })
  if (file.size > 5 * 1024 * 1024) return NextResponse.json({ error: "Foto troppo grande (max 5 MB)" }, { status: 400 })
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json({ error: "Caricamento non disponibile al momento" }, { status: 503 })
  }

  // Unguessable path: the selfie is public on the blob store until it's decided.
  const blob = await put(`selfies/${randomUUID()}.${imageExtension(type)}`, file, { access: "public", contentType: type })
  await db.selfieCheck.create({
    data: { playerId: player.id, imageUrl: blob.url, gesture: gestureFor(player.id, dayKey(now)).key },
  })
  await notifyAdmins({
    title: "Nuova verifica foto",
    body: `${player.firstName ?? player.name} ha inviato un selfie da controllare`,
    url: "/admin/segnalazioni",
  })
  revalidatePath("/scopri/profilo")
  return NextResponse.json({ ok: true })
}
