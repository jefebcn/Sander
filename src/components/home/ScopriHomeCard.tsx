import Link from "next/link"
import { HeartHandshake, Heart, MessageCircle, ChevronRight } from "lucide-react"

/**
 * Scopri on the home: who wants you, who waits for your reply, or (before the
 * profile is ready) the reason to make one.
 */
export function ScopriHomeCard({
  ready,
  likes,
  waiting,
  nearby,
  city,
}: {
  ready: boolean
  likes: number
  waiting: number
  nearby: number
  city: string | null
}) {
  if (!ready) {
    return (
      <Link
        href="/onboarding/scopri"
        className="pressable relative flex min-h-[15rem] flex-col justify-end overflow-hidden rounded-[var(--radius-lg)] p-5 shadow-[var(--shadow-card)]"
        style={{
          background:
            "linear-gradient(180deg, rgb(0 0 0 / 0) 15%, rgb(0 0 0 / 0.82) 100%), url(/demo/players/davide-1.webp) center 25% / cover",
        }}
      >
        <p className="eyebrow flex items-center gap-1 text-white/85">
          <HeartHandshake className="h-4 w-4" aria-hidden="true" /> Nuovo · Scopri
        </p>
        <p className="font-hand mt-1 text-[2.3rem] leading-tight text-white">Trova con chi giocare</p>
        <p className="mt-1 text-base text-white/85">
          {nearby > 0 ? `${nearby} giocatori ${city ? `a ${city}` : "vicino a te"} sono già su Scopri.` : "Foto, tre risposte, e sei in campo."}
        </p>
        <span className="mt-4 flex min-h-[3.5rem] items-center gap-1 self-start rounded-full px-6 text-base font-extrabold text-white ring-[1.5px] ring-inset ring-white/85">
          Crea il profilo <ChevronRight className="h-5 w-5" aria-hidden="true" />
        </span>
      </Link>
    )
  }
  return (
    <section className="grid grid-cols-[1fr_auto_auto] items-center gap-2 rounded-[var(--radius-lg)] bg-[var(--surface-2)] p-3 shadow-[var(--shadow-card)]">
      <Link href="/scopri" className="pressable flex min-h-[3.5rem] min-w-0 items-center gap-3 rounded-[var(--radius-md)] px-2">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-black">
          <HeartHandshake className="h-6 w-6" aria-hidden="true" />
        </span>
        <span className="min-w-0">
          <span className="block font-display text-xl font-extrabold leading-tight text-white">Scopri</span>
          <span className="block truncate text-sm text-[var(--muted-text)]">Il più compatibile di oggi ti aspetta</span>
        </span>
      </Link>
      <Link href="/scopri/like" aria-label={`${likes} ti vogliono`} className="relative flex h-14 w-14 items-center justify-center rounded-full bg-[var(--surface-4)] text-[var(--accent)]">
        <Heart className="h-6 w-6" aria-hidden="true" />
        {likes > 0 && <Badge n={likes} />}
      </Link>
      <Link href="/scopri/match" aria-label={`${waiting} match ti aspettano`} className="relative flex h-14 w-14 items-center justify-center rounded-full bg-[var(--surface-4)] text-[var(--social)]">
        <MessageCircle className="h-6 w-6" aria-hidden="true" />
        {waiting > 0 && <Badge n={waiting} />}
      </Link>
    </section>
  )
}

function Badge({ n }: { n: number }) {
  return (
    <span className="absolute -right-0.5 -top-0.5 flex h-6 min-w-6 items-center justify-center rounded-full bg-[var(--love)] px-1.5 text-xs font-extrabold text-white">
      {n > 9 ? "9+" : n}
    </span>
  )
}
