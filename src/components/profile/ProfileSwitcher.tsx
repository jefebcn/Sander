"use client"

import { useEffect, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Check, ChevronDown, Plus } from "lucide-react"
import { toast } from "sonner"
import { switchProfileMode } from "@/actions/profileMode"
import { PROFILE_MODE_COOKIE, PROFILE_MODE_EVENT } from "@/lib/profileMode"
import { resizedPhoto } from "@/lib/photo"
import { useHaptic } from "@/lib/useHaptic"
import { cn } from "@/lib/utils"
import { Sheet } from "@/components/ui/Sheet"

export interface SwitcherClub {
  slug: string
  name: string
  city: string
  logoUrl: string | null
  role: "OWNER" | "STAFF"
  approved: boolean
  followers: number
}

interface Props {
  me: { name: string; subtitle: string; avatarUrl: string | null }
  clubs: SwitcherClub[]
  /** Slug of the club in use, or null when using SANDER as yourself. */
  active: string | null
  /** The cookie names a club this player no longer runs: forget it. */
  staleMode?: boolean
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("")
}

function Face({ src, name, club, className }: { src: string | null; name: string; club?: boolean; className?: string }) {
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden font-black",
        club ? "rounded-xl bg-white text-[var(--background)]" : "rounded-full bg-[var(--accent)] text-black",
        className,
      )}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={resizedPhoto(src, "thumb")} alt="" className="h-full w-full object-cover" />
      ) : (
        initials(name)
      )}
    </span>
  )
}

/** The name chip at the top of the profile: tap it to use SANDER as yourself or as one of your clubs. */
export function ProfileSwitcher({ me, clubs, active, staleMode }: Props) {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const router = useRouter()
  const haptic = useHaptic()
  const club = clubs.find((c) => c.slug === active && c.approved) ?? null

  useEffect(() => {
    if (!staleMode) return
    document.cookie = `${PROFILE_MODE_COOKIE}=; path=/; max-age=0`
    window.dispatchEvent(new Event(PROFILE_MODE_EVENT))
  }, [staleMode])

  function pick(slug: string | null) {
    if (slug === (club?.slug ?? null)) return setOpen(false)
    haptic("light")
    startTransition(async () => {
      const res = await switchProfileMode({ clubSlug: slug })
      if (!res.ok) return void toast.error(res.error)
      window.dispatchEvent(new Event(PROFILE_MODE_EVENT))
      setOpen(false)
      router.replace("/profile")
      router.refresh()
    })
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Cambia profilo"
        className="flex min-h-[3.5rem] min-w-0 items-center gap-3 rounded-full border border-[var(--border)] bg-[var(--surface-2)] py-1.5 pl-1.5 pr-4 text-left transition-transform active:scale-[0.98]"
      >
        <Face src={club ? club.logoUrl : me.avatarUrl} name={club ? club.name : me.name} club={!!club} className="h-11 w-11 text-base" />
        <span className="min-w-0">
          <span className="block truncate text-lg font-extrabold leading-tight text-white">{club ? club.name : me.name}</span>
          <span className="block truncate text-sm text-[var(--muted-text)]">
            {club ? `Modalità club · ${club.role === "OWNER" ? "Titolare" : "Staff"}` : me.subtitle}
          </span>
        </span>
        <ChevronDown className="h-5 w-5 shrink-0 text-[var(--muted-text)]" aria-hidden="true" />
      </button>

      <Sheet open={open} onOpenChange={setOpen} title="Usa SANDER come">
        <div className={cn("flex flex-col gap-2", pending && "pointer-events-none opacity-60")}>
          <button
            type="button"
            onClick={() => pick(null)}
            className={cn(
              "flex min-h-[4.25rem] items-center gap-3 rounded-2xl px-3 text-left",
              !club ? "bg-[var(--surface-2)] ring-[1.5px] ring-[var(--accent)]" : "active:bg-[var(--surface-2)]",
            )}
          >
            <Face src={me.avatarUrl} name={me.name} className="h-11 w-11 text-base" />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-base font-extrabold text-white">{me.name}</span>
              <span className="block text-sm text-[var(--muted-text)]">Giocatore · la tua carta</span>
            </span>
            {!club && <Check className="h-5 w-5 text-[var(--accent)]" aria-hidden="true" />}
          </button>

          {clubs.map((c) =>
            c.approved ? (
              <button
                key={c.slug}
                type="button"
                onClick={() => pick(c.slug)}
                className={cn(
                  "flex min-h-[4.25rem] items-center gap-3 rounded-2xl px-3 text-left",
                  club?.slug === c.slug ? "bg-[var(--surface-2)] ring-[1.5px] ring-[var(--accent)]" : "active:bg-[var(--surface-2)]",
                )}
              >
                <Face src={c.logoUrl} name={c.name} club className="h-11 w-11 text-sm" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-base font-extrabold text-white">{c.name}</span>
                  <span className="block truncate text-sm text-[var(--muted-text)]">
                    {c.city} · {c.followers} follower
                  </span>
                </span>
                <span className="shrink-0 rounded-full bg-[var(--surface-3)] px-2.5 py-1 text-xs font-extrabold text-[var(--compete)]">
                  {c.role === "OWNER" ? "Titolare" : "Staff"}
                </span>
              </button>
            ) : (
              <Link key={c.slug} href="/club" onClick={() => setOpen(false)} className="flex min-h-[4.25rem] items-center gap-3 rounded-2xl px-3 active:bg-[var(--surface-2)]">
                <Face src={c.logoUrl} name={c.name} club className="h-11 w-11 text-sm opacity-60" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-base font-extrabold text-white">{c.name}</span>
                  <span className="block text-sm text-[var(--muted-text)]">In attesa di approvazione</span>
                </span>
              </Link>
            ),
          )}

          <Link href="/club" onClick={() => setOpen(false)} className="flex min-h-[4.25rem] items-center gap-3 rounded-2xl px-3 active:bg-[var(--surface-2)]">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--surface-3)] text-[var(--accent)]">
              <Plus className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-base font-extrabold text-white">Porta il tuo club</span>
              <span className="block text-sm text-[var(--muted-text)]">Gratis per società, circoli e bagni</span>
            </span>
          </Link>
        </div>
      </Sheet>
    </>
  )
}
