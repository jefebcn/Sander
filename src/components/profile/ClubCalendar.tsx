"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Plus, Trash2, Trophy } from "lucide-react"
import { toast } from "sonner"
import { createClubEvent, deleteClubEvent } from "@/actions/clubCalendar"
import { CLUB_EVENT_KINDS, KIND_META, type ClubEventKind } from "@/lib/clubCalendar"
import { cn } from "@/lib/utils"
import { Sheet } from "@/components/ui/Sheet"

export interface PlacedItem {
  id: string
  kind: string
  title: string
  start: string
  end: string
  court: number | null
  note: string | null
  rowStart: number
  rowEnd: number
  colStart: number
  colEnd: number
}

interface Props {
  clubId: string
  day: string
  courts: number
  startHour: number
  endHour: number
  placed: PlacedItem[]
  tournaments: { id: string; name: string; time: string | null }[]
}

interface Draft {
  kind: ClubEventKind
  title: string
  day: string
  start: string
  end: string
  court: number | null
  note: string
}

const pad = (n: number) => String(n).padStart(2, "0")
const FIELD = "min-h-[3.25rem] w-full rounded-2xl bg-[var(--surface-2)] px-4 text-base text-white placeholder:text-[var(--muted-text)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
const LABEL = "mb-1 block px-1 text-sm font-bold text-[var(--muted-text)]"
const ROW = 22

function kindOf(k: string): ClubEventKind {
  return (CLUB_EVENT_KINDS as readonly string[]).includes(k) ? (k as ClubEventKind) : "EVENTO"
}

/** The club's day, court by court: tap a free hour to book it, tap an entry to see or remove it. */
export function ClubCalendar({ clubId, day, courts, startHour, endHour, placed, tournaments }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [draft, setDraft] = useState<Draft | null>(null)
  const [open, setOpen] = useState<PlacedItem | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const hours = Array.from({ length: endHour - startHour }, (_, i) => startHour + i)
  const courtList = Array.from({ length: courts }, (_, i) => i + 1)

  function newDraft(court: number | null, hour?: number) {
    const h = hour ?? 18
    setDraft({ kind: "PARTITA", title: "", day, start: `${pad(h)}:00`, end: `${pad((h + 1) % 24)}:00`, court, note: "" })
  }

  function save() {
    if (!draft) return
    startTransition(async () => {
      const res = await createClubEvent({ clubId, ...draft, title: draft.title.trim() || KIND_META[draft.kind].label })
      if (!res.ok) return void toast.error(res.error)
      toast.success("Aggiunto al calendario")
      setDraft(null)
      router.refresh()
    })
  }

  function remove(id: string) {
    startTransition(async () => {
      const res = await deleteClubEvent({ id })
      if (!res.ok) return void toast.error(res.error)
      toast.success("Eliminato")
      setOpen(null)
      setConfirmDelete(false)
      router.refresh()
    })
  }

  return (
    <div className="flex flex-col gap-3">
      {tournaments.map((t) => (
        <Link key={t.id} href={`/tournaments/${t.id}`} className="flex min-h-[3.25rem] items-center gap-3 rounded-2xl bg-[var(--surface-2)] px-4 ring-1 ring-[var(--border)]">
          <Trophy className="h-5 w-5 shrink-0 text-[var(--compete)]" aria-hidden="true" />
          <span className="min-w-0 flex-1 truncate text-base font-bold text-white">{t.name}</span>
          <span className="shrink-0 text-sm font-bold text-[var(--compete)]">{t.time ? `dalle ${t.time}` : "torneo"}</span>
        </Link>
      ))}

      <div className="overflow-x-auto rounded-[1.25rem] bg-[var(--surface-1)] p-2 [scrollbar-width:none]">
        <div
          className="grid gap-x-1"
          style={{
            gridTemplateColumns: `2.5rem repeat(${courts}, minmax(5.25rem, 1fr))`,
            gridTemplateRows: `2rem repeat(${hours.length * 2}, ${ROW}px)`,
          }}
        >
          {courtList.map((c) => (
            <div key={`h${c}`} className="flex items-center justify-center text-xs font-extrabold text-[var(--muted-text)]" style={{ gridColumn: c + 1, gridRow: 1 }}>
              Campo {c}
            </div>
          ))}
          {hours.map((h, i) => (
            <div key={`t${h}`} className="pt-0.5 text-xs font-bold text-[var(--muted-text)]" style={{ gridColumn: 1, gridRow: `${i * 2 + 2} / span 2` }}>
              {pad(h % 24)}:00
            </div>
          ))}
          {hours.flatMap((h, i) =>
            courtList.map((c) => (
              <button
                key={`f${h}-${c}`}
                type="button"
                onClick={() => newDraft(c, h % 24)}
                aria-label={`Campo ${c} alle ${pad(h % 24)}:00 libero: aggiungi`}
                className="m-[1px] rounded-lg border border-dashed border-white/[0.06] active:bg-white/5"
                style={{ gridColumn: c + 1, gridRow: `${i * 2 + 2} / span 2` }}
              />
            )),
          )}
          {placed.map((p) => {
            const tone = KIND_META[kindOf(p.kind)].tone
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  setConfirmDelete(false)
                  setOpen(p)
                }}
                className="relative z-10 m-[1px] overflow-hidden rounded-lg px-2 py-1 text-left"
                style={{
                  gridColumn: `${p.colStart + 1} / ${p.colEnd + 1}`,
                  gridRow: `${p.rowStart + 1} / ${p.rowEnd + 1}`,
                  background: "var(--surface-3)",
                  borderLeft: `3px solid ${tone}`,
                  color: tone,
                }}
              >
                <span className="block truncate text-xs font-extrabold leading-tight">{p.title}</span>
                <span className="block truncate text-[11px] font-bold leading-tight opacity-80">
                  {p.start}–{p.end}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1 px-1 text-xs font-bold text-[var(--muted-text)]">
        {CLUB_EVENT_KINDS.map((k) => (
          <span key={k} className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ background: KIND_META[k].tone }} aria-hidden="true" />
            {KIND_META[k].label}
          </span>
        ))}
      </div>

      <button type="button" onClick={() => newDraft(courts === 1 ? 1 : null)} className="btn btn-primary w-full gap-2">
        <Plus className="h-5 w-5" aria-hidden="true" /> Aggiungi al calendario
      </button>

      {/* New entry */}
      <Sheet open={!!draft} onOpenChange={(o) => !o && setDraft(null)} title="Nuovo nel calendario">
        {draft && (
          <div className={cn("flex flex-col gap-3", pending && "pointer-events-none opacity-60")}>
            <div className="grid grid-cols-2 gap-2" role="group" aria-label="Tipo">
              {CLUB_EVENT_KINDS.map((k) => (
                <button
                  key={k}
                  type="button"
                  aria-pressed={draft.kind === k}
                  onClick={() => setDraft({ ...draft, kind: k })}
                  className={cn("flex min-h-[3.5rem] flex-col items-start justify-center rounded-2xl px-3 text-left", draft.kind === k ? "sel-on" : "sel-off")}
                >
                  <span className="text-sm font-extrabold">{KIND_META[k].label}</span>
                  <span className={cn("text-xs leading-tight", draft.kind === k ? "text-black/70" : "text-white/60")}>{KIND_META[k].hint}</span>
                </button>
              ))}
            </div>
            <div>
              <label htmlFor="ev-title" className={LABEL}>Cosa c&apos;è</label>
              <input
                id="ev-title"
                value={draft.title}
                maxLength={60}
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                placeholder={draft.kind === "PARTITA" ? "Es. Rossi, partita 2v2" : draft.kind === "ALLENAMENTO" ? "Es. Lezione con coach Dani" : draft.kind === "CHIUSO" ? "Es. Manutenzione sabbia" : "Es. Open day"}
                className={FIELD}
              />
            </div>
            <div>
              <label htmlFor="ev-day" className={LABEL}>Giorno</label>
              <input id="ev-day" type="date" value={draft.day} onChange={(e) => setDraft({ ...draft, day: e.target.value })} className={FIELD} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label htmlFor="ev-start" className={LABEL}>Dalle</label>
                <input id="ev-start" type="time" step={900} value={draft.start} onChange={(e) => setDraft({ ...draft, start: e.target.value })} className={FIELD} />
              </div>
              <div>
                <label htmlFor="ev-end" className={LABEL}>Alle</label>
                <input id="ev-end" type="time" step={900} value={draft.end} onChange={(e) => setDraft({ ...draft, end: e.target.value })} className={FIELD} />
              </div>
            </div>
            <div>
              <label htmlFor="ev-court" className={LABEL}>Campo</label>
              <select
                id="ev-court"
                value={draft.court ?? ""}
                onChange={(e) => setDraft({ ...draft, court: e.target.value ? Number(e.target.value) : null })}
                className={FIELD}
              >
                {courts > 1 && <option value="">Tutti i campi</option>}
                {courtList.map((c) => (
                  <option key={c} value={c}>Campo {c}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="ev-note" className={LABEL}>Nota (facoltativa)</label>
              <input id="ev-note" value={draft.note} maxLength={200} onChange={(e) => setDraft({ ...draft, note: e.target.value })} placeholder="Telefono, chi paga, cosa portare…" className={FIELD} />
            </div>
            <button type="button" onClick={save} disabled={pending} className="btn btn-primary w-full">
              Salva
            </button>
          </div>
        )}
      </Sheet>

      {/* Entry details */}
      <Sheet open={!!open} onOpenChange={(o) => !o && setOpen(null)} title={open?.title ?? ""}>
        {open && (
          <div className="flex flex-col gap-3">
            <div className="rounded-2xl bg-[var(--surface-2)] p-4 text-base text-white">
              <p className="font-extrabold" style={{ color: KIND_META[kindOf(open.kind)].tone }}>{KIND_META[kindOf(open.kind)].label}</p>
              <p className="mt-1">
                {open.start}–{open.end} · {open.court === null ? "tutti i campi" : `campo ${open.court}`}
              </p>
              {open.note && <p className="mt-2 text-[var(--muted-text)]">{open.note}</p>}
            </div>
            <button
              type="button"
              disabled={pending}
              onClick={() => (confirmDelete ? remove(open.id) : setConfirmDelete(true))}
              className="flex min-h-[3.5rem] w-full items-center justify-center gap-2 rounded-full bg-[var(--surface-2)] text-base font-bold text-[var(--danger)] disabled:opacity-60"
            >
              <Trash2 className="h-5 w-5" aria-hidden="true" />
              {confirmDelete ? "Tocca di nuovo per eliminare" : "Elimina"}
            </button>
          </div>
        )}
      </Sheet>
    </div>
  )
}
