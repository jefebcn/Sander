import Image from "next/image"
import { MessageCircle, Camera, Music2, Handshake, ExternalLink } from "lucide-react"
import { CrestHeading } from "./Crest"
import { CommunityVideos } from "./CommunityVideos"
import { PARTNER_MAILTO, SOCIAL } from "@/lib/contact"

/** WhatsApp group, socials, partners and videos — one calm block instead of four loud ones. */
export function CommunityStrip() {
  const socials = [
    { href: SOCIAL.whatsapp, icon: MessageCircle, label: "WhatsApp", sub: "Gruppo partite" },
    { href: SOCIAL.instagram, icon: Camera, label: "Instagram", sub: "@sanderbeachvolley" },
    { href: SOCIAL.tiktok, icon: Music2, label: "TikTok", sub: "@sanderbeachvolley" },
  ]
  return (
    <section className="tone-social flex flex-col gap-3" aria-labelledby="community-title">
      <CrestHeading id="community-title" eyebrow="Fuori dal campo" title="Community" />
      <div className="grid grid-cols-3 gap-2">
        {socials.map((s) => (
          <a
            key={s.label}
            href={s.href}
            target="_blank"
            rel="noopener noreferrer"
            className="pressable flex min-h-[5.5rem] flex-col items-center justify-center gap-2 rounded-[var(--radius-md)] bg-[var(--surface-2)] px-2 py-3 ring-1 ring-[var(--crest-hair)]"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--tone-soft)] text-[var(--tone)]">
              <s.icon className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className="text-sm font-extrabold text-white">{s.label}</span>
            <span className="sr-only">{s.sub}</span>
          </a>
        ))}
      </div>

      {/* Partner slot: the current sponsor, plus a way in for the next one. */}
      <div className="overflow-hidden rounded-[var(--radius-lg)] bg-[var(--surface-2)] ring-1 ring-[var(--crest-hair)]">
        <a
          href="https://www.pepitoseyewear.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex min-h-[4.5rem] items-center gap-4 p-4"
        >
          {/* The logo file is a square with wide margins: crop into it so the mark fills the tile. */}
          <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-[var(--radius-sm)]">
            <Image src="/sponsors/pepitos-logo.png" alt="" fill sizes="56px" className="scale-[1.4] object-cover" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="eyebrow block text-[var(--muted-text)]">Partner</span>
            <span className="block text-base font-extrabold text-white">Pepitos Eyewear</span>
          </span>
          <ExternalLink className="h-5 w-5 shrink-0 text-[var(--muted-text)]" aria-hidden="true" />
        </a>
        <a
          href={PARTNER_MAILTO}
          className="flex min-h-[3.5rem] items-center justify-center gap-2 border-t border-[var(--border)] px-4 text-sm font-bold text-[var(--tone)]"
        >
          <Handshake className="h-5 w-5 shrink-0" aria-hidden="true" />
          Hai un bagno o un brand? Diventa partner
        </a>
      </div>

      <CommunityVideos />
    </section>
  )
}
