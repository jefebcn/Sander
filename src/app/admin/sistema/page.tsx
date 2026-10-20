export const dynamic = "force-dynamic"

import Link from "next/link"
import { redirect } from "next/navigation"
import { ChevronLeft, Bug, ImageDown, Monitor, Server } from "lucide-react"
import type { ReactNode } from "react"
import { db } from "@/lib/db"
import { getCurrentSession } from "@/lib/getCurrentPlayer"
import { isAdminEmail } from "@/lib/isAdmin"
import { formatDate } from "@/lib/utils"
import { RecompressPhotosButton } from "@/components/admin/RecompressPhotosButton"
import { DismissErrorButton } from "@/components/admin/DismissErrorButton"

function Section({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl bg-[var(--surface-1)] p-4">
      <div className="mb-3 flex items-center gap-2">
        {icon}
        <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--accent)]">{title}</h2>
      </div>
      {children}
    </section>
  )
}

export default async function AdminSystemPage() {
  const session = await getCurrentSession()
  if (!session?.user?.id) redirect("/auth/signin?callbackUrl=/admin/sistema")
  if (!isAdminEmail(session.user.email)) redirect("/")

  const errors = await db.appError.findMany({ orderBy: { lastSeenAt: "desc" }, take: 50 })

  return (
    <div className="min-h-dvh pb-10">
      <div
        className="flex items-center gap-3 px-4 pt-6 pb-3"
        style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 1.5rem)" }}
      >
        <Link
          href="/admin"
          aria-label="Indietro"
          className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--surface-2)] text-white active:bg-[var(--surface-3)]"
        >
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-xl font-black text-white">Sistema</h1>
      </div>

      <div className="space-y-4 px-4">
        <Section icon={<Bug className="h-4 w-4 text-[var(--accent)]" />} title="Errori dell'app">
          {errors.length === 0 ? (
            <p className="text-base text-[var(--muted-text)]">Nessun errore. Quando qualcosa si rompe per qualcuno lo trovi qui, e ti arriva una notifica.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {errors.map((e) => (
                <li key={e.id} className="flex items-start gap-3 rounded-xl bg-[var(--surface-2)] p-3">
                  {e.source === "server" ? (
                    <Server className="mt-0.5 h-5 w-5 shrink-0 text-[var(--danger)]" aria-label="Server" />
                  ) : (
                    <Monitor className="mt-0.5 h-5 w-5 shrink-0 text-[var(--accent)]" aria-label="Browser" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="break-words text-base font-bold text-white">{e.message}</p>
                    {e.path && <p className="break-all text-sm text-[var(--muted-text)]">{e.path}</p>}
                    <p className="text-sm text-[var(--muted-text)]">
                      {e.count === 1 ? "1 volta" : `${e.count} volte`} · ultima {formatDate(e.lastSeenAt)}
                      {e.digest && ` · digest ${e.digest}`}
                    </p>
                    {e.stack && (
                      <details className="mt-1">
                        <summary className="cursor-pointer text-sm font-bold text-[var(--accent)]">Dettagli</summary>
                        <pre className="mt-1 max-h-48 overflow-auto whitespace-pre-wrap break-all rounded-lg bg-black/40 p-2 text-xs text-[var(--muted-text)]">{e.stack}</pre>
                      </details>
                    )}
                  </div>
                  <DismissErrorButton id={e.id} />
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Section icon={<ImageDown className="h-4 w-4 text-[var(--accent)]" />} title="Foto vecchie">
          <p className="mb-3 text-base text-[var(--muted-text)]">
            Le foto caricate prima di oggi sono originali da 2–4 MB. Questo le ricomprime (lato lungo 1600 px, WebP),
            aggiorna profili, foto Scopri, copertine e loghi, poi cancella gli originali. Le foto piccole restano come sono.
          </p>
          <RecompressPhotosButton />
        </Section>
      </div>
    </div>
  )
}
