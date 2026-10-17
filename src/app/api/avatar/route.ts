import { put } from "@vercel/blob"
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { imageExtension, verifiedImageType } from "@/lib/imageUpload"

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autenticato" }, { status: 401 })
  }

  const formData = await req.formData()
  const file = formData.get("file") as File | null
  if (!file) {
    return NextResponse.json({ error: "Nessun file" }, { status: 400 })
  }

  // Checked from the file's bytes, before anything else: the declared type is
  // whatever the client says.
  const type = await verifiedImageType(file)
  if (!type) {
    return NextResponse.json({ error: "Formato non supportato: usa JPG, PNG o WebP" }, { status: 400 })
  }
  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: "Foto troppo grande (max 5 MB)" }, { status: 400 })
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    // Token not configured — skip upload gracefully
    return NextResponse.json({ url: null })
  }

  const blob = await put(`avatars/${session.user.id}/${Date.now()}.${imageExtension(type)}`, file, {
    access: "public",
    contentType: type,
  })

  return NextResponse.json({ url: blob.url })
}
