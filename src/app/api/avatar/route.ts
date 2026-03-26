import { put } from "@vercel/blob"
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autenticato" }, { status: 401 })
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    // Token not configured — skip upload gracefully
    return NextResponse.json({ url: null })
  }

  const formData = await req.formData()
  const file = formData.get("file") as File | null
  if (!file) {
    return NextResponse.json({ error: "Nessun file" }, { status: 400 })
  }

  const blob = await put(`avatars/${session.user.id}/${Date.now()}`, file, {
    access: "public",
  })

  return NextResponse.json({ url: blob.url })
}
