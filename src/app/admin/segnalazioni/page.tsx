export const dynamic = "force-dynamic"

import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { getCurrentSession } from "@/lib/getCurrentPlayer"
import { isAdminEmail } from "@/lib/isAdmin"
import { db } from "@/lib/db"
import { formatWhen } from "@/lib/datetime"
import { PageHeader } from "@/components/layout/PageHeader"

export const metadata: Metadata = { title: "Segnalazioni Scopri — Admin" }

const REASON: Record<string, string> = {
  FINTO: "Profilo finto",
  OFFENSIVO: "Messaggi offensivi",
  MOLESTIE: "Molestie",
  MINORENNE: "Sembra minorenne",
  ALTRO: "Altro",
}

/** Reports from Scopri, newest first, with how often each player was reported. */
export default async function AdminReportsPage() {
  const session = await getCurrentSession()
  if (!session?.user?.id) redirect("/auth/signin?callbackUrl=/admin/segnalazioni")
  if (!isAdminEmail(session.user.email)) redirect("/")

  const reports = await db.playerBlock.findMany({
    where: { reported: true },
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      reason: true,
      note: true,
      createdAt: true,
      blocker: { select: { name: true } },
      blocked: { select: { id: true, name: true } },
    },
  })
  const counts = new Map<string, number>()
  for (const r of reports) counts.set(r.blocked.id, (counts.get(r.blocked.id) ?? 0) + 1)

  return (
    <div className="pb-10">
      <PageHeader eyebrow="Admin" title="Segnalazioni" backHref="/profile?tab=admin" />
      <div className="px-4">
        {reports.length === 0 ? (
          <p className="rounded-[var(--radius-md)] bg-[var(--surface-2)] p-4 text-base text-[var(--muted-text)]">Nessuna segnalazione.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {reports.map((r) => (
              <li key={r.id} className="rounded-[var(--radius-md)] bg-[var(--surface-2)] p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-base font-extrabold text-white">{r.blocked.name}</p>
                  {(counts.get(r.blocked.id) ?? 0) > 1 && (
                    <span className="rounded-full bg-[var(--danger)] px-2 py-0.5 text-xs font-extrabold text-white">
                      {counts.get(r.blocked.id)} segnalazioni
                    </span>
                  )}
                </div>
                <p className="text-sm text-[var(--accent)]">{REASON[r.reason ?? ""] ?? r.reason}</p>
                {r.note && <p className="mt-1 text-base text-white">{r.note}</p>}
                <p className="mt-1 text-xs text-[var(--muted-text)]">
                  da {r.blocker.name} · {formatWhen(r.createdAt)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
