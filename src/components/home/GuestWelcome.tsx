import Image from "next/image"
import Link from "next/link"
import { Volleyball, Crown, TrendingUp, Plus, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * Three cards fanned out like a hand, telling the whole loop at a glance:
 * find a free seat, climb your town's board, watch your points move. They
 * describe what the app does; no real person or match is shown.
 */
const CARDS = [
  {
    icon: Volleyball,
    kicker: "Oggi · 18:30 · 2v2",
    title: "Bagno 26",
    pill: (
      <>
        <Plus className="h-3.5 w-3.5" strokeWidth={3} aria-hidden="true" /> 2 posti
      </>
    ),
    // Lime card, black ink.
    card: "bg-[var(--accent)] text-black",
    badge: "bg-black text-[var(--accent)]",
    chip: "bg-black text-[var(--accent)]",
    sub: "text-black/60",
    pose: { "--r": "-5deg", "--x": "-4%", "--d": "0s" },
  },
  {
    icon: Crown,
    kicker: "Il tuo comune",
    title: "Re di Rimini",
    pill: "1°",
    // White card: the logo's monoline white.
    card: "bg-[var(--crest-line)] text-black",
    badge: "bg-black text-[var(--accent)]",
    chip: "bg-black text-white",
    sub: "text-black/55",
    pose: { "--r": "3deg", "--x": "5%", "--d": "-2s" },
  },
  {
    icon: TrendingUp,
    kicker: "Dopo la partita",
    title: "Vittoria",
    pill: "+12 punti",
    // Black card with a hairline, lime accent.
    card: "bg-[var(--surface-3)] text-white ring-1 ring-[var(--crest-hair)]",
    badge: "bg-[var(--accent)] text-black",
    chip: "bg-[var(--accent)] text-black",
    sub: "text-[var(--muted-text)]",
    pose: { "--r": "-2deg", "--x": "-2%", "--d": "-4s" },
  },
]

/**
 * The entrance: what someone sees the first time they open SANDER without an
 * account. One screen, like an app's welcome page: the crest, the cards that
 * say what it's for, one promise and one button. The rest of the landing
 * (why use it, why come back…) waits below for whoever scrolls.
 */
export function GuestWelcome() {
  return (
    <section
      aria-labelledby="welcome-title"
      // Fills the first screen above the bottom navigation.
      className="relative -mx-4 -mt-4 flex min-h-[calc(100dvh-5.5rem-env(safe-area-inset-bottom,0px))] flex-col"
    >
      <div aria-hidden="true" className="crest-sun pointer-events-none absolute inset-x-0 top-0 h-[24rem]" />

      {/* The crest, small, like an app mark at the top of a welcome screen. */}
      <div className="relative flex justify-center pt-2">
        <Image src="/sander-logo.png" alt="SANDER" width={2048} height={1749} sizes="4.5rem" preload className="h-auto w-[4.5rem]" />
      </div>

      {/* The fanned cards. */}
      <div aria-hidden="true" className="relative mx-auto my-6 flex w-full max-w-[22rem] flex-1 items-center px-5 min-[360px]:px-6">
        <div className="relative h-[13.5rem] w-full">
          {CARDS.map((c, i) => (
            <div
              key={c.title}
              className={cn(
                "card-float absolute inset-x-0 flex items-center gap-3 rounded-[1.25rem] p-3 shadow-[0_18px_30px_-12px_rgb(0_0_0/0.8)]",
                c.card,
              )}
              style={{ top: `${i * 4.5}rem`, ...c.pose } as React.CSSProperties}
            >
              <span className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-full", c.badge)}>
                <c.icon className="h-5 w-5" strokeWidth={2.25} />
              </span>
              <span className="min-w-0 flex-1">
                <span className={cn("block truncate text-xs font-bold uppercase tracking-wider", c.sub)}>{c.kicker}</span>
                <span className="block truncate font-display text-xl font-extrabold leading-tight">{c.title}</span>
              </span>
              <span className={cn("flex shrink-0 items-center gap-1 rounded-full px-3 py-1.5 text-sm font-extrabold", c.chip)}>
                {c.pill}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* The panel, with the lime arc riding its rounded top edge. */}
      <div
        className="relative rounded-t-[2.75rem] bg-[var(--background)] px-6 pb-4 pt-9 text-center"
        style={{ boxShadow: "0 -5px 0 0 var(--accent)" }}
      >
        <p className="eyebrow text-[var(--muted-text)]">Beach volley · Riviera Romagnola</p>
        <h1 id="welcome-title" className="mt-2 font-display text-[2.9rem] font-black leading-[0.88] tracking-tight text-white">
          Il campo è lì.
          <br />
          <span className="text-[var(--accent)]">Manchi tu.</span>
        </h1>
        <p className="mx-auto mt-3 max-w-[20rem] text-base leading-snug text-white/75">
          Il gruppo WhatsApp del beach volley, ma che si organizza da solo: trovi la partita ed entri in un tocco.
        </p>
        <Link
          href="/auth/signin?mode=register"
          className="pressable mt-6 flex min-h-[3.75rem] items-center justify-center rounded-full bg-[var(--accent)] text-lg font-extrabold text-black"
        >
          Inizia gratis
        </Link>
        <p className="mt-2 text-base text-[var(--muted-text)]">
          Hai già un account?{" "}
          <Link href="/auth/signin" className="inline-flex min-h-[2.75rem] items-center font-extrabold text-[var(--accent)]">
            Accedi
          </Link>
        </p>
        <a
          href="#why-title"
          className="mx-auto flex min-h-[2.75rem] w-fit items-center gap-1 text-sm font-bold text-[var(--muted-text)]"
        >
          Perché SANDER <ChevronDown className="h-4 w-4" aria-hidden="true" />
        </a>
      </div>
    </section>
  )
}
