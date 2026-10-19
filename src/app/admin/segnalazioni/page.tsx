export const dynamic = "force-dynamic"

/* eslint-disable @next/next/no-img-element -- user photos from Blob, any size */
import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { getCurrentSession } from "@/lib/getCurrentPlayer"
import { isAdminEmail } from "@/lib/isAdmin"
import { db } from "@/lib/db"
import { formatWhen } from "@/lib/datetime"
import { PLAY_AGAIN_FLAG_NOS } from "@/lib/scopri/playAgain"
import { flaggedByVotes } from "@/lib/scopri/playAgainServer"
import { PageHeader } from "@/components/layout/PageHeader"
import { ModerationButton } from "@/components/admin/ScopriModeration"

export const metadata: Metadata = { title: "Moderazione Scopri — Admin" }

const REASON: Record<string, string> = {
  FINTO: "Profilo finto",
  FOTO: "Foto non adatta",
  OFFENSIVO: "Messaggi offensivi",
  MOLESTIE: "Molestie",
  MINORENNE: "Sembra minorenne",
  ALTRO: "Altro",
}

function daysAgo(days: number): Date {
  return new Date(Date.now() - days * 86_400_000)
}

function H2({ children, count }: { children: React.ReactNode; count?: number }) {
  return (
    <h2 className="mb-2 mt-6 font-display text-2xl font-extrabold text-white">
      {children} {typeof count === "number" && <span className="text-[var(--muted-text)]">{count}</span>}
    </h2>
  )
}

/** Scopri moderation: open reports, photos to check, "non rigiocherei", suspended. */
export default async function AdminReportsPage() {
  const session = await getCurrentSession()
  if (!session?.user?.id) redirect("/auth/signin?callbackUrl=/admin/segnalazioni")
  if (!isAdminEmail(session.user.email)) redirect("/")

  const weekAgo = daysAgo(7)
  const [reports, photos, flagged, suspended] = await Promise.all([
    db.playerBlock.findMany({
      where: { reported: true, reviewedAt: null },
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true,
        reason: true,
        note: true,
        createdAt: true,
        blocker: { select: { name: true } },
        blocked: { select: { id: true, name: true, discoverProfile: { select: { suspendedAt: true } } } },
      },
    }),
    db.playerPhoto.findMany({
      where: { hiddenAt: null, OR: [{ reportedAt: { not: null } }, { createdAt: { gte: weekAgo } }] },
      orderBy: [{ reportedAt: { sort: "desc", nulls: "last" } }, { createdAt: "desc" }],
      take: 60,
      select: { id: true, url: true, reportedAt: true, createdAt: true, player: { select: { name: true } } },
    }),
    flaggedByVotes(PLAY_AGAIN_FLAG_NOS),
    db.discoverProfile.findMany({
      where: { suspendedAt: { not: null } },
      orderBy: { suspendedAt: "desc" },
      take: 50,
      select: { playerId: true, suspendedAt: true, suspendedReason: true, player: { select: { name: true } } },
    }),
  ])
  const counts = new Map<string, number>()
  for (const r of reports) counts.set(r.blocked.id, (counts.get(r.blocked.id) ?? 0) + 1)

  return (
    <div className="pb-10">
      <PageHeader eyebrow="Admin" title="Moderazione Scopri" backHref="/profile?tab=admin" />
      <div className="px-4">
        <H2 count={reports.length}>Segnalazioni aperte</H2>
        {reports.length === 0 ? (
          <p className="rounded-[var(--radius-md)] bg-[var(--surface-2)] p-4 text-base text-[var(--muted-text)]">Nessuna segnalazione aperta.</p>
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
                <p className="mt-1 text-xs text-[var(--muted-text)]">da {r.blocker.name} · {formatWhen(r.createdAt)}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {!r.blocked.discoverProfile?.suspendedAt && (
                    <ModerationButton action={{ kind: "suspend", playerId: r.blocked.id, reason: REASON[r.reason ?? ""] ?? "Segnalazione" }} />
                  )}
                  <ModerationButton action={{ kind: "close", reportId: r.id }} />
                </div>
              </li>
            ))}
          </ul>
        )}

        <H2 count={photos.length}>Foto da controllare</H2>
        <p className="mb-2 text-sm text-[var(--muted-text)]">Prima quelle segnalate, poi le nuove degli ultimi 7 giorni.</p>
        {photos.length === 0 ? (
          <p className="rounded-[var(--radius-md)] bg-[var(--surface-2)] p-4 text-base text-[var(--muted-text)]">Niente da controllare.</p>
        ) : (
          <ul className="grid grid-cols-2 gap-2">
            {photos.map((p) => (
              <li key={p.id} className="overflow-hidden rounded-[var(--radius-md)] bg-[var(--surface-2)]">
                <img src={p.url} alt={`Foto di ${p.player.name}`} className="aspect-[3/4] w-full object-cover" />
                <div className="p-2">
                  <p className="truncate text-sm font-bold text-white">{p.player.name}</p>
                  <p className={p.reportedAt ? "text-xs font-bold text-[var(--danger)]" : "text-xs text-[var(--muted-text)]"}>
                    {p.reportedAt ? "Segnalata" : formatWhen(p.createdAt)}
                  </p>
                  <div className="mt-2 flex flex-col gap-1">
                    <ModerationButton action={{ kind: "hidePhoto", photoId: p.id }} />
                    {p.reportedAt && <ModerationButton action={{ kind: "keepPhoto", photoId: p.id }} />}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}

        <H2 count={flagged.length}>Tanti &quot;non rigiocherei&quot;</H2>
        <p className="mb-2 text-sm text-[var(--muted-text)]">Almeno {PLAY_AGAIN_FLAG_NOS} persone diverse negli ultimi 30 giorni.</p>
        {flagged.length === 0 ? (
          <p className="rounded-[var(--radius-md)] bg-[var(--surface-2)] p-4 text-base text-[var(--muted-text)]">Nessuno.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {flagged.map((f) => (
              <li key={f.id} className="flex items-center justify-between gap-2 rounded-[var(--radius-md)] bg-[var(--surface-2)] p-4">
                <span>
                  <span className="block text-base font-extrabold text-white">{f.name}</span>
                  <span className="block text-sm text-[var(--muted-text)]">{f.noVotes} &quot;non rigiocherei&quot;</span>
                </span>
                <ModerationButton action={{ kind: "suspend", playerId: f.id, reason: "Molti non rigiocherei" }} />
              </li>
            ))}
          </ul>
        )}

        <H2 count={suspended.length}>Sospesi</H2>
        {suspended.length === 0 ? (
          <p className="rounded-[var(--radius-md)] bg-[var(--surface-2)] p-4 text-base text-[var(--muted-text)]">Nessuno.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {suspended.map((s) => (
              <li key={s.playerId} className="flex items-center justify-between gap-2 rounded-[var(--radius-md)] bg-[var(--surface-2)] p-4">
                <span>
                  <span className="block text-base font-extrabold text-white">{s.player.name}</span>
                  <span className="block text-sm text-[var(--muted-text)]">
                    {s.suspendedReason} · {s.suspendedAt ? formatWhen(s.suspendedAt) : ""}
                  </span>
                </span>
                <ModerationButton action={{ kind: "unsuspend", playerId: s.playerId }} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
