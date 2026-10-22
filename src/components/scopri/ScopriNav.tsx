import Link from "next/link"
import { Heart, MessageCircle, Users, Settings2, Compass, UserRound } from "lucide-react"
import { cn } from "@/lib/utils"

type Tab = "scopri" | "like" | "match" | "coppie" | "profilo"

/**
 * Header of every Scopri screen: where you are, the counts that wait for you,
 * and your own Scopri profile as a tab of its own, so it's always clear where
 * it lives. The sliders open the preferences on the same page.
 */
export function ScopriNav({ active, likes = 0, waiting = 0 }: { active: Tab; likes?: number; waiting?: number }) {
  const tabs: { id: Tab; href: string; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: "scopri", href: "/scopri", label: "Scopri", icon: <Compass className="h-5 w-5" aria-hidden="true" /> },
    { id: "like", href: "/scopri/like", label: "Ti vogliono", icon: <Heart className="h-5 w-5" aria-hidden="true" />, badge: likes },
    { id: "match", href: "/scopri/match", label: "Match", icon: <MessageCircle className="h-5 w-5" aria-hidden="true" />, badge: waiting },
    { id: "coppie", href: "/scopri/coppie", label: "2v2", icon: <Users className="h-5 w-5" aria-hidden="true" /> },
    { id: "profilo", href: "/scopri/profilo", label: "Profilo", icon: <UserRound className="h-5 w-5" aria-hidden="true" /> },
  ]
  return (
    <header className="relative mb-4 pb-2 pt-[calc(env(safe-area-inset-top,0px)+0.75rem)] [text-shadow:0_2px_14px_rgb(0_0_0/0.45)]">
      <div className="flex items-center justify-between">
        <h1 className="font-hand text-[2.9rem] leading-none text-white">
          {active === "scopri" ? "Scopri" : active === "like" ? "Ti vogliono" : active === "match" ? "Match" : active === "coppie" ? "Coppie 2v2" : "Il tuo profilo"}
        </h1>
        <Link
          href="/scopri/profilo#preferenze"
          aria-label="Preferenze: chi vuoi vedere"
          className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--surface-3)] text-white ring-1 ring-white/15"
        >
          <Settings2 className="h-5 w-5" aria-hidden="true" />
        </Link>
      </div>
      <nav aria-label="Sezioni di Scopri" className="mt-3 grid grid-cols-5 gap-0.5 rounded-full bg-[var(--surface-2)] p-1 ring-1 ring-white/10 [text-shadow:none]">
        {tabs.map((t) => (
          <Link
            key={t.id}
            href={t.href}
            aria-current={active === t.id ? "page" : undefined}
            className={cn(
              "relative flex min-h-[3rem] flex-col items-center justify-center rounded-full text-[0.7rem] font-bold leading-tight",
              active === t.id ? "sel-on" : "text-[var(--muted-text)]",
            )}
          >
            {t.icon}
            <span>{t.label}</span>
            {!!t.badge && (
              <span className="absolute right-2 top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--love)] px-1 text-[0.7rem] font-extrabold text-white">
                {t.badge > 9 ? "9+" : t.badge}
              </span>
            )}
          </Link>
        ))}
      </nav>
    </header>
  )
}
