export const dynamic = "force-dynamic"

import type { Metadata } from "next"
import Link from "next/link"
import { getLocationLeaderboards, getCityLeaderboards } from "@/actions/territories"
import { BagniView } from "@/components/territories/BagniView"
import { CityBoards } from "@/components/territories/CityBoards"
import { PageHeader } from "@/components/layout/PageHeader"
import { SectionTabs, RANK_TABS } from "@/components/layout/SectionTabs"

export const metadata: Metadata = {
  title: "Re dei Bagni — SANDER Beach Volley",
  description:
    "Chi comanda su ogni campo? Le classifiche territoriali dei bagni: conquista il tuo spot e diventa il Re del Bagno.",
  openGraph: {
    title: "Re dei Bagni 👑🏐",
    description: "Conquista il tuo campo. Diventa il Re del Bagno su SANDER.",
  },
}

export default async function TerritoriesPage() {
  const [territories, cityBoards] = await Promise.all([
    getLocationLeaderboards(),
    getCityLeaderboards(),
  ])

  return (
    <div className="pb-10">
      <PageHeader
        eyebrow="Classifiche"
        tone="sand"
        title="Re dei Bagni"
        subtitle="Chi vince di più su un bagno lo conquista"
      />
      <SectionTabs items={RANK_TABS} active="bagni" tone="compete" className="pb-4" />

      <CityBoards boards={cityBoards} />

      <BagniView territories={territories} />

      {/* CTA */}
      <div className="mt-6 px-4">
        <Link
          href="/sessions/new"
          className="flex min-h-[3.5rem] w-full items-center justify-center gap-2 rounded-2xl font-black text-black"
          style={{ background: "var(--accent)" }}
        >
          Crea una partita e conquista un bagno
        </Link>
      </div>
    </div>
  )
}
