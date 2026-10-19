"use client"

import { useState, useSyncExternalStore } from "react"
import { createPortal } from "react-dom"
import { Info, X } from "lucide-react"

const ITEMS = [
  {
    label: "PUNTI — il tuo rating",
    description:
      "Il tuo rating competitivo. Sale quando batti giocatori più forti, scende quando perdi contro i più deboli. Più giochi, più è preciso.",
  },
  {
    label: "PARTITE",
    description: "Quante partite hai giocato in totale su Sander.",
  },
  {
    label: "ORG. — Organizzate",
    description: "Quante sessioni di gioco hai creato e organizzato per gli altri.",
  },
  {
    label: "WIN RATE — Tasso vittorie",
    description:
      "La barra mostra la percentuale di vittorie sul totale. Tutto rosso = poche vittorie, tutto verde = vinci spesso. La percentuale e il conteggio vinte/giocate sono sempre visibili.",
  },
  {
    label: "TITOLO",
    description:
      "Il titolo cambia man mano che sali di livello: Drop-In → Sand Digger → Setter → Spiker → Ace → Sand King.",
  },
  {
    label: "LIVELLO & XP",
    description:
      "Guadagni XP giocando partite, organizzando sessioni e partecipando ai tornei. Ogni 100 XP sali di livello e sblocchi un nuovo titolo.",
  },
]

function noopSubscribe() {
  return () => {}
}

export function StatsInfoSheet() {
  const [open, setOpen] = useState(false)
  // Portals need document: true only on the client, without an effect.
  const mounted = useSyncExternalStore(noopSubscribe, () => true, () => false)

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
            className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--surface-2)]"
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
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[var(--muted-text)] active:opacity-60"
        aria-label="Informazioni statistiche"
      >
        <Info className="h-5 w-5" />
      </button>

      {mounted && createPortal(sheet, document.body)}
    </>
  )
}

