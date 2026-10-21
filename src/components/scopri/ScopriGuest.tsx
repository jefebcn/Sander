import Link from "next/link"
import { Heart, MessageCircle, Users, Volleyball } from "lucide-react"
import { SCOPRI_PHOTO_BG } from "./photoBanner"

const STEPS = [
  { icon: Heart, title: "Like su quello che ti colpisce", text: "Una foto in campo, una risposta. Con un commento, se vuoi." },
  { icon: MessageCircle, title: "Match e chat", text: "Se ricambia, si apre la chat e proponi la partita in un tocco." },
  { icon: Users, title: "Anche in coppia", text: "Formate una coppia e sfidate le altre coppie per il 2v2." },
  { icon: Volleyball, title: "E poi in campo", text: "La partita va in calendario, il risultato sulla tua carta." },
]

/** Scopri for visitors: what it is, and one button to start. */
export function ScopriGuest() {
  return (
    <section className="flex flex-col gap-5 pt-[calc(env(safe-area-inset-top,0px)+1rem)]">
      <div className="min-h-[14rem] overflow-hidden rounded-[var(--radius-lg)] p-5 shadow-[var(--shadow-card)]" style={{ background: SCOPRI_PHOTO_BG }}>
        <div className="max-w-[62%]">
          <p className="eyebrow text-white/80">Nuovo su SANDER</p>
          <h1 className="font-hand mt-2 text-[2.6rem] leading-[0.98] text-white">Scopri chi gioca con te.</h1>
          <p className="mt-3 font-serif text-xl leading-snug text-white/90">
            Swipe tra i giocatori della Riviera, fai match, scendete in campo.
          </p>
        </div>
      </div>
      <ol className="flex flex-col gap-2">
        {STEPS.map((s, i) => (
          <li key={s.title} className="flex items-start gap-4 rounded-[var(--radius-md)] bg-[var(--surface-2)] p-4">
            <span className="num flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--accent-soft)] text-lg text-[var(--accent)]">{i + 1}</span>
            <span>
              <span className="flex items-center gap-2 text-base font-extrabold text-white">
                <s.icon className="h-4 w-4 text-[var(--accent)]" aria-hidden="true" /> {s.title}
              </span>
              <span className="block text-sm text-[var(--muted-text)]">{s.text}</span>
            </span>
          </li>
        ))}
      </ol>
      <Link
        href="/auth/signin?mode=register&callbackUrl=/scopri"
        className="pressable flex min-h-[3.75rem] items-center justify-center rounded-full bg-[var(--accent)] text-lg font-extrabold text-black shadow-[var(--shadow-glow)]"
      >
        Inizia gratis
      </Link>
      <p className="text-center text-sm text-[var(--muted-text)]">Solo maggiorenni. Mostriamo l&apos;età e il comune, mai altro.</p>
    </section>
  )
}
