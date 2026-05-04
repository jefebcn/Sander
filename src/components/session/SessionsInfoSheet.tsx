"use client"

import { useState } from "react"
import { Info, X, Plus, Eye, BarChart2, Trophy, Filter } from "lucide-react"

const ITEMS = [
  {
    icon: <Plus className="h-4 w-4" />,
    label: "Crea una partita",
    description:
      'Chiunque può creare una sessione di gioco toccando "+ Crea una partita". Scegli il formato (2v2, 3v3, 4v4), il luogo e l\'orario. Una volta creata, la partita è visibile a tutti gli iscritti.',
  },
  {
    icon: <Eye className="h-4 w-4" />,
    label: "Chi vede i risultati?",
    description:
      "I punteggi e i dettagli di una partita sono visibili a tutti i giocatori presenti in quella sessione. Se non hai partecipato, vedi solo le informazioni base (luogo, formato, data).",
  },
  {
    icon: <BarChart2 className="h-4 w-4" />,
    label: "Come vengono salvati i dati?",
    description:
      "Ogni partita completata aggiorna automaticamente le tue statistiche: vittorie, sconfitte, winrate e il tuo rating GLK (Glicko). Non devi fare nulla — tutto avviene in automatico.",
  },
  {
    icon: <Filter className="h-4 w-4" />,
    label: "Filtri formato",
    description:
      'I bottoni in cima (Tutti · 2v2 · 3v3 · 4v4) filtrano le partite per formato. Tocca un formato per vedere solo quelle partite, tocca "Tutti" per tornare alla lista completa.',
  },
  {
    icon: <Trophy className="h-4 w-4" />,
    label: "Stato della partita",
    description:
      '"Aperta" = si può ancora partecipare. "Completa" = tutti i posti occupati. "Completata" = partita finita, i risultati sono stati salvati. "Annullata" = la sessione non si è tenuta.',
  },
  {
    icon: <span className="text-sm">🍺</span>,
    label: "Il badge Birra",
    description:
      "Appare quando chi ha organizzato la sessione ha offerto una birra ai partecipanti. È un piccolo riconoscimento per il gesto!",
  },
]

export function SessionsInfoSheet() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--muted-text)] active:opacity-60"
        aria-label="Come funzionano le partite"
      >
        <Info className="h-5 w-5" />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end overflow-y-auto"
          style={{ background: "rgba(0,0,0,0.65)" }}
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full rounded-t-3xl bg-[var(--surface-1)] p-5 space-y-3"
            style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 2.5rem)" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Handle */}
            <div className="mx-auto mb-1 h-1 w-10 rounded-full bg-white/20" />

            {/* Header */}
            <div className="flex items-center justify-between pb-1">
              <p className="text-base font-black text-white">Come funzionano le Partite?</p>
              <button
                onClick={() => setOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--surface-2)]"
              >
                <X className="h-4 w-4 text-white" />
              </button>
            </div>

            {/* Items */}
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
      )}
    </>
  )
}
