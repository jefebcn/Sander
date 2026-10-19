"use client"

/* eslint-disable @next/next/no-img-element -- user photos from Blob, any size */
import Link from "next/link"
import { MessageCircle } from "lucide-react"
import { useEffect } from "react"
import { resizedPhoto } from "@/lib/photo"

/** "È un match!": both faces, one button to write, one to keep going. */
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
    try {
      navigator.vibrate?.([30, 50, 30])
    } catch {
      // vibration blocked: the screen says it anyway
    }
  }, [])

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="match-title"
      className="fade-in fixed inset-0 z-[70] flex flex-col items-center justify-center gap-6 px-6 text-center"
      style={{ background: "radial-gradient(ellipse 90% 60% at 50% 30%, color-mix(in srgb, var(--love) 55%, transparent), transparent 70%), linear-gradient(180deg, color-mix(in srgb, var(--accent) 70%, var(--background)), var(--background) 75%)" }}
    >
      <div className="pop-in flex items-center">
        <Face url={myPhoto} className="-rotate-6" />
        <Face url={photo} className="-ml-6 rotate-6" />
      </div>
      <div>
        <h2 id="match-title" className="font-hand text-7xl leading-none text-white">È un match!</h2>
        <p className="mt-3 font-serif text-2xl text-white/90">Tu e {name} volete giocare insieme.</p>
      </div>
      <div className="flex w-full max-w-sm flex-col gap-2">
        <Link
          href={`/messaggi/${threadId}`}
          className="pressable flex min-h-[3.75rem] items-center justify-center gap-2 rounded-full bg-white text-lg font-extrabold text-black"
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
