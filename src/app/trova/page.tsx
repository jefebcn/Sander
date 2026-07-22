export const dynamic = "force-dynamic"

import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { Users, Swords, Sparkles } from "lucide-react"
import { getCurrentPlayer } from "@/lib/getCurrentPlayer"
import { getPlayersAtMyLevel, type MatchMode } from "@/actions/matchmaking"
import { CompatibilityRing } from "@/components/matchmaking/CompatibilityRing"
import { MessageButton } from "@/components/chat/MessageButton"

export const metadata: Metadata = {
  title: "Trova giocatori al tuo livello — SANDER",
  description: "Trova compagni ideali e avversari alla pari in base al tuo rating.",
}

const ROLE_LABEL: Record<string, string> = { BLOCKER: "Muro", DEFENDER: "Difensore" }

function Avatar({ name, url }: { name: string; url: string | null }) {
  return (
    <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--surface-1)] text-xs font-black text-[var(--muted-text)]">
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt={name} className="h-full w-full object-cover" />
      ) : (
        name.slice(0, 2).toUpperCase()
      )}
    </div>
  )
}

interface Props {
  searchParams: Promise<{ mode?: string }>
}

export default async function FindPage({ searchParams }: Props) {
  const { mode: modeParam } = await searchParams
  const mode: MatchMode = modeParam === "opponent" ? "opponent" : "partner"

  const player = await getCurrentPlayer()
  if (!player) redirect("/auth/signin?callbackUrl=/trova")

  const { me, candidates } = await getPlayersAtMyLevel(player.id, mode)

  return (
    <div className="pb-10">
      {/* Header */}
      <div className="px-4 pt-6 pb-3">
        <h1 className="text-3xl font-black text-white">Trova giocatori</h1>
        {me && (
          <p className="mt-1 text-sm text-[var(--muted-text)]">
            Sei{" "}
            <span className="font-bold" style={{ color: me.division.color }}>
              {me.division.emoji} {me.division.name}
            </span>{" "}
            · {me.rating} rating · {ROLE_LABEL[me.role]}
          </p>
        )}
      </div>

      {/* Mode toggle */}
      <div className="flex gap-1 px-4 pb-4">
        <Link
          href="/trova"
          className="flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold transition-colors"
          style={
            mode === "partner"
              ? { background: "var(--accent)", color: "#000" }
              : { background: "var(--surface-2)", color: "var(--muted-text)" }
          }
        >
          <Users className="h-4 w-4" /> Compagni
        </Link>
        <Link
          href="/trova?mode=opponent"
          className="flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold transition-colors"
          style={
            mode === "opponent"
              ? { background: "var(--accent)", color: "#000" }
              : { background: "var(--surface-2)", color: "var(--muted-text)" }
          }
        >
          <Swords className="h-4 w-4" /> Avversari
        </Link>
      </div>

      {/* Explanation */}
      <div className="mx-4 mb-4 flex items-start gap-2 rounded-2xl bg-[var(--surface-2)] p-3">
        <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-[var(--accent)]" />
        <p className="text-xs text-[var(--muted-text)]">
          {mode === "partner"
            ? "Compagni ideali: livello simile e ruolo complementare (muro + difensore) per una coppia equilibrata."
            : "Avversari alla pari: giocatori vicini al tuo rating per partite tirate e combattute."}
        </p>
      </div>

      {/* Candidates */}
      {candidates.length === 0 ? (
        <div className="mx-4 rounded-2xl bg-[var(--surface-2)] p-8 text-center">
          <Users className="mx-auto mb-3 h-10 w-10 text-[var(--muted-text)] opacity-40" />
          <p className="font-bold text-white">Nessuno nel tuo range al momento</p>
          <p className="mt-1 text-sm text-[var(--muted-text)]">
            Gioca qualche partita: più giochi, più il tuo rating si affina e il match migliora.
          </p>
        </div>
      ) : (
        <div className="space-y-2 px-4">
          {candidates.map((c) => (
            <div
              key={c.id}
              className="flex items-center gap-3 rounded-2xl bg-[var(--surface-2)] px-4 py-3"
            >
              <Link href={`/players/${c.id}`} className="flex min-w-0 flex-1 items-center gap-3 active:opacity-80">
                <Avatar name={c.name} url={c.avatarUrl} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold text-white">{c.name}</p>
                  <div className="mt-0.5 flex items-center gap-2 text-xs text-[var(--muted-text)]">
                    <span className="font-bold" style={{ color: c.division.color }}>
                      {c.division.emoji} {c.division.name}
                    </span>
                    <span>{ROLE_LABEL[c.role]}</span>
                    <span>{c.rating}</span>
                  </div>
                </div>
                <div className="flex flex-col items-center gap-0.5">
                  <CompatibilityRing value={c.compatibility} />
                  <span className="text-[0.55rem] font-bold uppercase tracking-wider text-[var(--muted-text)]">
                    match
                  </span>
                </div>
              </Link>
              <MessageButton playerId={c.id} compact />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
