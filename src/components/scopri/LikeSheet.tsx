"use client"

/* eslint-disable @next/next/no-img-element -- user photos from Blob, any size */
import { useState } from "react"
import { Heart, Crown, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Sheet } from "@/components/ui/Sheet"
import { sendLike } from "@/actions/scopri"
import { COMMENT_MAX, FREE_LIKES_PER_DAY } from "@/lib/scopri/rules"
import { ExtrasSheet } from "./ExtrasSheet"
import type { Allowance, LikeTarget, ScopriCard } from "./types"

export type LikeResult = Awaited<ReturnType<typeof sendLike>>

/**
 * The like, said properly: what you liked, an optional line to start the
 * chat, and the choice of sending it as this week's Ace.
 */
export function LikeSheet({
  card,
  target,
  allowance,
  onClose,
  onSent,
  onAllowance,
}: {
  card: ScopriCard
  target: LikeTarget | null
  allowance: Allowance
  onClose: () => void
  onSent: (result: LikeResult) => void
  onAllowance: (a: Allowance) => void
}) {
  const [comment, setComment] = useState("")
  const [busy, setBusy] = useState<"like" | "ace" | null>(null)
  const [extras, setExtras] = useState<null | ("likes" | "ace")[]>(null)
  const open = target !== null
  const noLikes = allowance.likes.total === 0

  async function send(ace: boolean) {
    if (!target) return
    setBusy(ace ? "ace" : "like")
    try {
      const res = await sendLike({
        toId: card.id,
        target: target.kind,
        targetId: target.kind === "PROFILE" ? undefined : target.id,
        comment: comment.trim() || undefined,
        ace,
      })
      setComment("")
      onSent(res)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Like non inviato")
    } finally {
      setBusy(null)
    }
  }

  return (
    <>
      <Sheet
        open={open}
        onOpenChange={(o) => !o && onClose()}
        title={`Un like a ${card.name}`}
        description="Scrivi qualcosa: chi riceve un commento risponde molto più spesso."
      >
        {target?.kind === "PHOTO" && (
          <img src={target.url} alt="" className="mb-4 aspect-[4/3] w-full rounded-[var(--radius-md)] object-cover" />
        )}
        {target?.kind === "PROMPT" && (
          <div className="mb-4 rounded-[var(--radius-md)] bg-[var(--surface-2)] p-4">
            <p className="text-sm font-bold text-[var(--muted-text)]">{target.question}</p>
            <p className="mt-1 font-serif text-2xl leading-tight text-white">{target.answer}</p>
          </div>
        )}
        <label htmlFor="like-comment" className="sr-only">Commento</label>
        <textarea
          id="like-comment"
          value={comment}
          onChange={(e) => setComment(e.target.value.slice(0, COMMENT_MAX))}
          rows={3}
          placeholder="Es. «Anch'io gioco a Riccione la sera, ci stai sabato?»"
          className="w-full resize-none rounded-[var(--radius-md)] bg-[var(--surface-2)] p-4 text-base text-white placeholder:text-[var(--muted-text)] outline-none ring-1 ring-[var(--border)] focus:ring-[var(--accent)]"
        />
        <p className="mt-1 text-right text-xs text-[var(--muted-text)]">{comment.length}/{COMMENT_MAX}</p>

        {noLikes ? (
          <div className="mt-3 rounded-[var(--radius-md)] bg-[var(--surface-2)] p-4 text-center">
            <p className="text-base font-bold text-white">Hai usato gli {FREE_LIKES_PER_DAY} like di oggi</p>
            <p className="text-sm text-[var(--muted-text)]">A mezzanotte ne arrivano altri {FREE_LIKES_PER_DAY}. Pochi like, match migliori.</p>
            <button
              type="button"
              onClick={() => setExtras(["likes"])}
              className="pressable mt-3 flex min-h-[3.5rem] w-full items-center justify-center rounded-full bg-[var(--surface-4)] text-base font-extrabold text-white"
            >
              Prendi altri like con gli SC
            </button>
          </div>
        ) : (
          <button
            type="button"
            disabled={busy !== null}
            onClick={() => send(false)}
            className="pressable mt-3 flex min-h-[3.75rem] w-full items-center justify-center gap-2 rounded-full bg-[var(--accent)] text-lg font-extrabold text-black shadow-[var(--shadow-glow)] disabled:opacity-60"
          >
            {busy === "like" ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> : <Heart className="h-5 w-5" strokeWidth={2.75} aria-hidden="true" />}
            Manda like
            <span className="text-sm font-bold opacity-70">· {allowance.likes.total} rimasti</span>
          </button>
        )}

        <button
          type="button"
          disabled={busy !== null}
          onClick={() => (allowance.aces > 0 ? send(true) : setExtras(["ace"]))}
          className="pressable mt-2 flex min-h-[3.5rem] w-full items-center justify-center gap-2 rounded-full bg-[color-mix(in_srgb,var(--ace)_16%,transparent)] text-base font-extrabold text-[var(--ace)] ring-1 ring-[color-mix(in_srgb,var(--ace)_40%,transparent)] disabled:opacity-60"
        >
          {busy === "ace" ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> : <Crown className="h-5 w-5" aria-hidden="true" />}
          {allowance.aces > 0 ? `Manda come Ace · ne hai ${allowance.aces}` : "Prendi un Ace"}
        </button>
        <p className="mt-2 text-center text-sm text-[var(--muted-text)]">
          L&apos;Ace finisce in cima alla sua lista. Uno gratis ogni settimana.
        </p>
      </Sheet>
      <ExtrasSheet open={extras !== null} onOpenChange={(o) => !o && setExtras(null)} only={extras ?? undefined} onBought={onAllowance} />
    </>
  )
}
