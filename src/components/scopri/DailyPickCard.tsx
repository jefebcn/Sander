"use client"

/* eslint-disable @next/next/no-img-element -- user photos from Blob, any size */
import { useState } from "react"
import { Sparkles, Check } from "lucide-react"
import { toast } from "sonner"
import { Sheet } from "@/components/ui/Sheet"
import { ProfileCard } from "./ProfileCard"
import { LikeSheet, type LikeResult } from "./LikeSheet"
import { MatchOverlay } from "./MatchOverlay"
import type { Allowance, LikeTarget, ScopriCard } from "./types"

/**
 * "Il più compatibile di oggi": one person a day, from a stable pairing of
 * everyone on Scopri, so the pick is likely to pick you back.
 */
export function DailyPickCard({
  card,
  seen: initialSeen,
  allowance: initialAllowance,
  myPhoto,
}: {
  card: ScopriCard
  seen: boolean
  allowance: Allowance
  myPhoto: string | null
}) {
  const [open, setOpen] = useState(false)
  const [seen, setSeen] = useState(initialSeen)
  const [target, setTarget] = useState<LikeTarget | null>(null)
  const [allowance, setAllowance] = useState(initialAllowance)
  const [match, setMatch] = useState<{ name: string; photo: string | null; threadId: string } | null>(null)
  const photo = card.photos[0]?.url ?? null

  function onSent(res: LikeResult) {
    setTarget(null)
    setOpen(false)
    setSeen(true)
    if (res.matched) setMatch({ name: res.name, photo: res.photo ?? null, threadId: res.threadId })
    else {
      setAllowance(res.allowance)
      toast.success(`Like mandato a ${card.name}`)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="pressable relative flex w-full items-center gap-4 overflow-hidden rounded-[var(--radius-lg)] p-3 pr-4 text-left shadow-[var(--shadow-card)]"
        style={{ background: "linear-gradient(120deg, color-mix(in srgb, var(--ace) 22%, var(--surface-2)), var(--surface-2) 60%)" }}
      >
        <span className="film relative h-24 w-20 shrink-0 overflow-hidden rounded-[var(--radius-md)] bg-[var(--surface-4)] ring-2 ring-[var(--ace)]">
          {photo && <img src={photo} alt="" className="h-full w-full object-cover" />}
        </span>
        <span className="min-w-0 flex-1">
          <span className="eyebrow flex items-center gap-1 text-[var(--ace)]">
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" /> Il più compatibile di oggi
          </span>
          <span className="mt-1 block font-display text-2xl font-extrabold leading-tight text-white">
            {card.name}
            {card.age !== null && <span className="font-serif font-normal text-[var(--muted-text)]">, {card.age}</span>}
          </span>
          <span className="block truncate text-sm text-[var(--muted-text)]">
            {(card.reasons ?? []).slice(0, 2).join(" · ") || card.homeCity}
          </span>
        </span>
        {seen ? (
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--surface-4)] text-[var(--success)]" aria-label="Già visto">
            <Check className="h-5 w-5" aria-hidden="true" />
          </span>
        ) : (
          <span className="num shrink-0 text-2xl text-[var(--ace)]">{card.score ?? 0}%</span>
        )}
      </button>

      <Sheet open={open} onOpenChange={setOpen} title="Il più compatibile di oggi" description="Calcolato su tutti i giocatori di Scopri: è probabile che anche tu piaccia a lui o a lei.">
        <ProfileCard card={card} onLike={seen ? undefined : (t) => setTarget(t)} />
      </Sheet>
      <LikeSheet card={card} target={target} allowance={allowance} onClose={() => setTarget(null)} onSent={onSent} onAllowance={setAllowance} />
      {match && <MatchOverlay {...match} myPhoto={myPhoto} onClose={() => setMatch(null)} />}
    </>
  )
}
