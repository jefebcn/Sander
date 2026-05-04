"use client"

import { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import { Info, X } from "lucide-react"

const ITEMS = [
  {
    label: "GLK — Glicko",
    description:
      "Il tuo rating competitivo. Sale quando batti giocatori più forti, scende quando perdi contro i più deboli. Più giochi, più è preciso.",
  },
  {
    label: "PLA — Partite",
    description: "Quante partite hai giocato in totale su Sander.",
  },
  {
    label: "ORG — Organizzate",
    description: "Quante sessioni di gioco hai creato e organizzato per gli altri.",
  },
  {
    label: "STREAK — Barra vittorie",
    description:
      "La barra mostra il tuo rapporto vittorie / partite totali. Tutto rosso = poche vittorie, tutto verde = vinci spesso. Il numero a destra sono le vittorie totali.",
  },
  {
    label: "LIVELLO & XP",
    description:
      "Guadagni XP giocando partite, organizzando sessioni e partecipando ai tornei. Ogni 100 XP sali di livello e sblocchi un nuovo titolo.",
  },
]

export function StatsInfoSheet() {
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
        className="w-full rounded-t-3xl bg-[var(--surface-1)] p-5 space-y-4 overflow-y-auto"
        style={{
          maxHeight: "80vh",
          paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 5.5rem)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-1 h-1 w-10 rounded-full bg-white/20" />
        <div className="flex items-center justify-between">
          <p className="text-base font-black text-white">Cosa significano i dati?</p>
          <button
            onClick={() => setOpen(false)}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--surface-2)]"
          >
            <X className="h-4 w-4 text-white" />
          </button>
        </div>
        <div className="space-y-3">
          {ITEMS.map((item) => (
            <div key={item.label} className="rounded-2xl bg-[var(--surface-2)] px-4 py-3">
              <p className="text-xs font-black uppercase tracking-wider text-[var(--accent)]">
                {item.label}
              </p>
              <p className="mt-1 text-sm text-white/80">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  ) : null

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-7 w-7 items-center justify-center rounded-full text-[var(--muted-text)] active:opacity-60"
        aria-label="Informazioni statistiche"
      >
        <Info className="h-4 w-4" />
      </button>

      {mounted && createPortal(sheet, document.body)}
    </>
  )
}

