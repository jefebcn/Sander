"use client"

/* eslint-disable @next/next/no-img-element -- user photos from Blob, any size */
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Crown, Heart, X, Eye, Loader2, Lock } from "lucide-react"
import { toast } from "sonner"
import { respondToLike } from "@/actions/scopri"
import { COMMENT_MAX } from "@/lib/scopri/rules"
import { ProfileCard } from "./ProfileCard"
import { MatchOverlay } from "./MatchOverlay"
import { ExtrasSheet } from "./ExtrasSheet"
import type { IncomingLike } from "./types"

/**
 * Everyone who liked you, Aces first. Free: one at a time, so each gets a
 * real look. With "Vedi tutti" (SC) the whole list opens for 24 hours.
 */
export function LikesYouView({
  likes,
  revealed,
  myPhoto,
}: {
  likes: IncomingLike[]
  revealed: boolean
  myPhoto: string | null
}) {
  const router = useRouter()
  const [list, setList] = useState(likes)
  const [openId, setOpenId] = useState<string | null>(revealed ? null : (likes[0]?.id ?? null))
  const [reply, setReply] = useState("")
  const [busy, setBusy] = useState<"yes" | "no" | null>(null)
  const [match, setMatch] = useState<{ name: string; photo: string | null; threadId: string } | null>(null)
  const [extras, setExtras] = useState(false)

  const current = list.find((l) => l.id === openId) ?? null

  async function respond(like: IncomingLike, accept: boolean) {
    setBusy(accept ? "yes" : "no")
    try {
      const res = await respondToLike({ fromId: like.card.id, accept, comment: accept ? reply.trim() || undefined : undefined })
      const rest = list.filter((l) => l.id !== like.id)
      setList(rest)
      setReply("")
      setOpenId(revealed ? null : (rest[0]?.id ?? null))
      if (res.matched) setMatch({ name: like.card.name, photo: like.card.photos[0]?.url ?? null, threadId: res.threadId })
      router.refresh()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Non riuscito")
    } finally {
      setBusy(null)
    }
  }

  if (list.length === 0) {
    return (
      <div className="rounded-[var(--radius-lg)] bg-[var(--surface-2)] px-6 py-12 text-center">
        <Heart className="mx-auto h-8 w-8 text-[var(--accent)]" aria-hidden="true" />
        <p className="mt-3 font-display text-2xl font-extrabold text-white">Ancora nessun like</p>
        <p className="mt-1 text-base text-[var(--muted-text)]">
          Un profilo con 6 foto e risposte che parlano di come giochi riceve molti più like.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {current ? (
        <section aria-label={`Like di ${current.card.name}`} className="flex flex-col gap-3">
          <LikeContext like={current} />
          <ProfileCard card={current.card} compact />
          <div className="sticky bottom-24 z-20 flex flex-col gap-2 rounded-[var(--radius-lg)] bg-[var(--surface-1)] p-3 shadow-[0_-8px_30px_-10px_rgb(0_0_0/0.8)] ring-1 ring-[var(--border)]">
            <label htmlFor="reply" className="sr-only">Rispondi con un messaggio</label>
            <input
              id="reply"
              value={reply}
              onChange={(e) => setReply(e.target.value.slice(0, COMMENT_MAX))}
              placeholder="Scrivi qualcosa per iniziare (facoltativo)"
              className="min-h-[3.5rem] rounded-full bg-[var(--surface-2)] px-5 text-base text-white placeholder:text-[var(--muted-text)] outline-none ring-1 ring-[var(--border)] focus:ring-[var(--accent)]"
            />
            <div className="grid grid-cols-[auto_1fr] gap-2">
              <button
                type="button"
                disabled={busy !== null}
                onClick={() => respond(current, false)}
                aria-label={`Rimuovi il like di ${current.card.name}`}
                className="pressable flex h-14 w-14 items-center justify-center rounded-full bg-[var(--surface-3)] text-white disabled:opacity-60"
              >
                {busy === "no" ? <Loader2 className="h-6 w-6 animate-spin" aria-hidden="true" /> : <X className="h-7 w-7" aria-hidden="true" />}
              </button>
              <button
                type="button"
                disabled={busy !== null}
                onClick={() => respond(current, true)}
                className="pressable flex min-h-[3.5rem] items-center justify-center gap-2 rounded-full bg-[var(--accent)] text-lg font-extrabold text-black disabled:opacity-60"
              >
                {busy === "yes" ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> : <Heart className="h-5 w-5" strokeWidth={2.75} aria-hidden="true" />}
                Fai match
              </button>
            </div>
          </div>
        </section>
      ) : null}

      {/* The rest of the queue */}
      {list.length > 1 || (revealed && !current) ? (
        <section aria-label="Altri like">
          <p className="eyebrow mb-2 text-[var(--muted-text)]">
            {revealed ? `${list.length} ti vogliono in squadra` : `Dopo, altri ${list.length - 1}`}
          </p>
          <ul className="grid grid-cols-3 gap-2">
            {list
              .filter((l) => l.id !== current?.id)
              .map((l) => (
                <li key={l.id}>
                  <button
                    type="button"
                    disabled={!revealed}
                    onClick={() => setOpenId(l.id)}
                    aria-label={revealed ? `Apri il like di ${l.card.name}` : "Like nascosto"}
                    className="relative block aspect-[3/4] w-full overflow-hidden rounded-[var(--radius-md)] bg-[var(--surface-3)]"
                  >
                    {l.card.photos[0] && (
                      <img src={l.card.photos[0].url} alt="" className={`h-full w-full object-cover ${revealed ? "" : "scale-110 blur-xl"}`} />
                    )}
                    {l.isAce && (
                      <span className="absolute left-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-[var(--ace)] text-black">
                        <Crown className="h-4 w-4" aria-hidden="true" />
                      </span>
                    )}
                    {revealed ? (
                      <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2 text-left text-sm font-bold text-white">{l.card.name}</span>
                    ) : (
                      <span className="absolute inset-0 flex items-center justify-center text-white/80">
                        <Lock className="h-5 w-5" aria-hidden="true" />
                      </span>
                    )}
                  </button>
                </li>
              ))}
          </ul>
          {!revealed && (
            <button
              type="button"
              onClick={() => setExtras(true)}
              className="pressable mt-3 flex min-h-[3.5rem] w-full items-center justify-center gap-2 rounded-full bg-[var(--surface-3)] text-base font-extrabold text-white"
            >
              <Eye className="h-5 w-5 text-[var(--accent)]" aria-hidden="true" /> Vedili tutti subito
            </button>
          )}
        </section>
      ) : null}

      <ExtrasSheet open={extras} onOpenChange={setExtras} only={["reveal"]} onBought={() => router.refresh()} />
      {match && <MatchOverlay {...match} myPhoto={myPhoto} onClose={() => setMatch(null)} />}
    </div>
  )
}

function LikeContext({ like }: { like: IncomingLike }) {
  return (
    <div className="rounded-[var(--radius-lg)] p-4 shadow-[var(--shadow-card)]" style={{ background: like.isAce ? "linear-gradient(130deg, color-mix(in srgb, var(--ace) 26%, var(--surface-2)), var(--surface-2) 70%)" : "var(--surface-2)" }}>
      <p className={`eyebrow flex items-center gap-1 ${like.isAce ? "text-[var(--ace)]" : "text-[var(--accent)]"}`}>
        {like.isAce ? <Crown className="h-3.5 w-3.5" aria-hidden="true" /> : <Heart className="h-3.5 w-3.5" aria-hidden="true" />}
        {like.isAce ? `${like.card.name} ti ha mandato un Ace` : `A ${like.card.name} piace`}
      </p>
      {like.target === "PROMPT" && like.targetLabel && <p className="mt-1 font-serif text-xl leading-snug text-white">«{like.targetLabel}»</p>}
      {like.target === "PHOTO" && like.targetLabel && (
        <div className="mt-2 flex items-center gap-3">
          <img src={like.targetLabel} alt="La tua foto" className="h-16 w-12 rounded-lg object-cover" />
          <p className="text-base text-white">la tua foto</p>
        </div>
      )}
      {like.target === "PROFILE" && <p className="mt-1 text-base text-white">il tuo profilo</p>}
      {like.comment && (
        <p className="mt-3 rounded-2xl rounded-tl-sm bg-[var(--surface-4)] px-4 py-3 text-base text-white">{like.comment}</p>
      )}
    </div>
  )
}
