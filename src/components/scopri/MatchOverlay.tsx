"use client"

/* eslint-disable @next/next/no-img-element -- user photos from Blob, any size */
import Link from "next/link"
import { MessageCircle, Users, Volleyball } from "lucide-react"
import { useEffect } from "react"
import { resizedPhoto } from "@/lib/photo"

/**
 * "È un match!": both faces, and a beach volleyball whose two halves fly in
 * from either side and snap together between them (two players, one ball:
 * a pair), with a puff of sand. Then straight to a game, a message, or more
 * cards. Reduced motion shows the ball whole and still.
 */
export function MatchOverlay({
  name,
  photo,
  myPhoto,
  threadId,
  onClose,
}: {
  name: string
  photo: string | null
  myPhoto: string | null
  threadId: string
  onClose: () => void
}) {
  useEffect(() => {
    // Buzz when the two halves of the ball snap together.
    const t = window.setTimeout(() => {
      try {
        navigator.vibrate?.([30, 50, 30])
      } catch {
        // vibration blocked: the screen says it anyway
      }
    }, 950)
    return () => window.clearTimeout(t)
  }, [])

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="match-title"
      className="fade-in fixed inset-0 z-[70] flex flex-col items-center justify-center gap-6 px-6 text-center"
      style={{
        // The Scopri photo (a high five at the net), darkened, with a lime glow
        // where the ball lands: beach volley, not a pink dating screen.
        background:
          "radial-gradient(circle at 50% 34%, color-mix(in srgb, var(--accent) 22%, transparent) 0, transparent 34%), linear-gradient(180deg, rgb(11 11 12 / 0.55) 0%, rgb(11 11 12 / 0.82) 55%, var(--background) 100%), url(/bg/pair.webp) center 30% / cover, var(--background)",
      }}
    >
      <div className="pop-in flex flex-col items-center">
        <div className="flex items-center">
          <Face url={myPhoto} className="-rotate-6" />
          <Face url={photo} className="-ml-6 rotate-6" />
        </div>
        <div className="match-ball relative z-10 -mt-12 h-24 w-24" aria-hidden="true">
          <span className="match-ball__burst" />
          <img src="/match-ball.webp" alt="" className="match-ball__half match-ball__half--l" />
          <img src="/match-ball.webp" alt="" className="match-ball__half match-ball__half--r" />
        </div>
      </div>
      <div>
        <h2 id="match-title" className="font-hand text-7xl leading-none text-white">È un match!</h2>
        <p className="mt-3 font-serif text-2xl text-white/90">Tu e {name} volete giocare insieme: fate coppia per il 2v2?</p>
      </div>
      <div className="flex w-full max-w-sm flex-col gap-2">
        {/* The point of a match is a game: propose one in a tap. */}
        <Link
          href={`/messaggi/${threadId}?proponi=1`}
          className="pressable flex min-h-[3.75rem] items-center justify-center gap-2 rounded-full bg-[var(--accent)] text-lg font-extrabold text-black"
        >
          <Volleyball className="h-5 w-5" aria-hidden="true" /> Giocate insieme
        </Link>
        <p className="-mt-1 text-sm text-white/80">Entrate in coppia in una partita vicina, proponete un 2v2 o un allenamento a due.</p>
        <Link
          href="/scopri/coppie"
          className="pressable btn btn-secondary min-h-[3.75rem] gap-2 text-lg"
        >
          <Users className="h-5 w-5" aria-hidden="true" /> Fate coppia fissa
        </Link>
        <Link
          href={`/messaggi/${threadId}`}
          className="pressable flex min-h-[3.25rem] items-center justify-center gap-2 text-base font-extrabold text-white"
        >
          <MessageCircle className="h-5 w-5" aria-hidden="true" /> Scrivi a {name}
        </Link>
        <button type="button" onClick={onClose} className="min-h-[3.5rem] text-base font-bold text-white/90">
          Continua a scoprire
        </button>
      </div>
    </div>
  )
}

function Face({ url, className }: { url: string | null; className?: string }) {
  return (
    <div className={`h-36 w-28 overflow-hidden rounded-[1.25rem] bg-[var(--surface-3)] ring-4 ring-white ${className ?? ""}`}>
      {url && <img src={resizedPhoto(url, "card")} alt="" className="h-full w-full object-cover" />}
    </div>
  )
}
