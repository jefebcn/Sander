"use client"

import { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import { Info, X, Trophy, Users, Lock, Shuffle, Crown } from "lucide-react"

const ITEMS = [
  {
    icon: <Trophy className="h-4 w-4" />,
    label: "Cos'è un torneo?",
    description:
      "Un torneo è una competizione organizzata con partite ufficiali, classifica finale e statistiche salvate per sempre. A differenza delle partite libere, qui ogni risultato conta per il tuo profilo.",
  },
  {
    icon: <Shuffle className="h-4 w-4" />,
    label: "Tipi di torneo",
    description:
      "Chicece: format di beach volley dove i giocatori ruotano i partner ad ogni giro. King of the Beach (KOTB): torneo ad eliminazione con sfide progressive. Brackets / Double Elimination: tabellone classico con ripescaggi.",
  },
  {
    icon: <Users className="h-4 w-4" />,
    label: "Come ci si iscrive?",
    description:
      "Se il torneo è aperto alle iscrizioni, trovi un tasto per iscriverti direttamente dalla pagina del torneo. Alcuni tornei sono a pagamento (con Stripe o contanti), altri sono gratuiti.",
  },
  {
    icon: <Lock className="h-4 w-4" />,
    label: "Chi vede le partite?",
    description:
      "Le partite e la classifica di un torneo sono visibili a tutti gli iscritti. I dettagli completi (punteggi, avanzamenti) si vedono solo una volta entrati nel torneo.",
  },
  {
    icon: <Crown className="h-4 w-4" />,
    label: "Classifica e statistiche",
    description:
      "Al termine del torneo viene generata una classifica ufficiale. Vittorie, sconfitte e il rating GLK vengono aggiornati automaticamente per ogni partecipante.",
  },
  {
    icon: <Trophy className="h-4 w-4" />,
    label: "Chi può creare un torneo?",
    description:
      'Solo gli admin o il creatore dell\'app possono aprire nuovi tornei (tasto "+ Nuovo" in alto). Se vuoi organizzarne uno, contatta chi gestisce Sander.',
  },
]

export function TournamentsInfoSheet() {
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  const sheet = open ? (
    <div
      className="fixed inset-0 z-[999] flex items-end"
      style={{ background: "rgba(0,0,0,0.7)" }}
      onClick={() => setOpen(false)}
    >
      <div
        className="w-full rounded-t-3xl bg-[var(--surface-1)] p-5 space-y-3 overflow-y-auto"
        style={{
          maxHeight: "80vh",
          paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 5.5rem)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-1 h-1 w-10 rounded-full bg-white/20" />
        <div className="flex items-center justify-between pb-1">
          <p className="text-base font-black text-white">Come funzionano i Tornei?</p>
          <button
            onClick={() => setOpen(false)}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--surface-2)]"
          >
            <X className="h-4 w-4 text-white" />
          </button>
        </div>
        {ITEMS.map((item) => (
          <div key={item.label} className="rounded-2xl bg-[var(--surface-2)] px-4 py-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[var(--accent)]">{item.icon}</span>
              <p className="text-xs font-black uppercase tracking-wider text-[var(--accent)]">
                {item.label}
              </p>
            </div>
            <p className="text-sm text-white/80 leading-relaxed">{item.description}</p>
          </div>
        ))}
      </div>
    </div>
  ) : null

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--muted-text)] active:opacity-60"
        aria-label="Come funzionano i tornei"
      >
        <Info className="h-5 w-5" />
      </button>
      {mounted && createPortal(sheet, document.body)}
    </>
  )
}
