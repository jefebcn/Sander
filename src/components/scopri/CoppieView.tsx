"use client"

/* eslint-disable @next/next/no-img-element -- user photos from Blob, any size */
import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Swords, X, Loader2, UserPlus, MessageCircle, CalendarPlus, Check, LogOut, Pencil, Users } from "lucide-react"
import { toast } from "sonner"
import { Sheet } from "@/components/ui/Sheet"
import {
  inviteDuoPartner,
  respondDuoInvite,
  leaveDuo,
  updateDuo,
  likeDuo,
  skipDuo,
  respondDuoLike,
  proposeDuoGame,
} from "@/actions/coppie"
import { COMMENT_MAX, MOTTO_MAX } from "@/lib/scopri/rules"
import { cn } from "@/lib/utils"
import { ProposeGameSheet } from "./ProposeGameSheet"
import type { DuoCard, DuoMember, DuoMatchRow, IncomingDuoLike } from "./types"
import type { DuoRankRow } from "@/lib/scopri/duos"
import { resizedPhoto } from "@/lib/photo"
import { shownAffinity } from "@/lib/scopri/score"

export interface CoppieData {
  meId: string
  myCity: string | null
  duo: DuoCard | null
  sent: DuoCard | null
  invites: DuoCard[]
  candidates: DuoMember[]
  deck: DuoCard[]
  likesLeft: number
  incoming: IncomingDuoLike[]
  matches: DuoMatchRow[]
  leaderboard: DuoRankRow[]
}

function Leaderboard({ rows, mine }: { rows: DuoRankRow[]; mine?: string }) {
  if (rows.length === 0) {
    return <p className="rounded-[var(--radius-md)] bg-[var(--surface-2)] p-4 text-base text-[var(--muted-text)]">Ancora nessuna coppia in classifica.</p>
  }
  return (
    <ol className="flex flex-col gap-2">
      {rows.map((r, i) => (
        <li
          key={r.id}
          className={cn(
            "flex items-center gap-3 rounded-[var(--radius-md)] bg-[var(--surface-2)] p-2 pr-4",
            r.id === mine && "ring-2 ring-[var(--social)]",
          )}
        >
          <span className={cn("num w-8 shrink-0 text-center text-xl", i < 3 ? "text-[var(--compete)]" : "text-[var(--muted-text)]")}>{i + 1}</span>
          <Faces members={r.members} size="h-10 w-10" />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-base font-extrabold text-white">{r.name}</span>
            <span className="block text-sm text-[var(--muted-text)]">
              {r.wins + r.losses === 0 ? "Ancora da giocare" : `${r.wins}V · ${r.losses}S`}
            </span>
          </span>
          <span className="num text-xl text-[var(--social)]">{r.rating}</span>
        </li>
      ))}
    </ol>
  )
}

function Faces({ members, size = "h-16 w-16" }: { members: DuoMember[]; size?: string }) {
  return (
    <span className="flex shrink-0">
      {members.map((m, i) => (
        <span key={m.id} className={cn(size, "overflow-hidden rounded-full bg-[var(--surface-4)] ring-4 ring-[var(--surface-2)]", i > 0 && "-ml-4")}>
          {m.photo ? <img src={resizedPhoto(m.photo, "thumb")} alt="" className="h-full w-full object-cover" /> : <Users className="m-auto h-full w-1/2 text-[var(--muted-text)]" aria-hidden="true" />}
        </span>
      ))}
    </span>
  )
}

function useRun() {
  const router = useRouter()
  const [busy, setBusy] = useState<string | null>(null)
  async function run(key: string, fn: () => Promise<unknown>, ok?: string) {
    setBusy(key)
    try {
      const res = await fn()
      if (ok) toast.success(ok)
      router.refresh()
      return res
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Non riuscito")
    } finally {
      setBusy(null)
    }
  }
  return { busy, run }
}

/** Coppie: form a pair, challenge other pairs, play the 2v2. */
export function CoppieView({ data }: { data: CoppieData }) {
  if (!data.duo) return <NoDuo data={data} />
  return <ActiveDuo data={data} duo={data.duo} />
}

function NoDuo({ data }: { data: CoppieData }) {
  const { busy, run } = useRun()
  const [pick, setPick] = useState<DuoMember | null>(null)
  const [name, setName] = useState("")
  const [motto, setMotto] = useState("")

  return (
    <div className="flex flex-col gap-5">
      <section className="rounded-[var(--radius-lg)] p-6 shadow-[var(--shadow-card)]" style={{ background: "linear-gradient(150deg, color-mix(in srgb, var(--social) 30%, var(--surface-2)), var(--surface-2) 65%)" }}>
        <p className="eyebrow text-[var(--social)]">2v2</p>
        <h2 className="font-hand mt-2 text-[2.75rem] leading-none text-white">Forma la tua coppia.</h2>
        <p className="mt-3 font-serif text-2xl leading-snug text-white/90">
          Poi sfidate le altre coppie: se accettano, chat a quattro e partita in calendario.
        </p>
      </section>

      {data.invites.length > 0 && (
        <section aria-labelledby="inv">
          <h3 id="inv" className="font-hand mb-2 text-[1.9rem] text-white">Ti hanno invitato</h3>
          <ul className="flex flex-col gap-2">
            {data.invites.map((d) => {
              const from = d.members[0]
              return (
                <li key={d.id} className="flex items-center gap-3 rounded-[var(--radius-md)] bg-[var(--surface-2)] p-3">
                  <Faces members={[from]} size="h-14 w-14" />
                  <span className="min-w-0 flex-1">
                    <span className="block text-base font-extrabold text-white">{from.name}</span>
                    <span className="block truncate text-sm text-[var(--muted-text)]">{d.motto ?? "Ti vuole come compagno per il 2v2"}</span>
                  </span>
                  <button
                    type="button"
                    aria-label="Rifiuta"
                    disabled={busy !== null}
                    onClick={() => run(`no-${d.id}`, () => respondDuoInvite({ duoId: d.id, accept: false }))}
                    className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--surface-4)] text-white"
                  >
                    <X className="h-5 w-5" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    aria-label="Accetta"
                    disabled={busy !== null}
                    onClick={() => run(`yes-${d.id}`, () => respondDuoInvite({ duoId: d.id, accept: true }), "Coppia formata!")}
                    className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--social)] text-black"
                  >
                    {busy === `yes-${d.id}` ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> : <Check className="h-5 w-5" aria-hidden="true" />}
                  </button>
                </li>
              )
            })}
          </ul>
        </section>
      )}

      {data.sent ? (
        <section className="rounded-[var(--radius-md)] bg-[var(--surface-2)] p-4">
          <p className="text-base text-white">
            Hai invitato <b>{data.sent.members[1].name}</b>. Appena accetta, siete una coppia.
          </p>
          <button
            type="button"
            disabled={busy !== null}
            onClick={() => run("cancel", () => leaveDuo({ duoId: data.sent!.id }), "Invito annullato")}
            className="mt-3 min-h-[3.5rem] w-full rounded-full bg-[var(--surface-4)] text-base font-bold text-white"
          >
            Annulla l&apos;invito
          </button>
        </section>
      ) : (
        <section aria-labelledby="pick">
          <h3 id="pick" className="font-hand text-[1.9rem] text-white">Con chi?</h3>
          <p className="mb-2 text-sm text-[var(--muted-text)]">I tuoi match e chi ti ha scritto.</p>
          {data.candidates.length === 0 ? (
            <div className="rounded-[var(--radius-md)] bg-[var(--surface-2)] p-4 text-base text-[var(--muted-text)]">
              Ancora nessuno: fai un match su{" "}
              <Link href="/scopri" className="font-bold text-[var(--accent)]">Scopri</Link> e torna qui.
            </div>
          ) : (
            <ul className="flex flex-col gap-2">
              {data.candidates.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => setPick(c)}
                    className="pressable flex min-h-[4rem] w-full items-center gap-3 rounded-[var(--radius-md)] bg-[var(--surface-2)] p-2 pr-4 text-left"
                  >
                    <Faces members={[c]} size="h-12 w-12" />
                    <span className="min-w-0 flex-1">
                      <span className="block text-base font-extrabold text-white">{c.name}</span>
                      <span className="block text-sm text-[var(--muted-text)]">
                        {c.role === "BLOCKER" ? "Muro" : "Difesa"} · {c.division}
                        {c.homeCity ? ` · ${c.homeCity}` : ""}
                      </span>
                    </span>
                    <UserPlus className="h-5 w-5 text-[var(--social)]" aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      <section aria-labelledby="rank-title">
        <h3 id="rank-title" className="font-hand mb-2 text-[1.9rem] text-white">Classifica coppie</h3>
        <Leaderboard rows={data.leaderboard} />
      </section>

      <Sheet open={pick !== null} onOpenChange={(o) => !o && setPick(null)} title={`In coppia con ${pick?.name ?? ""}`} description="Dategli un nome e una frase: è la prima cosa che vedono le altre coppie.">
        <div className="flex flex-col gap-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value.slice(0, 40))}
            placeholder="Nome della coppia (facoltativo)"
            className="min-h-[3.5rem] rounded-[var(--radius-md)] bg-[var(--surface-2)] px-4 text-base text-white placeholder:text-[var(--muted-text)] outline-none ring-1 ring-[var(--border)] focus:ring-[var(--social)]"
          />
          <textarea
            value={motto}
            onChange={(e) => setMotto(e.target.value.slice(0, MOTTO_MAX))}
            rows={2}
            placeholder="Es. «Muro alto, difesa che non molla. Cerchiamo sfide il sabato a Cervia»"
            className="resize-none rounded-[var(--radius-md)] bg-[var(--surface-2)] p-4 text-base text-white placeholder:text-[var(--muted-text)] outline-none ring-1 ring-[var(--border)] focus:ring-[var(--social)]"
          />
          <button
            type="button"
            disabled={busy !== null}
            onClick={async () => {
              if (!pick) return
              await run("invite", () => inviteDuoPartner({ partnerId: pick.id, name: name.trim() || undefined, motto: motto.trim() || undefined }), `Invito mandato a ${pick.name}`)
              setPick(null)
            }}
            className="pressable flex min-h-[3.75rem] items-center justify-center gap-2 rounded-full bg-[var(--social)] text-lg font-extrabold text-black disabled:opacity-60"
          >
            {busy === "invite" && <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />} Manda l&apos;invito
          </button>
        </div>
      </Sheet>
    </div>
  )
}

function ActiveDuo({ data, duo }: { data: CoppieData; duo: DuoCard }) {
  const { busy, run } = useRun()
  const [tab, setTab] = useState<"sfide" | "ricevute" | "partite" | "classifica">(data.incoming.length ? "ricevute" : "sfide")
  const [deck, setDeck] = useState(data.deck)
  const [likesLeft, setLikesLeft] = useState(data.likesLeft)
  const [challenge, setChallenge] = useState<DuoCard | null>(null)
  const [comment, setComment] = useState("")
  const [edit, setEdit] = useState(false)
  const [name, setName] = useState(duo.name)
  const [motto, setMotto] = useState(duo.motto ?? "")
  const [game, setGame] = useState<DuoMatchRow | null>(null)
  const current = deck[0]
  const myRank = data.leaderboard.findIndex((r) => r.id === duo.id)

  return (
    <div className="flex flex-col gap-5">
      <section className="tone-social rounded-[var(--radius-lg)] bg-[var(--surface-2)] p-4 shadow-[var(--shadow-card)] ring-1 ring-[var(--tone-line)]">
        <div className="flex items-center gap-4">
          <Faces members={duo.members} />
          <div className="min-w-0 flex-1">
            <p className="eyebrow text-[var(--social)]">La tua coppia</p>
            <p className="font-hand truncate text-[1.9rem] text-white">{duo.name}</p>
            <p className="text-sm text-[var(--muted-text)]">
              {myRank >= 0
                ? `Punteggio ${data.leaderboard[myRank].rating} · ${myRank + 1}ª in classifica`
                : `Livello medio ${duo.rating}`}
            </p>
          </div>
          <button type="button" onClick={() => setEdit(true)} aria-label="Modifica la coppia" className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--surface-4)] text-white">
            <Pencil className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
        {duo.motto && <p className="mt-3 font-serif text-xl leading-snug text-white">«{duo.motto}»</p>}
      </section>

      <nav aria-label="Sezioni coppia" className="grid grid-cols-4 gap-1 rounded-full bg-[var(--surface-2)] p-1">
        {[
          { id: "sfide" as const, label: "Sfida" },
          { id: "ricevute" as const, label: `Sfide${data.incoming.length ? ` · ${data.incoming.length}` : ""}` },
          { id: "partite" as const, label: `Partite${data.matches.length ? ` · ${data.matches.length}` : ""}` },
          { id: "classifica" as const, label: "Classifica" },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            aria-pressed={tab === t.id}
            onClick={() => setTab(t.id)}
            className={cn("min-h-[3rem] rounded-full text-sm font-bold", tab === t.id ? "sel-on" : "text-[var(--muted-text)]")}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {tab === "sfide" &&
        (current ? (
          <section aria-label={`Coppia ${current.name}`} className="flex flex-col gap-3">
            <DuoProfile duo={current} />
            <div className="grid grid-cols-[auto_1fr] gap-2">
              <button
                type="button"
                aria-label={`Passa ${current.name}`}
                onClick={() => {
                  skipDuo({ duoId: current.id }).catch(() => {})
                  setDeck((d) => d.slice(1))
                }}
                className="pressable flex h-16 w-16 items-center justify-center rounded-full bg-[var(--surface-2)] text-white ring-1 ring-[var(--border)]"
              >
                <X className="h-8 w-8" aria-hidden="true" />
              </button>
              <button
                type="button"
                disabled={likesLeft === 0}
                onClick={() => setChallenge(current)}
                className="pressable flex min-h-[4rem] items-center justify-center gap-2 rounded-full bg-[var(--social)] text-lg font-extrabold text-black disabled:opacity-50"
              >
                <Swords className="h-6 w-6" aria-hidden="true" /> {likesLeft === 0 ? "Sfide finite per oggi" : `Sfidali · ${likesLeft}`}
              </button>
            </div>
          </section>
        ) : (
          <div className="rounded-[var(--radius-lg)] bg-[var(--surface-2)] px-6 py-10 text-center">
            <p className="font-hand text-[1.9rem] text-white">Nessuna altra coppia per ora</p>
            <p className="mt-1 text-base text-[var(--muted-text)]">Invita due amici a formarne una: più coppie, più sfide.</p>
          </div>
        ))}

      {tab === "ricevute" &&
        (data.incoming.length === 0 ? (
          <p className="rounded-[var(--radius-md)] bg-[var(--surface-2)] p-4 text-base text-[var(--muted-text)]">Ancora nessuna sfida. Sfida tu per primi!</p>
        ) : (
          <ul className="flex flex-col gap-4">
            {data.incoming.map((l) => (
              <li key={l.fromDuo.id} className="flex flex-col gap-3">
                <p className="eyebrow text-[var(--social)]">{l.byName} vi sfida</p>
                {l.comment && <p className="rounded-2xl rounded-tl-sm bg-[var(--surface-4)] px-4 py-3 text-base text-white">{l.comment}</p>}
                <DuoProfile duo={l.fromDuo} />
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    disabled={busy !== null}
                    onClick={() => run(`no-${l.fromDuo.id}`, () => respondDuoLike({ fromDuoId: l.fromDuo.id, accept: false }))}
                    className="min-h-[3.5rem] rounded-full bg-[var(--surface-3)] text-base font-bold text-white"
                  >
                    No grazie
                  </button>
                  <button
                    type="button"
                    disabled={busy !== null}
                    onClick={() => run(`yes-${l.fromDuo.id}`, () => respondDuoLike({ fromDuoId: l.fromDuo.id, accept: true }), "Sfida accettata! Vi abbiamo messi in chat.")}
                    className="flex min-h-[3.5rem] items-center justify-center gap-2 rounded-full bg-[var(--social)] text-base font-extrabold text-black"
                  >
                    {busy === `yes-${l.fromDuo.id}` ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> : <Swords className="h-5 w-5" aria-hidden="true" />} Accetta
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ))}

      {tab === "partite" &&
        (data.matches.length === 0 ? (
          <p className="rounded-[var(--radius-md)] bg-[var(--surface-2)] p-4 text-base text-[var(--muted-text)]">Quando una sfida viene accettata, la trovi qui.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {data.matches.map((m) => (
              <li key={m.id} className="rounded-[var(--radius-md)] bg-[var(--surface-2)] p-3">
                <div className="flex items-center gap-3">
                  <Faces members={m.other.members} size="h-12 w-12" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-base font-extrabold text-white">vs {m.other.name}</span>
                    <span className="block text-sm text-[var(--muted-text)]">Media {m.other.rating}</span>
                  </span>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <Link href={m.threadId ? `/messaggi/${m.threadId}` : "/messaggi"} className="flex min-h-[3.5rem] items-center justify-center gap-2 rounded-full bg-[var(--surface-4)] text-base font-bold text-white">
                    <MessageCircle className="h-5 w-5" aria-hidden="true" /> Chat a 4
                  </Link>
                  {m.sessionId ? (
                    <Link href={`/sessions/${m.sessionId}`} className="flex min-h-[3.5rem] items-center justify-center gap-2 rounded-full bg-[var(--social)] text-base font-extrabold text-black">
                      Vai alla partita
                    </Link>
                  ) : (
                    <button type="button" onClick={() => setGame(m)} className="flex min-h-[3.5rem] items-center justify-center gap-2 rounded-full bg-[var(--social)] text-base font-extrabold text-black">
                      <CalendarPlus className="h-5 w-5" aria-hidden="true" /> In calendario
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        ))}

      {tab === "classifica" && <Leaderboard rows={data.leaderboard} mine={duo.id} />}

      <button
        type="button"
        disabled={busy !== null}
        onClick={() => {
          if (window.confirm("Sciogliere la coppia? Le sfide aperte si perdono.")) run("leave", () => leaveDuo({ duoId: duo.id }), "Coppia sciolta")
        }}
        className="flex min-h-[3.5rem] items-center justify-center gap-2 text-base font-bold text-[var(--muted-text)]"
      >
        <LogOut className="h-5 w-5" aria-hidden="true" /> Sciogli la coppia
      </button>

      <Sheet open={challenge !== null} onOpenChange={(o) => !o && setChallenge(null)} title={`Sfida ${challenge?.name ?? ""}`} description="Due righe per invogliarli: quando potete, dove.">
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value.slice(0, COMMENT_MAX))}
          rows={3}
          placeholder="Es. «Sabato pomeriggio al Bagno 62? Chi perde offre lo spritz»"
          className="w-full resize-none rounded-[var(--radius-md)] bg-[var(--surface-2)] p-4 text-base text-white placeholder:text-[var(--muted-text)] outline-none ring-1 ring-[var(--border)] focus:ring-[var(--social)]"
        />
        <button
          type="button"
          disabled={busy !== null}
          onClick={async () => {
            if (!challenge) return
            const res = (await run("like", () => likeDuo({ toDuoId: challenge.id, comment: comment.trim() || undefined }))) as { matched: boolean } | undefined
            if (res) {
              toast.success(res.matched ? "Sfida accettata! Vi abbiamo messi in chat." : "Sfida mandata")
              setDeck((d) => d.slice(1))
              setLikesLeft((n) => Math.max(0, n - 1))
              setComment("")
              setChallenge(null)
            }
          }}
          className="pressable mt-3 flex min-h-[3.75rem] w-full items-center justify-center gap-2 rounded-full bg-[var(--social)] text-lg font-extrabold text-black disabled:opacity-60"
        >
          {busy === "like" ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> : <Swords className="h-5 w-5" aria-hidden="true" />} Manda la sfida
        </button>
      </Sheet>

      <Sheet open={edit} onOpenChange={setEdit} title="La vostra coppia">
        <div className="flex flex-col gap-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value.slice(0, 40))}
            className="min-h-[3.5rem] rounded-[var(--radius-md)] bg-[var(--surface-2)] px-4 text-base text-white outline-none ring-1 ring-[var(--border)] focus:ring-[var(--social)]"
            aria-label="Nome della coppia"
          />
          <textarea
            value={motto}
            onChange={(e) => setMotto(e.target.value.slice(0, MOTTO_MAX))}
            rows={2}
            aria-label="Frase della coppia"
            className="resize-none rounded-[var(--radius-md)] bg-[var(--surface-2)] p-4 text-base text-white outline-none ring-1 ring-[var(--border)] focus:ring-[var(--social)]"
          />
          <button
            type="button"
            disabled={busy !== null}
            onClick={async () => {
              await run("edit", () => updateDuo({ duoId: duo.id, name: name.trim(), motto: motto.trim() }), "Salvato")
              setEdit(false)
            }}
            className="min-h-[3.75rem] rounded-full bg-[var(--social)] text-lg font-extrabold text-black"
          >
            Salva
          </button>
        </div>
      </Sheet>

      {game && (
        <ProposeGameSheet
          open
          onOpenChange={(o) => !o && setGame(null)}
          title={`${duo.name} vs ${game.other.name}`}
          description="Partita completa: voi due da una parte, loro dall'altra."
          defaultCity={data.myCity}
          submit={(input) => proposeDuoGame({ duoMatchId: game.id, ...input })}
        />
      )}
    </div>
  )
}

function DuoProfile({ duo }: { duo: DuoCard }) {
  return (
    <article className="rounded-[var(--radius-lg)] bg-[var(--surface-2)] p-4 shadow-[var(--shadow-card)]">
      <div className="grid grid-cols-2 gap-2">
        {duo.members.map((m) => (
          <div key={m.id} className="overflow-hidden rounded-[var(--radius-md)] bg-[var(--surface-3)]">
            {m.photo ? (
              <img src={resizedPhoto(m.photo, "card")} alt={`Foto di ${m.name}`} className="aspect-[3/4] w-full object-cover" />
            ) : (
              <div className="flex aspect-[3/4] items-center justify-center text-[var(--muted-text)]">
                <Users className="h-8 w-8" aria-hidden="true" />
              </div>
            )}
            <div className="p-2">
              <p className="text-base font-extrabold text-white">{m.name}</p>
              <p className="text-sm text-[var(--muted-text)]">
                {m.role === "BLOCKER" ? "Muro" : "Difesa"} · {m.division}
              </p>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="font-hand text-[2.3rem] leading-tight text-white">{duo.name}</p>
          {duo.motto && <p className="mt-1 font-serif text-xl leading-snug text-white/90">«{duo.motto}»</p>}
        </div>
        {shownAffinity(duo.score) !== null && <p className="num shrink-0 text-3xl text-[var(--social)]">{duo.score}%</p>}
      </div>
      {duo.reasons && duo.reasons.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-2">
          {duo.reasons.map((r) => (
            <li key={r} className="rounded-full bg-[color-mix(in_srgb,var(--social)_14%,transparent)] px-3 py-1 text-sm font-bold text-[var(--social)]">{r}</li>
          ))}
        </ul>
      )}
    </article>
  )
}
