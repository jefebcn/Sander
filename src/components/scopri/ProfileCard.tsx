"use client"

/* eslint-disable @next/next/no-img-element -- user photos from Blob, any size */
import { Heart, MapPin, Shield, Hand, ArrowLeftRight, Target, Sparkles, BadgeCheck, CalendarCheck, Sun, Repeat, Flag, ScanFace } from "lucide-react"
import { cn } from "@/lib/utils"
import { lookingForLabel, sideLabel } from "@/lib/scopri/prompts"
import { freeSlotLabel, VERIFIED_MIN_GAMES, VERIFIED_MIN_RELIABILITY } from "@/lib/scopri/reliability"
import type { ScopriCard, LikeTarget } from "./types"
import { resizedPhoto } from "@/lib/photo"

/**
 * A player as Scopri shows them: photos and prompt answers woven together,
 * the details that matter on the sand in the middle. Every photo and every
 * answer has its own heart, so a like is always about something.
 */
export function ProfileCard({
  card,
  onLike,
  onReport,
  className,
  compact = false,
}: {
  card: ScopriCard
  onLike?: (target: LikeTarget) => void
  /** Shows "Segnala o blocca" under the card. */
  onReport?: () => void
  className?: string
  /** Fewer blocks (e.g. inside "Ti vogliono"). */
  compact?: boolean
}) {
  const [first, ...photos] = card.photos
  const prompts = card.prompts
  // Photo, prompt, photo, details, prompt, photo, prompt, the rest.
  const blocks: React.ReactNode[] = []
  if (first) blocks.push(<PhotoBlock key={`ph-${first.id}`} url={first.url} name={card.name} onLike={onLike && (() => onLike({ kind: "PHOTO", id: first.id, url: first.url }))} />)
  if (prompts[0]) blocks.push(<PromptBlock key={`pr-${prompts[0].id}`} p={prompts[0]} onLike={onLike} />)
  if (photos[0]) blocks.push(<PhotoBlock key={`ph-${photos[0].id}`} url={photos[0].url} name={card.name} onLike={onLike && (() => onLike({ kind: "PHOTO", id: photos[0].id, url: photos[0].url }))} />)
  blocks.push(<DetailsBlock key="details" card={card} />)
  if (prompts[1]) blocks.push(<PromptBlock key={`pr-${prompts[1].id}`} p={prompts[1]} onLike={onLike} />)
  if (!compact) {
    if (photos[1]) blocks.push(<PhotoBlock key={`ph-${photos[1].id}`} url={photos[1].url} name={card.name} onLike={onLike && (() => onLike({ kind: "PHOTO", id: photos[1].id, url: photos[1].url }))} />)
    if (prompts[2]) blocks.push(<PromptBlock key={`pr-${prompts[2].id}`} p={prompts[2]} onLike={onLike} />)
    for (const ph of photos.slice(2)) {
      blocks.push(<PhotoBlock key={`ph-${ph.id}`} url={ph.url} name={card.name} onLike={onLike && (() => onLike({ kind: "PHOTO", id: ph.id, url: ph.url }))} />)
    }
  } else if (prompts[2]) {
    blocks.push(<PromptBlock key={`pr-${prompts[2].id}`} p={prompts[2]} onLike={onLike} />)
  }

  return (
    <article className={cn("flex flex-col gap-3", className)} aria-label={`Profilo di ${card.name}`}>
      <header className="flex items-end justify-between gap-3 px-1">
        <div className="min-w-0">
          <h2 className="font-hand flex items-center gap-2 text-[2.75rem] leading-none text-white">
            <span className="min-w-0 truncate">
              {card.name}
              {card.age !== null && <span className="font-serif text-3xl font-normal text-[var(--muted-text)]">, {card.age}</span>}
            </span>
            {card.verified && (
              <BadgeCheck className="h-7 w-7 shrink-0 text-[var(--social)]" aria-label="Giocatore verificato" role="img" />
            )}
            {card.photoVerified && (
              <ScanFace className="h-7 w-7 shrink-0 text-[var(--accent)]" aria-label="Foto verificata" role="img" />
            )}
          </h2>
          <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-base text-[var(--muted-text)]">
            {card.homeCity && (
              <span className="flex items-center gap-1">
                <MapPin className="h-4 w-4 text-[var(--accent)]" aria-hidden="true" /> {card.homeCity}
              </span>
            )}
            {card.freeToday && (
              <span className="flex items-center gap-1 rounded-full bg-[color-mix(in_srgb,var(--lime)_16%,transparent)] px-2.5 py-0.5 text-sm font-extrabold text-[var(--lime)]">
                <Sun className="h-4 w-4" aria-hidden="true" /> Libero oggi · {freeSlotLabel(card.freeToday).toLowerCase()}
              </span>
            )}
            {card.openToMeet && (
              <span className="flex items-center gap-1 rounded-full bg-[color-mix(in_srgb,var(--love)_16%,transparent)] px-2.5 py-0.5 text-sm font-extrabold text-[var(--love)]">
                <Sparkles className="h-4 w-4" aria-hidden="true" /> Aperto a conoscersi
              </span>
            )}
          </p>
        </div>
        {typeof card.score === "number" && (
          <div className="shrink-0 text-right">
            <p className="num text-3xl leading-none text-[var(--accent)]">{card.score}%</p>
            <p className="text-xs font-bold uppercase tracking-wider text-[var(--muted-text)]">affinità</p>
          </div>
        )}
      </header>
      {card.reasons && card.reasons.length > 0 && (
        <ul className="flex flex-wrap gap-2 px-1" aria-label="Perché te lo proponiamo">
          {card.reasons.map((r) => (
            <li key={r} className="flex items-center gap-1 rounded-full bg-[var(--accent-soft)] px-3 py-1 text-sm font-bold text-[var(--accent)]">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" /> {r}
            </li>
          ))}
        </ul>
      )}
      {blocks}
      {onReport && (
        <button
          type="button"
          onClick={onReport}
          className="flex min-h-[3.5rem] items-center justify-center gap-2 text-sm font-bold text-[var(--muted-text)]"
        >
          <Flag className="h-4 w-4" aria-hidden="true" /> Segnala o blocca {card.name}
        </button>
      )}
    </article>
  )
}

function LikeButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="pressable absolute bottom-3 right-3 z-10 flex h-14 w-14 items-center justify-center rounded-full bg-white text-[var(--accent)] shadow-[0_10px_24px_-6px_rgb(0_0_0/0.6)]"
    >
      <Heart className="h-7 w-7" strokeWidth={2.5} aria-hidden="true" />
    </button>
  )
}

function PhotoBlock({ url, name, onLike }: { url: string; name: string; onLike?: () => void }) {
  return (
    <div className="film relative overflow-hidden rounded-[var(--radius-lg)] bg-[var(--surface-2)]">
      <img src={resizedPhoto(url, "full")} alt={`Foto di ${name}`} loading="lazy" draggable={false} className="aspect-[4/5] w-full select-none object-cover" />
      {onLike && <LikeButton onClick={onLike} label={`Metti like a questa foto di ${name}`} />}
    </div>
  )
}

function PromptBlock({ p, onLike }: { p: ScopriCard["prompts"][number]; onLike?: (t: LikeTarget) => void }) {
  return (
    <div className="relative rounded-[var(--radius-lg)] bg-[var(--surface-2)] px-5 pb-20 pt-6 shadow-[var(--shadow-card)]">
      <p className="text-base font-bold text-[var(--muted-text)]">{p.question}</p>
      <p className="mt-2 font-serif text-[2rem] leading-[1.1] text-white">{p.answer}</p>
      {onLike && (
        <LikeButton
          onClick={() => onLike({ kind: "PROMPT", id: p.id, question: p.question, answer: p.answer })}
          label={`Metti like alla risposta: ${p.question}`}
        />
      )}
    </div>
  )
}

function DetailsBlock({ card }: { card: ScopriCard }) {
  const side = sideLabel(card.side)
  const items: { icon: React.ReactNode; label: string; value: string }[] = [
    {
      icon: card.role === "BLOCKER" ? <Hand className="h-5 w-5" aria-hidden="true" /> : <Shield className="h-5 w-5" aria-hidden="true" />,
      label: "Ruolo",
      value: card.role === "BLOCKER" ? "Muro" : "Difesa",
    },
    { icon: <Target className="h-5 w-5" aria-hidden="true" />, label: "Livello", value: `${card.division} · ${card.rating}` },
  ]
  if (side) items.push({ icon: <ArrowLeftRight className="h-5 w-5" aria-hidden="true" />, label: "Lato", value: side })
  return (
    <div className="rounded-[var(--radius-lg)] bg-[var(--surface-2)] p-4 shadow-[var(--shadow-card)]">
      <dl className="grid grid-cols-2 gap-3">
        {items.map((it) => (
          <div key={it.label} className="flex items-center gap-2">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--surface-4)] text-[var(--accent)]">{it.icon}</span>
            <span className="min-w-0">
              <dt className="text-xs font-bold uppercase tracking-wider text-[var(--muted-text)]">{it.label}</dt>
              <dd className="truncate text-base font-bold text-white">{it.value}</dd>
            </span>
          </div>
        ))}
        <div className="flex items-center gap-2">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--surface-4)] text-[var(--accent)]">
            <span className="num text-sm">{card.played}</span>
          </span>
          <span className="min-w-0">
            <dt className="text-xs font-bold uppercase tracking-wider text-[var(--muted-text)]">Partite</dt>
            <dd className="truncate text-base font-bold text-white">{card.played === 0 ? "Appena arrivato" : "su SANDER"}</dd>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--surface-4)] text-[var(--social)]">
            <CalendarCheck className="h-5 w-5" aria-hidden="true" />
          </span>
          <span className="min-w-0">
            <dt className="text-xs font-bold uppercase tracking-wider text-[var(--muted-text)]">Presenze</dt>
            <dd className="truncate text-base font-bold text-white">{card.reliability === null ? "Ancora nessuna" : `${card.reliability}%`}</dd>
          </span>
        </div>
        {card.again !== null && (
          <div className="flex items-center gap-2">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--surface-4)] text-[var(--social)]">
              <Repeat className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className="min-w-0">
              <dt className="text-xs font-bold uppercase tracking-wider text-[var(--muted-text)]">Rigiocherebbero</dt>
              <dd className="truncate text-base font-bold text-white">{card.again}% di chi ci ha giocato</dd>
            </span>
          </div>
        )}
      </dl>
      {card.verified && (
        <p className="mt-4 flex items-start gap-2 rounded-[var(--radius-md)] bg-[color-mix(in_srgb,var(--social)_12%,transparent)] px-3 py-2 text-sm text-white">
          <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-[var(--social)]" aria-hidden="true" />
          Verificato: almeno {VERIFIED_MIN_GAMES} partite registrate su SANDER e {VERIFIED_MIN_RELIABILITY}% di presenze.
        </p>
      )}
      {card.photoVerified && (
        <p className="mt-2 flex items-start gap-2 rounded-[var(--radius-md)] bg-[var(--accent-soft)] px-3 py-2 text-sm text-white">
          <ScanFace className="mt-0.5 h-4 w-4 shrink-0 text-[var(--accent)]" aria-hidden="true" />
          Foto verificata: un selfie dal vivo, controllato da SANDER, corrisponde alle foto.
        </p>
      )}
      {card.lookingFor.length > 0 && (
        <div className="mt-4 border-t border-[var(--border)] pt-3">
          <p className="text-xs font-bold uppercase tracking-wider text-[var(--muted-text)]">Cerca</p>
          <ul className="mt-2 flex flex-wrap gap-2">
            {card.lookingFor.map((l) => (
              <li key={l} className="rounded-full bg-[var(--surface-4)] px-3 py-1 text-sm font-bold text-white">
                {lookingForLabel(l)}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
