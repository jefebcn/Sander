"use client"

/* eslint-disable @next/next/no-img-element -- user photos from Blob, any size */
import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { MessageCircle, CalendarPlus, Flag, HeartOff, MoreHorizontal, Volleyball } from "lucide-react"
import { toast } from "sonner"
import { Sheet } from "@/components/ui/Sheet"
import { answerPlayed, unmatch, proposeGameTogether } from "@/actions/scopri"
import { cn } from "@/lib/utils"
import { ProposeGameSheet } from "./ProposeGameSheet"
import { ReportSheet } from "./ReportSheet"
import type { MatchRow } from "./types"

const SECTIONS: { turn: MatchRow["turn"]; title: string; hint: string }[] = [
  { turn: "tocca-a-te", title: "Tocca a te", hint: "Ti hanno scritto: rispondi prima che si raffreddi" },
  { turn: "nuovo", title: "Nuovi match", hint: "Nessuno ha ancora scritto: rompi il ghiaccio" },
  { turn: "in-attesa", title: "In attesa", hint: "Hai scritto tu: aspetta la risposta" },
]

/** Matches by whose turn it is, each one a tap from the chat or the calendar. */
export function MatchListView({ matches, myCity }: { matches: MatchRow[]; myCity: string | null }) {
  const router = useRouter()
  const [menu, setMenu] = useState<MatchRow | null>(null)
  const [propose, setPropose] = useState<MatchRow | null>(null)
  const [report, setReport] = useState<MatchRow | null>(null)

  async function played(m: MatchRow, yes: boolean) {
    try {
      await answerPlayed({ matchId: m.id, played: yes })
      toast.success(yes ? "Grande! Rigiocate presto." : "Ok, magari la prossima volta.")
      router.refresh()
    } catch {
      toast.error("Non riuscito")
    }
  }

  async function doUnmatch(m: MatchRow) {
    if (!window.confirm(`Annullare il match con ${m.other.name}? Non vi vedrete più e la chat si chiude.`)) return
    try {
      await unmatch({ matchId: m.id })
      setMenu(null)
      router.refresh()
    } catch {
      toast.error("Non riuscito")
    }
  }

  if (matches.length === 0) {
    return (
      <div className="rounded-[var(--radius-lg)] bg-[var(--surface-2)] px-6 py-12 text-center">
        <MessageCircle className="mx-auto h-8 w-8 text-[var(--social)]" aria-hidden="true" />
        <p className="mt-3 font-display text-2xl font-extrabold text-white">Nessun match per ora</p>
        <p className="mt-1 text-base text-[var(--muted-text)]">Manda qualche like con un commento: è lì che nascono.</p>
        <Link href="/scopri" className="mt-4 inline-flex min-h-[3.5rem] items-center rounded-full bg-[var(--accent)] px-6 text-base font-extrabold text-black">
          Vai a Scopri
        </Link>
      </div>
    )
  }

  const askPlayed = matches.filter((m) => m.askPlayed)

  return (
    <div className="flex flex-col gap-6">
      {askPlayed.slice(0, 1).map((m) => (
        <section key={`played-${m.id}`} className="rounded-[var(--radius-lg)] bg-[var(--surface-2)] p-4 ring-1 ring-[var(--tone-line)] tone-social">
          <p className="eyebrow flex items-center gap-1 text-[var(--social)]">
            <Volleyball className="h-3.5 w-3.5" aria-hidden="true" /> Com&apos;è andata?
          </p>
          <p className="mt-1 font-serif text-2xl text-white">Avete giocato insieme, tu e {m.other.name}?</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button type="button" onClick={() => played(m, false)} className="min-h-[3.5rem] rounded-full bg-[var(--surface-4)] text-base font-bold text-white">
              Non ancora
            </button>
            <button type="button" onClick={() => played(m, true)} className="min-h-[3.5rem] rounded-full bg-[var(--social)] text-base font-extrabold text-black">
              Sì!
            </button>
          </div>
        </section>
      ))}

      {SECTIONS.map((s) => {
        const rows = matches.filter((m) => m.turn === s.turn)
        if (rows.length === 0) return null
        return (
          <section key={s.turn} aria-labelledby={`sec-${s.turn}`}>
            <h2 id={`sec-${s.turn}`} className="font-display text-2xl font-extrabold text-white">
              {s.title} <span className="text-[var(--muted-text)]">{rows.length}</span>
            </h2>
            <p className="mb-2 text-sm text-[var(--muted-text)]">{s.hint}</p>
            <ul className="flex flex-col gap-2">
              {rows.map((m) => (
                <li key={m.id} className="flex items-center gap-2 rounded-[var(--radius-md)] bg-[var(--surface-2)] p-2 pr-1">
                  <Link href={m.threadId ? `/messaggi/${m.threadId}` : "/messaggi"} className="flex min-h-[3.5rem] min-w-0 flex-1 items-center gap-3">
                    <span className={cn("relative h-14 w-14 shrink-0 overflow-hidden rounded-full bg-[var(--surface-4)]", s.turn === "tocca-a-te" && "ring-2 ring-[var(--accent)]")}>
                      {m.other.photo && <img src={m.other.photo} alt="" className="h-full w-full object-cover" />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="truncate text-base font-extrabold text-white">{m.other.name}</span>
                        {m.unread && <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-[var(--love)]" aria-label="Messaggio non letto" />}
                      </span>
                      <span className="block truncate text-sm text-[var(--muted-text)]">
                        {m.lastMessage ?? `${m.other.role === "BLOCKER" ? "Muro" : "Difesa"}${m.other.homeCity ? ` · ${m.other.homeCity}` : ""}`}
                      </span>
                    </span>
                  </Link>
                  <button
                    type="button"
                    onClick={() => setMenu(m)}
                    aria-label={`Altre azioni per ${m.other.name}`}
                    className="flex h-14 w-12 shrink-0 items-center justify-center rounded-full text-[var(--muted-text)]"
                  >
                    <MoreHorizontal className="h-6 w-6" aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )
      })}

      <Sheet open={menu !== null} onOpenChange={(o) => !o && setMenu(null)} title={menu?.other.name ?? ""}>
        {menu && (
          <div className="flex flex-col gap-2">
            <Link href={menu.threadId ? `/messaggi/${menu.threadId}` : "/messaggi"} className="flex min-h-[3.5rem] items-center gap-3 rounded-[var(--radius-md)] bg-[var(--surface-2)] px-4 text-base font-bold text-white">
              <MessageCircle className="h-5 w-5 text-[var(--social)]" aria-hidden="true" /> Apri la chat
            </Link>
            <button
              type="button"
              onClick={() => {
                setPropose(menu)
                setMenu(null)
              }}
              className="flex min-h-[3.5rem] items-center gap-3 rounded-[var(--radius-md)] bg-[var(--surface-2)] px-4 text-left text-base font-bold text-white"
            >
              <CalendarPlus className="h-5 w-5 text-[var(--accent)]" aria-hidden="true" /> Crea la partita insieme
            </button>
            <button
              type="button"
              onClick={() => doUnmatch(menu)}
              className="flex min-h-[3.5rem] items-center gap-3 rounded-[var(--radius-md)] bg-[var(--surface-2)] px-4 text-left text-base font-bold text-white"
            >
              <HeartOff className="h-5 w-5 text-[var(--muted-text)]" aria-hidden="true" /> Annulla il match
            </button>
            <button
              type="button"
              onClick={() => {
                setReport(menu)
                setMenu(null)
              }}
              className="flex min-h-[3.5rem] items-center gap-3 rounded-[var(--radius-md)] bg-[var(--surface-2)] px-4 text-left text-base font-bold text-[var(--danger)]"
            >
              <Flag className="h-5 w-5" aria-hidden="true" /> Segnala
            </button>
          </div>
        )}
      </Sheet>

      {propose && (
        <ProposeGameSheet
          open
          onOpenChange={(o) => !o && setPropose(null)}
          title={`Gioca con ${propose.other.name}`}
          description="Voi due in coppia: SANDER cerca i due avversari tra chi gioca vicino."
          defaultCity={propose.other.homeCity ?? myCity}
          submit={(input) => proposeGameTogether({ matchId: propose.id, ...input })}
        />
      )}
      {report && (
        <ReportSheet open onOpenChange={(o) => !o && setReport(null)} playerId={report.other.id} name={report.other.name} />
      )}
    </div>
  )
}
