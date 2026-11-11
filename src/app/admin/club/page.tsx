export const dynamic = "force-dynamic"

import Link from "next/link"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { getCurrentSession } from "@/lib/getCurrentPlayer"
import { isAdminEmail } from "@/lib/isAdmin"
import { formatDate } from "@/lib/utils"
import { PageHeader } from "@/components/layout/PageHeader"
import { ClubStatusButtons } from "@/components/club/ClubStatusButtons"
import { clubVerifyCode, SANDER_INSTAGRAM } from "@/lib/clubVerify"
import { instagramHandle } from "@/lib/club"

const LABEL = { PENDING: "Da approvare", APPROVED: "Attivo", REJECTED: "Rifiutato", SUSPENDED: "Sospeso" } as const

/** Admin: club requests to approve, and the clubs already on SANDER. */
export default async function AdminClubPage() {
  const session = await getCurrentSession()
  if (!session?.user?.id) redirect("/auth/signin?callbackUrl=/admin/club")
  if (!isAdminEmail(session.user.email)) redirect("/admin/accesso")

  const clubs = await db.club.findMany({
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    include: {
      members: { where: { role: "OWNER" }, select: { player: { select: { name: true, user: { select: { email: true } } } } } },
      _count: { select: { tournaments: true, followers: true } },
    },
  })
  const pending = clubs.filter((c) => c.status === "PENDING")
  const rest = clubs.filter((c) => c.status !== "PENDING")

  const card = (c: (typeof clubs)[number]) => (
    <li key={c.id} className="flex flex-col gap-3 rounded-2xl bg-[var(--surface-2)] p-4">
      <div>
        <Link href={`/c/${c.slug}`} className="text-base font-bold text-white underline-offset-2 hover:underline">{c.name}</Link>
        <p className="text-sm text-[var(--muted-text)]">
          {c.city} · {LABEL[c.status]} · richiesto il {formatDate(c.createdAt)}
        </p>
        <p className="text-sm text-[var(--muted-text)]">
          Referente: {c.members[0]?.player.name ?? "—"} {c.members[0]?.player.user?.email ? `(${c.members[0].player.user.email})` : ""}
        </p>
        {c.instagram && <p className="text-sm text-[var(--muted-text)]">Instagram: @{instagramHandle(c.instagram) ?? c.instagram}</p>}
        {c.status === "PENDING" && (
          <p className="mt-2 rounded-xl bg-[var(--surface-3)] px-3 py-2 text-sm text-white">
            Codice di verifica: <b className="select-all font-mono text-base text-[var(--accent)]">{clubVerifyCode(c.id)}</b>
            <span className="block text-[var(--muted-text)]">
              Approva quando questo codice arriva in DM a @{SANDER_INSTAGRAM}
              {c.instagram ? ` dal profilo @${instagramHandle(c.instagram) ?? c.instagram}` : " dal profilo del club (o dall'email ufficiale, se non ha Instagram)"}.
            </span>
          </p>
        )}
        <p className="text-sm text-[var(--muted-text)]">{c._count.tournaments} tornei · {c._count.followers} follower</p>
      </div>
      <ClubStatusButtons clubId={c.id} status={c.status} />
    </li>
  )

  return (
    <div className="pb-10">
      <PageHeader eyebrow="Admin" tone="compete" title="Club" backHref="/admin" />
      <div className="flex flex-col gap-5 px-4">
        <section className="flex flex-col gap-2">
          <h2 className="eyebrow text-[var(--accent)]">Da approvare · {pending.length}</h2>
          {pending.length === 0 ? (
            <p className="text-base text-[var(--muted-text)]">Nessuna richiesta in attesa.</p>
          ) : (
            <ul className="flex flex-col gap-2">{pending.map(card)}</ul>
          )}
          <p className="text-sm text-[var(--muted-text)]">
            Ogni richiesta ha il suo codice: la società lo vede nella pagina del club e te lo manda in DM su Instagram dal profilo del club. Approva solo se codice e profilo corrispondono.
          </p>
        </section>
        {rest.length > 0 && (
          <section className="flex flex-col gap-2">
            <h2 className="eyebrow text-[var(--muted-text)]">Tutti i club</h2>
            <ul className="flex flex-col gap-2">{rest.map(card)}</ul>
          </section>
        )}
      </div>
    </div>
  )
}
