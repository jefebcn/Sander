export const dynamic = "force-dynamic"

import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { ShieldAlert } from "lucide-react"
import { getCurrentSession } from "@/lib/getCurrentPlayer"
import { isAdminEmail } from "@/lib/isAdmin"
import { AdminSignOut } from "./AdminSignOut"

export const metadata: Metadata = { title: "Accesso admin — SANDER" }

/**
 * Where admin pages send an account that isn't an admin. It used to be a
 * silent redirect home, which for an account without a player card meant the
 * profile setup: no hint of which account was signed in, no way to switch.
 */
export default async function AdminAccessPage() {
  const session = await getCurrentSession()
  if (!session?.user?.id) redirect("/auth/signin?callbackUrl=/admin")
  if (isAdminEmail(session.user.email)) redirect("/admin")

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-5 px-6 py-10">
      <ShieldAlert className="h-10 w-10 text-[var(--warning)]" aria-hidden="true" />
      <div>
        <h1 className="font-display text-3xl font-extrabold text-white">Questo account non è admin</h1>
        <p className="mt-2 text-base text-[var(--muted-text)]">
          Sei entrato come <strong className="text-white">{session.user.email ?? "un account senza email"}</strong>. Per
          aprire il pannello esci e accedi con l&apos;email admin.
        </p>
      </div>
      <AdminSignOut />
      <Link href="/" className="btn btn-secondary w-full">
        Torna all&apos;app
      </Link>
    </div>
  )
}
