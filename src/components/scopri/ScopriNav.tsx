import Link from "next/link"
import { Heart, MessageCircle, Users, Settings2, Compass } from "lucide-react"
import { cn } from "@/lib/utils"

type Tab = "scopri" | "like" | "match" | "coppie"

/** Header of every Scopri screen: where you are, and the counts that wait for you. */
export function ScopriNav({ active, likes = 0, waiting = 0 }: { active: Tab; likes?: number; waiting?: number }) {
  const tabs: { id: Tab; href: string; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: "scopri", href: "/scopri", label: "Scopri", icon: <Compass className="h-5 w-5" aria-hidden="true" /> },
    { id: "like", href: "/scopri/like", label: "Ti vogliono", icon: <Heart className="h-5 w-5" aria-hidden="true" />, badge: likes },
    { id: "match", href: "/scopri/match", label: "Match", icon: <MessageCircle className="h-5 w-5" aria-hidden="true" />, badge: waiting },
    { id: "coppie", href: "/scopri/coppie", label: "2v2", icon: <Users className="h-5 w-5" aria-hidden="true" /> },
  ]
  return (
    <header className="sticky top-0 z-20 -mx-4 mb-4 bg-[color-mix(in_srgb,var(--background)_88%,transparent)] px-4 pb-2 pt-[calc(env(safe-area-inset-top,0px)+0.75rem)] backdrop-blur-xl">
      <div className="flex items-center justify-between">
        <h1 className="font-hand text-[2.9rem] leading-none text-white">
          {active === "scopri" ? "Scopri" : active === "like" ? "Ti vogliono" : active === "match" ? "Match" : "Coppie 2v2"}
        </h1>
        <Link
          href="/scopri/profilo"
          aria-label="Il tuo profilo Scopri e le preferenze"
          className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--surface-2)] text-white"
        >
          <Settings2 className="h-5 w-5" aria-hidden="true" />
        </Link>
      </div>
      <nav aria-label="Sezioni di Scopri" className="mt-3 grid grid-cols-4 gap-1 rounded-full bg-[var(--surface-2)] p-1">
        {tabs.map((t) => (
          <Link
            key={t.id}
            href={t.href}
            aria-current={active === t.id ? "page" : undefined}
            className={cn(
              "relative flex min-h-[3rem] flex-col items-center justify-center rounded-full text-xs font-bold",
              active === t.id ? "bg-[var(--accent)] text-black" : "text-[var(--muted-text)]",
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
