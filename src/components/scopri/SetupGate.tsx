import Link from "next/link"
import { Camera, MessageSquareQuote, CalendarHeart, ShieldAlert, MapPin, ChevronRight, Check } from "lucide-react"
import type { MissingStep } from "@/lib/scopri/rules"
import { PROMPT_COUNT } from "@/lib/scopri/rules"

const STEPS: Record<MissingStep, { icon: React.ReactNode; title: string; text: string }> = {
  photo: { icon: <Camera className="h-5 w-5" aria-hidden="true" />, title: "Almeno una foto", text: "Meglio se in campo: fino a 6" },
  prompts: { icon: <MessageSquareQuote className="h-5 w-5" aria-hidden="true" />, title: `${PROMPT_COUNT} risposte`, text: "Il tuo colpo migliore, che compagno cerchi…" },
  birthDate: { icon: <CalendarHeart className="h-5 w-5" aria-hidden="true" />, title: "La tua data di nascita", text: "Scopri è per maggiorenni: mostriamo solo l'età" },
  adult: { icon: <ShieldAlert className="h-5 w-5" aria-hidden="true" />, title: "Scopri è per chi ha 18 anni", text: "Intanto puoi giocare e trovare partite in Gioca" },
  city: { icon: <MapPin className="h-5 w-5" aria-hidden="true" />, title: "Il comune dove giochi", text: "Ti mostriamo chi gioca vicino" },
}

/** What's still missing before you can swipe, as a short checklist. */
export function SetupGate({ missing }: { missing: MissingStep[] }) {
  const minor = missing.includes("adult")
  const all: MissingStep[] = minor ? ["adult"] : ["photo", "prompts", "birthDate", "city"]
  return (
    <section className="flex flex-col gap-4">
      <div className="rounded-[var(--radius-lg)] p-6 shadow-[var(--shadow-card)]" style={{ background: "linear-gradient(150deg, color-mix(in srgb, var(--accent) 30%, var(--surface-2)), var(--surface-2) 65%)" }}>
        <p className="eyebrow text-[var(--accent)]">Trova con chi giocare</p>
        <h2 className="font-hand mt-2 text-[2.75rem] leading-none text-white">Un compagno al tuo livello, a un swipe.</h2>
        <p className="mt-3 font-serif text-2xl leading-snug text-white/90">
          Like su una foto o su una risposta, match, chat, e sabato si gioca.
        </p>
      </div>
      <ol className="flex flex-col gap-2">
        {all.map((id) => {
          const s = STEPS[id]
          const done = !missing.includes(id)
          return (
            <li key={id}>
              <Link
                href={minor ? "/sessions" : "/scopri/profilo"}
                className="pressable flex min-h-[4rem] items-center gap-3 rounded-[var(--radius-md)] bg-[var(--surface-2)] px-4"
              >
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${done ? "bg-[var(--success)] text-black" : "bg-[var(--accent-soft)] text-[var(--accent)]"}`}>
                  {done ? <Check className="h-5 w-5" aria-hidden="true" /> : s.icon}
                </span>
                <span className="min-w-0 flex-1">
                  <span className={`block text-base font-bold ${done ? "text-[var(--muted-text)] line-through" : "text-white"}`}>{s.title}</span>
                  {!done && <span className="block text-sm text-[var(--muted-text)]">{s.text}</span>}
                </span>
                {!done && <ChevronRight className="h-5 w-5 text-[var(--accent)]" aria-hidden="true" />}
              </Link>
            </li>
          )
        })}
      </ol>
      {!minor && (
        <Link
          href="/onboarding/scopri"
          className="pressable flex min-h-[3.75rem] items-center justify-center rounded-full bg-[var(--accent)] text-lg font-extrabold text-black shadow-[var(--shadow-glow)]"
        >
          Crea il profilo in un minuto
        </Link>
      )}
      {!minor && (
        <Link href="/profile?tab=invita" className="flex min-h-[3.5rem] items-center justify-center text-base font-bold text-[var(--accent)]">
          Porta i tuoi compagni su Scopri
        </Link>
      )}
    </section>
  )
}
