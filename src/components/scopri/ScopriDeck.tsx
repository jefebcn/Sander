"use client"

import { useRef, useState } from "react"
import Link from "next/link"
import { X, Heart, Crown, Users, MapPin, ChevronRight, RefreshCw } from "lucide-react"
import { toast } from "sonner"
import { getDeck, skipPlayer } from "@/actions/scopri"
import { formatWhen } from "@/lib/datetime"
import { cn } from "@/lib/utils"
import { ProfileCard } from "./ProfileCard"
import { LikeSheet, type LikeResult } from "./LikeSheet"
import { MatchOverlay } from "./MatchOverlay"
import { ExtrasSheet } from "./ExtrasSheet"
import { FreeTodayButton } from "./FreeTodayButton"
import { ReportSheet } from "./ReportSheet"
import type { FreeSlot } from "@/lib/scopri/reliability"
import type { Allowance, GroupGame, LikeTarget, ScopriCard } from "./types"
import { pairFit, type PairSide } from "@/lib/scopri/pairFit"

type Item = { kind: "player"; card: ScopriCard } | { kind: "game"; game: GroupGame }

/** Swipe distance (px) that commits a like or a skip. */
const COMMIT = 110

/** Open group games go after the 3rd and the 7th player. */
function weave(cards: ScopriCard[], games: GroupGame[]): Item[] {
  const out: Item[] = []
  const g = [...games]
  cards.forEach((card, i) => {
    out.push({ kind: "player", card })
    if ((i === 2 || i === 6) && g.length) out.push({ kind: "game", game: g.shift() as GroupGame })
  })
  return out
}

/**
 * The deck: one player at a time. Drag right to like (you still choose what
 * you liked), left to pass; or use the hearts on each photo and answer.
 */
export function ScopriDeck({
  initialCards,
  initialAllowance,
  games,
  myPhoto,
  myFree,
  me,
}: {
  initialCards: ScopriCard[]
  initialAllowance: Allowance
  games: GroupGame[]
  myPhoto: string | null
  myFree: FreeSlot | null
  /** Your role and side: each card says what you'd be together on a 2v2 court. */
  me?: PairSide
}) {
  const [items, setItems] = useState<Item[]>(() => weave(initialCards, games))
  const [allowance, setAllowance] = useState(initialAllowance)
  const [target, setTarget] = useState<LikeTarget | null>(null)
  const [match, setMatch] = useState<{ name: string; photo: string | null; threadId: string } | null>(null)
  const [extras, setExtras] = useState(false)
  const [report, setReport] = useState(false)
  const [drag, setDrag] = useState(0)
  const [leaving, setLeaving] = useState<"left" | "right" | null>(null)
  const [loading, setLoading] = useState(false)
  const seen = useRef(new Set(initialCards.map((c) => c.id)))
  const start = useRef<{ x: number; y: number; horizontal: boolean | null } | null>(null)
  const topRef = useRef<HTMLDivElement>(null)

  const current = items[0]

  // Refill quietly when the deck runs low (called after each card leaves).
  function refill(remainingPlayers: number) {
    if (remainingPlayers >= 3 || loading) return
    setLoading(true)
    getDeck()
      .then((res) => {
        const fresh = res.cards.filter((c) => !seen.current.has(c.id))
        fresh.forEach((c) => seen.current.add(c.id))
        if (fresh.length) setItems((prev) => [...prev, ...fresh.map((card) => ({ kind: "player" as const, card }))])
        setAllowance(res.allowance)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  function next(direction: "left" | "right") {
    setLeaving(direction)
    window.setTimeout(() => {
      setItems((prev) => prev.slice(1))
      refill(items.slice(1).filter((i) => i.kind === "player").length)
      setLeaving(null)
      setDrag(0)
      topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
    }, 220)
  }

  function pass() {
    if (!current) return
    if (current.kind === "player") {
      skipPlayer({ playerId: current.card.id }).catch(() => toast.error("Non sono riuscito a salvare, riprova"))
    }
    next("left")
  }

  function onSent(res: LikeResult) {
    setTarget(null)
    if (res.matched) {
      setMatch({ name: res.name, photo: res.photo ?? null, threadId: res.threadId })
    } else {
      setAllowance(res.allowance)
      toast.success("Like mandato. Se ricambia, è un match.")
    }
    next("right")
  }

  // ── Swipe gesture (horizontal only; vertical scroll stays native) ─────────
  function onPointerDown(e: React.PointerEvent) {
    if (current?.kind !== "player" || (e.target as HTMLElement).closest("button,a")) return
    start.current = { x: e.clientX, y: e.clientY, horizontal: null }
  }
  function onPointerMove(e: React.PointerEvent) {
    const s = start.current
    if (!s) return
    const dx = e.clientX - s.x
    const dy = e.clientY - s.y
    if (s.horizontal === null && (Math.abs(dx) > 10 || Math.abs(dy) > 10)) s.horizontal = Math.abs(dx) > Math.abs(dy)
    if (s.horizontal) setDrag(dx)
  }
  function onPointerUp() {
    const s = start.current
    start.current = null
    if (!s?.horizontal || current?.kind !== "player") return setDrag(0)
    if (drag > COMMIT) {
      setDrag(0)
      const first = current.card.photos[0]
      setTarget(first ? { kind: "PHOTO", id: first.id, url: first.url } : { kind: "PROFILE" })
    } else if (drag < -COMMIT) {
      pass()
    } else {
      setDrag(0)
    }
  }

  const likesLeft = allowance.likes.total

  return (
    <div ref={topRef} className="scroll-mt-24">
      {/* Allowance strip */}
      <div className="mb-3 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => setExtras(true)}
          className="flex min-h-[2.75rem] items-center gap-3 rounded-full bg-[var(--surface-2)] px-4 text-sm font-bold text-white"
          aria-label={`${allowance.likes.unlimited ? "Like illimitati" : `${likesLeft} like`} e ${allowance.aces} Ace rimasti. Prendi extra.`}
        >
          {/* Words next to the icons: a bare "♡ 8 👑 1" meant nothing to a newcomer. */}
          <span className="flex items-center gap-1">
            <Heart className="h-4 w-4 text-[var(--accent)]" aria-hidden="true" /> {allowance.likes.unlimited ? "∞" : likesLeft} like
          </span>
          <span className="flex items-center gap-1">
            <Crown className="h-4 w-4 text-[var(--ace)]" aria-hidden="true" /> {allowance.aces} Ace
          </span>
        </button>
        <FreeTodayButton initial={myFree} />
      </div>
      {current?.kind === "player" && (
        <p className="-mt-1 mb-3 text-sm text-[var(--muted-text)]">
          Tocca <Heart className="inline h-3.5 w-3.5 align-[-2px] text-[var(--accent)]" aria-hidden="true" /> su una foto o una risposta e scrivi due parole: diventano il primo messaggio. <X className="inline h-3.5 w-3.5 align-[-2px]" aria-hidden="true" /> per passare.
        </p>
      )}

      {!current ? (
        <EmptyDeck loading={loading} />
      ) : current.kind === "game" ? (
        <GameCard game={current.game} onSkip={() => next("left")} />
      ) : (
        <div
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          className={cn("relative touch-pan-y select-none", leaving && "transition-transform duration-200 ease-out")}
          style={{
            transform: leaving
              ? `translateX(${leaving === "right" ? 120 : -120}%) rotate(${leaving === "right" ? 12 : -12}deg)`
              : drag
                ? `translateX(${drag}px) rotate(${drag / 22}deg)`
                : undefined,
            transition: !leaving && !drag ? "transform 200ms var(--ease-out)" : undefined,
          }}
        >
          <Stamp show={drag > 40} text="GIOCHIAMO" side="left" color="var(--accent)" opacity={Math.min(1, drag / COMMIT)} />
          <Stamp show={drag < -40} text="PASSO" side="right" color="var(--muted-text)" opacity={Math.min(1, -drag / COMMIT)} />
          <ProfileCard
            card={current.card}
            fit={me ? pairFit(me, current.card) : null}
            onLike={(t) => setTarget(t)}
            onReport={() => setReport(true)}
          />
        </div>
      )}

      {/* Floating pass / like */}
      {current?.kind === "player" && (
        <div className="pointer-events-none sticky bottom-24 z-20 mt-4 flex items-center justify-between px-2">
          <button
            type="button"
            onClick={pass}
            aria-label={`Passa ${current.card.name}`}
            className="pressable pointer-events-auto flex h-16 w-16 items-center justify-center rounded-full bg-[var(--surface-1)] text-white shadow-[0_12px_28px_-8px_rgb(0_0_0/0.8)] ring-1 ring-[var(--border)]"
          >
            <X className="h-8 w-8" strokeWidth={2.5} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => {
              const first = current.card.photos[0]
              setTarget(first ? { kind: "PHOTO", id: first.id, url: first.url } : { kind: "PROFILE" })
            }}
            aria-label={`Like a ${current.card.name}`}
            className="pressable pointer-events-auto flex h-16 w-16 items-center justify-center rounded-full bg-[var(--accent)] text-black shadow-[var(--shadow-glow)]"
          >
            <Heart className="h-8 w-8" strokeWidth={2.5} aria-hidden="true" />
          </button>
        </div>
      )}

      {current?.kind === "player" && (
        <LikeSheet
          card={current.card}
          target={target}
          allowance={allowance}
          onClose={() => setTarget(null)}
          onSent={onSent}
          onAllowance={setAllowance}
        />
      )}
      <ExtrasSheet open={extras} onOpenChange={setExtras} onBought={setAllowance} />
      {current?.kind === "player" && (
        <ReportSheet open={report} onOpenChange={setReport} playerId={current.card.id} name={current.card.name} onDone={() => next("left")} />
      )}
      {match && <MatchOverlay {...match} myPhoto={myPhoto} onClose={() => setMatch(null)} />}
    </div>
  )
}

function Stamp({ show, text, side, color, opacity }: { show: boolean; text: string; side: "left" | "right"; color: string; opacity: number }) {
  if (!show) return null
  return (
    <span
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute top-24 z-10 rounded-xl border-4 px-3 py-1 font-display text-4xl font-extrabold",
        side === "left" ? "left-4 -rotate-12" : "right-4 rotate-12",
      )}
      style={{ color, borderColor: color, opacity }}
    >
      {text}
    </span>
  )
}

function GameCard({ game, onSkip }: { game: GroupGame; onSkip: () => void }) {
  return (
    <div className="tone-social rounded-[var(--radius-lg)] bg-[var(--surface-2)] p-5 shadow-[var(--shadow-card)] ring-1 ring-[var(--tone-line)]">
      <p className="eyebrow flex items-center gap-2 text-[var(--tone)]">
        <Users className="h-4 w-4" aria-hidden="true" /> Partita di gruppo vicino a te
      </p>
      <p className="font-hand mt-2 text-[2.3rem] leading-tight text-white">{game.title}</p>
      <p className="mt-1 flex items-center gap-1 text-base text-[var(--muted-text)]">
        <MapPin className="h-4 w-4 text-[var(--tone)]" aria-hidden="true" /> {game.location} · {formatWhen(game.date)}
      </p>
      <p className="mt-4 font-serif text-2xl text-white">
        {game.missing === 1 ? "Manca 1 giocatore." : `Mancano ${game.missing} giocatori.`} Ti va?
      </p>
      <div className="mt-5 grid grid-cols-2 gap-2">
        <button type="button" onClick={onSkip} className="min-h-[3.5rem] rounded-full bg-[var(--surface-4)] text-base font-bold text-white">
          Non ora
        </button>
        <Link href={`/sessions/${game.id}`} className="pressable flex min-h-[3.5rem] items-center justify-center gap-1 rounded-full bg-[var(--tone)] text-base font-extrabold text-black">
          Entra <ChevronRight className="h-5 w-5" aria-hidden="true" />
        </Link>
      </div>
    </div>
  )
}

function EmptyDeck({ loading }: { loading: boolean }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-[var(--radius-lg)] bg-[var(--surface-2)] px-6 py-12 text-center">
      <RefreshCw className={cn("h-8 w-8 text-[var(--accent)]", loading && "animate-spin")} aria-hidden="true" />
      <p className="font-hand text-[1.9rem] text-white">{loading ? "Cerco altri giocatori…" : "Per oggi hai visto tutti"}</p>
      <p className="text-base text-[var(--muted-text)]">
        Allarga i comuni o il livello nelle preferenze, oppure torna domani: arriva sempre qualcuno di nuovo.
      </p>
      <Link href="/scopri/profilo#preferenze" className="mt-2 flex min-h-[3.5rem] items-center rounded-full bg-[var(--surface-4)] px-6 text-base font-bold text-white">
        Cambia preferenze
      </Link>
      <Link href="/profile?tab=invita" className="flex min-h-[3.5rem] items-center px-6 text-base font-bold text-[var(--accent)]">
        Invita i tuoi compagni su Scopri
      </Link>
    </div>
  )
}
