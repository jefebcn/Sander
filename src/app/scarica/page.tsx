import type { Metadata } from "next"
import Image from "next/image"
import { Trophy, Zap, Users, Crown } from "lucide-react"
import { InstallButton } from "@/components/download/InstallButton"
import { GooglePlayButton } from "@/components/download/GooglePlayButton"

export const metadata: Metadata = {
  title: "Scarica SANDER — Beach Volley, la tua carta giocatore",
  description:
    "Crea la tua carta giocatore, organizza partite, sali in classifica e conquista i campi. SANDER — il beach volley della Riviera in un'app.",
  openGraph: {
    title: "Scarica SANDER 🏐",
    description: "Crea la tua carta, gioca, sali in classifica.",
    images: [{ url: "/api/og?title=SANDER&subtitle=Scarica+l%27app&type=session" }],
  },
}

const FEATURES = [
  { icon: Zap, title: "La tua carta giocatore", desc: "Stile FUT, sale di livello a ogni partita." },
  { icon: Trophy, title: "Partite e tornei", desc: "Organizza, iscriviti, gioca. In due tap." },
  { icon: Users, title: "Classifica e rating", desc: "Rating Glicko: scopri quanto vali davvero." },
  { icon: Crown, title: "Re dei Bagni", desc: "Conquista i campi e difendi il tuo trono." },
]

export default function DownloadPage() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col px-5 pb-10 pt-12">
      {/* Hero */}
      <div className="flex flex-col items-center text-center">
        <Image
          src="/sander-logo.png"
          alt="SANDER"
          width={96}
          height={96}
          className="h-24 w-24 object-contain"
          priority
        />
        <h1 className="mt-4 text-4xl font-black leading-tight text-white">
          SANDER<span className="text-[var(--accent)]">.</span>
        </h1>
        <p className="mt-2 text-lg font-bold text-white">Il tuo beach volley. Tutto in un&apos;app.</p>
        <p className="mt-1 text-sm text-[var(--muted-text)]">
          Crea la tua carta, gioca, sali in classifica.
        </p>
      </div>

      {/* Install CTA — Android via Google Play (primary), iPhone via PWA */}
      <div className="mt-8 space-y-3">
        <GooglePlayButton />
        <InstallButton />
      </div>

      {/* Features */}
      <div className="mt-10 grid grid-cols-1 gap-3">
        {FEATURES.map((f) => (
          <div
            key={f.title}
            className="flex items-center gap-4 rounded-2xl bg-[var(--surface-2)] p-4"
          >
            <div
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
              style={{ background: "rgba(201,243,29,0.12)" }}
            >
              <f.icon className="h-5 w-5 text-[var(--accent)]" />
            </div>
            <div>
              <p className="font-black text-white">{f.title}</p>
              <p className="text-sm text-[var(--muted-text)]">{f.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <p className="mt-8 text-center text-xs text-[var(--muted-text)]">
        Gratis · Android su Google Play · iPhone come web app
      </p>
    </div>
  )
}
