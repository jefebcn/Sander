"use client"

import { useRef, useState, useEffect, useEffectEvent } from "react"
import { Play, Pause, ChevronLeft, ChevronRight } from "lucide-react"

// Newest first — add new videos at the beginning of the array.
// `heavy` clips (several MB) never autoplay: they load only when tapped.
const VIDEOS: { src: string; heavy?: boolean }[] = [
  { src: "/videos/IMG_2937.mp4", heavy: true }, // ~18 MB
  { src: "/videos/clip3.mp4" },
  { src: "/videos/clip1.mp4" },
  { src: "/videos/clip2.mp4" },
]

type NetworkInformationLike = { saveData?: boolean; effectiveType?: string }

/**
 * Autoplay only when it costs the viewer nothing they'd mind: no reduced-motion
 * preference, no data-saver, not on a 2G-class connection.
 */
function useAutoplayAllowed() {
  const [allowed, setAllowed] = useState(false)
  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)")
    const conn = (navigator as Navigator & { connection?: NetworkInformationLike }).connection
    const update = () => {
      const slow = Boolean(conn?.saveData) || /(^|-)2g$/.test(conn?.effectiveType ?? "")
      setAllowed(!motion.matches && !slow)
    }
    update()
    motion.addEventListener("change", update)
    return () => motion.removeEventListener("change", update)
  }, [])
  return allowed
}

function VideoThumb({ src, heavy, autoplayAllowed, index }: { src: string; heavy?: boolean; autoplayAllowed: boolean; index: number }) {
  const boxRef = useRef<HTMLButtonElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  // No src until the clip is wanted: preload="none" alone isn't honoured everywhere.
  const [loaded, setLoaded] = useState(false)
  const [playing, setPlaying] = useState(false)
  const wantPlay = useRef(false)
  const userPaused = useRef(false)

  function start() {
    wantPlay.current = true
    if (!loaded) setLoaded(true)
    else videoRef.current?.play().catch(() => {})
  }

  function stop() {
    wantPlay.current = false
    videoRef.current?.pause()
  }

  // Once the src is attached, honour a pending play request.
  useEffect(() => {
    if (loaded && wantPlay.current) videoRef.current?.play().catch(() => {})
  }, [loaded])

  // In view → autoplay (when allowed and the viewer hasn't paused it); out of view → pause.
  // An effect event always sees the latest start/stop, so the observer is set
  // up once per element instead of on every render.
  const onVisibility = useEffectEvent((visible: boolean) => {
    if (visible) {
      if (autoplayAllowed && !heavy && !userPaused.current) start()
    } else if (wantPlay.current) {
      stop()
    }
  })
  useEffect(() => {
    const el = boxRef.current
    if (!el || typeof IntersectionObserver === "undefined") return
    const io = new IntersectionObserver(([entry]) => onVisibility(entry.isIntersecting), { threshold: 0.6 })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  function handleClick() {
    if (playing) {
      userPaused.current = true
      stop()
    } else {
      userPaused.current = false
      start()
    }
  }

  return (
    <button
      ref={boxRef}
      type="button"
      onClick={handleClick}
      aria-label={playing ? `Metti in pausa il video ${index}` : `Guarda il video ${index}`}
      aria-pressed={playing}
      className="relative flex-1 overflow-hidden rounded-2xl bg-[var(--surface-2)] active:opacity-90"
      style={{ aspectRatio: "9/16" }}
    >
      <video
        ref={videoRef}
        src={loaded ? src : undefined}
        className="h-full w-full object-cover"
        playsInline
        muted
        loop
        preload="none"
        aria-hidden="true"
        tabIndex={-1}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
      />
      {!playing && (
        <span
          className="absolute inset-0 flex flex-col items-center justify-center gap-2"
          style={{
            background: loaded
              ? "color-mix(in srgb, black 30%, transparent)"
              : "linear-gradient(180deg, var(--sea-deep) 0%, var(--surface-2) 100%)",
          }}
        >
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
            <Play className="h-7 w-7 text-white" fill="white" aria-hidden="true" />
          </span>
          {!loaded && <span className="text-sm font-semibold text-white/80">Tocca per guardare</span>}
        </span>
      )}
      {playing && (
        <span className="absolute bottom-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/40">
          <Pause className="h-3.5 w-3.5 text-white/80" aria-hidden="true" />
        </span>
      )}
    </button>
  )
}

export function VideoCarousel() {
  const [page, setPage] = useState(0)
  const autoplayAllowed = useAutoplayAllowed()
  const totalPages = Math.ceil(VIDEOS.length / 2)
  const start = page * 2
  const visible = VIDEOS.slice(start, start + 2)

  return (
    <div className="space-y-2">
      {/* Only render videos for the current page — others don't load at all */}
      <div className="flex gap-3">
        {visible.map((v, i) => (
          <VideoThumb key={v.src} src={v.src} heavy={v.heavy} autoplayAllowed={autoplayAllowed} index={start + i + 1} />
        ))}
        {visible.length === 1 && <div className="flex-1" style={{ aspectRatio: "9/16" }} />}
      </div>

      {/* Navigation dots + arrows — only if more than one page */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            aria-label="Video precedenti"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--surface-2)] disabled:opacity-30"
          >
            <ChevronLeft className="h-5 w-5 text-white" aria-hidden="true" />
          </button>

          <div className="flex">
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setPage(i)}
                aria-label={`Pagina video ${i + 1} di ${totalPages}`}
                aria-current={i === page ? "true" : undefined}
                className="flex h-11 min-w-[2rem] items-center justify-center px-1"
              >
                <span
                  className="block h-1.5 rounded-full transition-all"
                  style={{
                    width: i === page ? "1.5rem" : "0.375rem",
                    background: i === page ? "var(--accent)" : "color-mix(in srgb, white 25%, transparent)",
                  }}
                />
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page === totalPages - 1}
            aria-label="Video successivi"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--surface-2)] disabled:opacity-30"
          >
            <ChevronRight className="h-5 w-5 text-white" aria-hidden="true" />
          </button>
        </div>
      )}
    </div>
  )
}
