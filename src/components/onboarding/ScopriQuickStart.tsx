"use client"

/* eslint-disable @next/next/no-img-element -- user photos from Blob, any size */
import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { HeartHandshake, Camera, Loader2, Check } from "lucide-react"
import { toast } from "sonner"
import { saveScopriQuickStart } from "@/actions/scopri"
import { PROMPTS, LOOKING_FOR, promptText } from "@/lib/scopri/prompts"
import { ANSWER_MAX, MIN_AGE } from "@/lib/scopri/rules"
import { cn } from "@/lib/utils"
import { resizedPhoto } from "@/lib/photo"
import { shrinkImage } from "@/lib/shrinkImage"

const DEFAULT_KEYS = ["best_shot", "partner_who", "after_match"]

const EXAMPLES: Record<string, string> = {
  best_shot: "La diagonale stretta in salto",
  partner_who: "Non molla mai una palla, anche sul 20-14 sotto",
  after_match: "Al chiosco con uno spritz e la rivincita già fissata",
  fav_bagno: "Bagno 26, campi perfetti al tramonto",
  spot_me: "Urlo «mia!» anche quando non è mia",
  lost_point: "Batto il cinque e penso al prossimo",
  why_beach: "Perché è l'unico sport con il mare a due passi",
}

const inputCls =
  "min-h-[3.5rem] w-full rounded-[1.25rem] bg-white/5 px-4 text-base text-white outline-none ring-1 ring-white/15 focus:ring-[var(--accent)]"

/**
 * Sign-up's last step, optional and one minute long: the photo you just set,
 * three answers already picked for you, age if missing. Then straight to the
 * deck. Everything here is editable later in the Scopri profile.
 */
export function ScopriQuickStart({
  firstName,
  avatarUrl,
  hasBirthDate,
  hasPhotos,
}: {
  firstName: string
  avatarUrl: string | null
  hasBirthDate: boolean
  hasPhotos: boolean
}) {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [useAvatar, setUseAvatar] = useState(!!avatarUrl)
  const [uploaded, setUploaded] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [birthDate, setBirthDate] = useState("")
  const [prompts, setPrompts] = useState(DEFAULT_KEYS.map((k) => ({ promptKey: k, answer: "" })))
  const [lookingFor, setLookingFor] = useState<string[]>(["COMPAGNO"])
  const [saving, setSaving] = useState(false)

  const filled = prompts.filter((p) => p.answer.trim().length >= 2)
  const hasPhoto = hasPhotos || !!uploaded || (useAvatar && !!avatarUrl)
  const canSave = filled.length > 0 && (hasBirthDate || !!birthDate)

  async function upload(file: File) {
    setUploading(true)
    try {
      const body = new FormData()
      body.append("file", await shrinkImage(file))
      const res = await fetch("/api/scopri/photo", { method: "POST", body })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Caricamento non riuscito")
      setUploaded(json.photo.url)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Caricamento non riuscito")
    } finally {
      setUploading(false)
    }
  }

  async function save() {
    setSaving(true)
    try {
      const res = await saveScopriQuickStart({
        birthDate: hasBirthDate ? undefined : birthDate || undefined,
        prompts: filled.map((p) => ({ promptKey: p.promptKey, answer: p.answer.trim() })),
        lookingFor: lookingFor as ("COMPAGNO" | "PARTITE" | "ALLENAMENTO" | "TORNEI" | "MISTO")[],
        useAvatar,
      })
      if (res.ready) {
        toast.success("Sei su Scopri!")
        router.push("/scopri")
      } else {
        toast("Quasi fatto: completa gli ultimi dettagli")
        router.push("/scopri/profilo")
      }
      router.refresh()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Non riuscito")
      setSaving(false)
    }
  }

  // Numbered like the posters; the age question only shows when it's missing.
  const steps = hasBirthDate ? ["01", "", "02", "03"] : ["01", "02", "03", "04"]
  const sticker = uploaded ?? (avatarUrl && useAvatar ? avatarUrl : null)

  return (
    <div className="fixed inset-0 z-[200] flex flex-col overflow-y-auto bg-[var(--background)]">
      {/* The poster backdrop: grainy graphite, like the rest of the app. */}
      <div aria-hidden="true" className="app-bg app-bg--aurora pointer-events-none fixed inset-0 -z-10">
        <div className="app-bg__glow" />
        <div className="app-bg__grain" />
      </div>

      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col" style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 1.25rem)" }}>
        <header className="px-5 pb-2">
          <div className="flex min-h-[2.75rem] items-center justify-between text-xs font-semibold uppercase tracking-[0.12em] text-white/70">
            <span>SANDER</span>
            <span>Passo 2 di 2</span>
            <span>Facoltativo</span>
          </div>
          <h1 className="font-hand mt-4 text-[3rem] leading-[0.92] text-white">
            {firstName},<br />
            trova con chi <span className="text-[var(--accent)]">giocare.</span>
          </h1>
          <p className="mt-3 text-base leading-snug text-white/70">
            Un minuto e sei su Scopri: chi gioca vicino ti vede, ti mette like, e sabato si gioca.
          </p>
        </header>

        {/* Foto */}
        <section aria-labelledby="qs-photo" className="mt-4 border-t border-white/10 px-5 py-5">
          <Step n={steps[0]} label="Foto" />
          <h2 id="qs-photo" className="font-hand mt-1 text-[1.9rem] leading-tight text-white">La tua foto</h2>
          {avatarUrl || uploaded || hasPhotos ? (
            <div className="mt-4 flex items-center gap-5">
              {sticker ? (
                <img src={resizedPhoto(sticker, "card")} alt="" className="h-28 w-24 shrink-0 -rotate-[4deg] rounded-[1rem] object-cover shadow-[0_14px_28px_-12px_rgb(0_0_0/0.8)] ring-[5px] ring-white" />
              ) : (
                <span className="flex h-28 w-24 shrink-0 -rotate-[4deg] items-center justify-center rounded-[1rem] bg-white/5 ring-[5px] ring-white/20">
                  <Camera className="h-7 w-7 text-white/50" aria-hidden="true" />
                </span>
              )}
              {avatarUrl && !uploaded ? (
                <button
                  type="button"
                  aria-pressed={useAvatar}
                  onClick={() => setUseAvatar((v) => !v)}
                  className="flex min-h-[3.5rem] flex-1 items-center gap-3 rounded-[1.25rem] bg-white/5 px-4 text-left ring-1 ring-white/15"
                >
                  <span className="flex-1 text-base font-bold text-white">Usa la foto profilo su Scopri</span>
                  <span className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-full", useAvatar ? "bg-[var(--accent)] text-black" : "ring-2 ring-white/30")}>
                    {useAvatar && <Check className="h-4 w-4" aria-hidden="true" />}
                  </span>
                </button>
              ) : (
                <p className="flex flex-1 items-center gap-2 text-base font-bold text-white">
                  <Check className="h-5 w-5 text-[var(--accent)]" aria-hidden="true" /> Foto aggiunta
                </p>
              )}
            </div>
          ) : (
            <>
              <button
                type="button"
                disabled={uploading}
                onClick={() => fileRef.current?.click()}
                className="mt-3 flex min-h-[3.75rem] w-full items-center justify-center gap-2 rounded-[1.25rem] border-2 border-dashed border-white/25 text-base font-bold text-white"
              >
                {uploading ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> : <Camera className="h-5 w-5 text-[var(--accent)]" aria-hidden="true" />}
                Aggiungi una foto, meglio se in campo
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
              />
            </>
          )}
        </section>

        {/* Età */}
        {!hasBirthDate && (
          <section aria-labelledby="qs-age" className="border-t border-white/10 px-5 py-5">
            <Step n={steps[1]} label="Età" />
            <label id="qs-age" className="flex flex-col gap-1">
              <span className="font-hand mt-1 text-[1.9rem] leading-tight text-white">La tua data di nascita</span>
              <span className="text-sm text-white/65">Scopri è per chi ha almeno {MIN_AGE} anni. Agli altri mostriamo solo l&apos;età.</span>
              <input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} className={cn(inputCls, "mt-2")} />
            </label>
          </section>
        )}

        {/* Risposte */}
        <section aria-labelledby="qs-prompts" className="flex flex-col gap-3 border-t border-white/10 px-5 py-5">
          <div>
            <Step n={steps[2]} label="Risposte" />
            <h2 id="qs-prompts" className="font-hand mt-1 text-[1.9rem] leading-tight text-white">Tre risposte su come giochi</h2>
            <p className="mt-0.5 text-sm text-white/65">È lì che arrivano i like con un commento. Bastano poche parole.</p>
          </div>
          {prompts.map((p, i) => (
            <div key={i} className="rounded-[1.25rem] bg-white/5 p-4 ring-1 ring-white/15 focus-within:ring-[var(--accent)]">
              <label className="sr-only" htmlFor={`qs-q-${i}`}>Domanda {i + 1}</label>
              <select
                id={`qs-q-${i}`}
                value={p.promptKey}
                onChange={(e) => setPrompts((list) => list.map((x, j) => (j === i ? { ...x, promptKey: e.target.value } : x)))}
                className="w-full bg-transparent text-xs font-semibold uppercase tracking-[0.08em] text-white/70 outline-none"
              >
                {PROMPTS.filter((q) => q.key === p.promptKey || !prompts.some((x) => x.promptKey === q.key)).map((q) => (
                  <option key={q.key} value={q.key}>{q.text}</option>
                ))}
              </select>
              <label className="sr-only" htmlFor={`qs-a-${i}`}>{promptText(p.promptKey)}</label>
              <textarea
                id={`qs-a-${i}`}
                value={p.answer}
                onChange={(e) => setPrompts((list) => list.map((x, j) => (j === i ? { ...x, answer: e.target.value.slice(0, ANSWER_MAX) } : x)))}
                rows={2}
                placeholder={EXAMPLES[p.promptKey] ?? "Scrivi qui"}
                className="mt-1 w-full resize-none bg-transparent font-serif text-xl leading-snug text-white placeholder:text-white/30 outline-none"
              />
            </div>
          ))}
        </section>

        {/* Cosa cerchi */}
        <section aria-labelledby="qs-look" className="border-t border-white/10 px-5 py-5">
          <Step n={steps[3]} label="Cosa cerchi" />
          <h2 id="qs-look" className="font-hand mt-1 mb-3 text-[1.9rem] leading-tight text-white">Cosa cerchi</h2>
          <div className="flex flex-wrap gap-2">
            {LOOKING_FOR.map((l) => {
              const on = lookingFor.includes(l.key)
              return (
                <button
                  key={l.key}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setLookingFor((list) => (on ? list.filter((x) => x !== l.key) : [...list, l.key]))}
                  className={cn("min-h-[2.75rem] rounded-full px-4 text-sm font-bold transition-colors", on ? "bg-[var(--accent)] text-black" : "bg-white/5 text-white ring-1 ring-white/15")}
                >
                  {l.label}
                </button>
              )
            })}
          </div>
        </section>

        <div className="flex-1" />

        {/* The way in: sticks to the bottom over a fade, so it's always reachable. */}
        <div
          className="sticky bottom-0 flex flex-col gap-1 bg-gradient-to-t from-[var(--background)] via-[var(--background)] to-transparent px-5 pt-6"
          style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 0.75rem)" }}
        >
          <button
            type="button"
            disabled={!canSave || saving}
            onClick={save}
            className="pressable flex min-h-[3.75rem] items-center justify-center gap-2 rounded-full bg-[var(--accent)] text-lg font-extrabold text-black shadow-[var(--shadow-glow)] disabled:bg-white/10 disabled:text-white/50 disabled:shadow-none"
          >
            {saving ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> : <HeartHandshake className="h-5 w-5" aria-hidden="true" />}
            Entra in Scopri
          </button>
          {!hasPhoto && <p className="text-center text-sm text-white/60">Senza foto puoi aggiungerla dopo dal profilo Scopri.</p>}
          <button type="button" onClick={() => router.push("/")} className="min-h-[3.5rem] text-base font-bold text-white/60">
            Più tardi
          </button>
        </div>
      </div>
    </div>
  )
}

/** "01 · FOTO": the small numbered label above each question. */
function Step({ n, label }: { n: string; label: string }) {
  return (
    <span className="block text-xs font-semibold uppercase tracking-[0.12em] text-white/60">
      <span className="text-[var(--accent)]">{n}</span> · {label}
    </span>
  )
}
