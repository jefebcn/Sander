export const dynamic = "force-dynamic"

import type { Metadata } from "next"
import Link from "next/link"
import { Crown } from "lucide-react"
import { getLocationLeaderboards } from "@/actions/territories"
import { BagniView } from "@/components/territories/BagniView"

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
  const territories = await getLocationLeaderboards()

  return (
    <div className="pb-10">
      {/* Header */}
      <div className="px-4 pt-6 pb-4">
        <div className="flex items-center gap-2">
          <Crown className="h-6 w-6 text-[var(--accent)]" />
          <h1 className="text-3xl font-black text-white">Re dei Bagni</h1>
        </div>
        <p className="mt-1 text-sm text-[var(--muted-text)]">
          Chi vince di più su un bagno lo conquista. Difendi il tuo spot 👑
        </p>
      </div>

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
