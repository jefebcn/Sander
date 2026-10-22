export const dynamic = "force-dynamic"

import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { Banknote, Bug, ChartColumn, ChevronRight, Coins, ShieldCheck, TrendingUp, type LucideIcon } from "lucide-react"
import { getCurrentSession } from "@/lib/getCurrentPlayer"
import { isAdminEmail } from "@/lib/isAdmin"
import { db } from "@/lib/db"
import { PageHeader } from "@/components/layout/PageHeader"

export const metadata: Metadata = { title: "Admin — SANDER" }

interface Section {
  href: string
  icon: LucideIcon
  color: string
  title: string
  hint: string
  /** Things waiting for the admin; shown as a badge when above zero. */
  pending?: number
}

/** One address for every admin page, with what is waiting on each. */
export default async function AdminHomePage() {
  const session = await getCurrentSession()
  if (!session?.user?.id) redirect("/auth/signin?callbackUrl=/admin")
  if (!isAdminEmail(session.user.email)) redirect("/admin/accesso")

  const [openReports, errors] = await Promise.all([
    db.playerBlock.count({ where: { reported: true, reviewedAt: null } }),
    db.appError.count(),
  ])

  const sections: Section[] = [
    { href: "/admin/investitori", icon: TrendingUp, color: "var(--accent)", title: "Numeri per investitori", hint: "Crescita, attivi, incassi, comuni: pronti da mostrare" },
    { href: "/admin/metriche", icon: ChartColumn, color: "var(--accent)", title: "Metriche", hint: "Iscritti, incassi, Scopri, chi torna a giocare" },
    { href: "/admin/segnalazioni", icon: ShieldCheck, color: "var(--danger)", title: "Moderazione Scopri", hint: "Segnalazioni, foto, sospensioni", pending: openReports },
    { href: "/admin/payments", icon: Banknote, color: "var(--accent)", title: "Pagamenti in attesa", hint: "Conferma o rifiuta i pagamenti in contanti" },
    { href: "/admin/sistema", icon: Bug, color: "var(--accent)", title: "Sistema", hint: "Errori dell'app, pulizia foto", pending: errors },
    { href: "/profile?tab=admin", icon: Coins, color: "var(--accent)", title: "Crediti, stagioni, contenuti", hint: "SanderCredits, sessioni, tornei, giocatori" },
  ]

  return (
    <div className="min-h-dvh pb-10">
      <PageHeader eyebrow="Admin" title="Pannello admin" backHref="/profile" />
      <div className="flex flex-col gap-2 px-4 lg:grid lg:grid-cols-2 lg:gap-3">
        {sections.map(({ href, icon: Icon, color, title, hint, pending }) => (
          <Link
            key={href}
            href={href}
            className="flex min-h-[3.5rem] items-center gap-3 rounded-2xl bg-[var(--surface-2)] px-4 py-3 active:bg-[var(--surface-3)]"
          >
            <Icon className="h-5 w-5 shrink-0" style={{ color }} />
            <span className="flex-1">
              <span className="block text-base font-bold text-white">{title}</span>
              <span className="block text-sm text-[var(--muted-text)]">{hint}</span>
            </span>
            {!!pending && (
              <span className="rounded-full bg-[var(--danger)] px-2.5 py-0.5 text-sm font-black text-white">{pending}</span>
            )}
            <ChevronRight className="h-5 w-5 text-[var(--muted-text)]" />
          </Link>
        ))}
      </div>
    </div>
  )
}
