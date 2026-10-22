"use client"

/* eslint-disable @next/next/no-img-element -- user photos from Blob, any size */
import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, Trash2, ChevronLeft, Loader2, Eye, Pause, Play, UserRound, Pencil, Crown, Sparkles } from "lucide-react"
import { toast } from "sonner"
import { Sheet } from "@/components/ui/Sheet"
import { CITY_NAMES } from "@/lib/cities"
import { PROMPTS, LOOKING_FOR, SIDES, promptText, type LookingFor } from "@/lib/scopri/prompts"
import { ANSWER_MAX, MAX_PHOTOS, PROMPT_COUNT, SHOW_ME, type MissingStep, type ShowMe } from "@/lib/scopri/rules"
import {
  saveDiscoverSettings,
  savePrompt,
  deletePrompt,
  deletePhoto,
  reorderPhotos,
  addAvatarAsPhoto,
} from "@/actions/scopri"
import { cn } from "@/lib/utils"
import { useIsNativeApp } from "@/lib/native"
import { ProfileCard } from "./ProfileCard"
import { SelfieVerify, type SelfieState } from "./SelfieVerify"
import type { ScopriCard } from "./types"
import { resizedPhoto } from "@/lib/photo"
import { shrinkImage } from "@/lib/shrinkImage"
import { CityPicker } from "@/components/ui/CityPicker"

export interface EditorData {
  photos: { id: string; url: string }[]
  prompts: { position: number; promptKey: string; answer: string }[]
  avatarUrl: string | null
  birthDate: string | null
  homeCity: string | null
  gender: string | null
  role: "BLOCKER" | "DEFENDER"
  side: string | null
  lookingFor: string[]
  paused: boolean
  prefCities: string[]
  prefGender: string | null
  prefRole: "BLOCKER" | "DEFENDER" | null
  maxGap: number
  plus: boolean
  onlyVerified: boolean
  onlyFreeToday: boolean
  openToMeet: boolean
  showMe: string | null
  meetOnly: boolean
  /** Consent already given once: no checkbox needed to switch it back on. */
  meetConsented: boolean
  selfie: SelfieState
  missing: MissingStep[]
  preview: ScopriCard
}

const inputCls =
  "min-h-[3.5rem] w-full rounded-[var(--radius-md)] bg-[var(--surface-2)] px-4 text-base text-white outline-none ring-1 ring-[var(--border)] focus:ring-[var(--accent)]"

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={cn(
        "min-h-[2.75rem] rounded-full px-4 text-sm font-bold",
        on ? "sel-on" : "sel-off",
      )}
    >
      {children}
    </button>
  )
}

function Section({ id, title, hint, children }: { id?: string; title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24">
      <h2 className="font-hand text-[1.9rem] text-white">{title}</h2>
      {hint && <p className="mb-3 text-sm text-[var(--muted-text)]">{hint}</p>}
      {children}
    </section>
  )
}

/** Your Scopri card: photos, answers, the details for the sand, your dealbreakers. */
export function ScopriProfileEditor({ data }: { data: EditorData }) {
  const router = useRouter()
  const native = useIsNativeApp()
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [editing, setEditing] = useState<number | null>(null)
  const [preview, setPreview] = useState(false)
  const [saving, setSaving] = useState(false)

  const [birthDate, setBirthDate] = useState(data.birthDate ?? "")
  const [homeCity, setHomeCity] = useState(data.homeCity ?? "")
  const [gender, setGender] = useState(data.gender ?? "")
  const [role, setRole] = useState(data.role)
  const [side, setSide] = useState<string | null>(data.side)
  const [lookingFor, setLookingFor] = useState<string[]>(data.lookingFor)
  const [prefCities, setPrefCities] = useState<string[]>(data.prefCities)
  const [prefGender, setPrefGender] = useState<string | null>(data.prefGender)
  const [prefRole, setPrefRole] = useState<"BLOCKER" | "DEFENDER" | null>(data.prefRole)
  const [maxGap, setMaxGap] = useState(data.maxGap)
  const [onlyVerified, setOnlyVerified] = useState(data.onlyVerified)
  const [onlyFreeToday, setOnlyFreeToday] = useState(data.onlyFreeToday)
  const [openToMeet, setOpenToMeet] = useState(data.openToMeet)
  const [showMe, setShowMe] = useState<string | null>(data.showMe)
  const [meetOnly, setMeetOnly] = useState(data.meetOnly)
  const [meetConsent, setMeetConsent] = useState(false)

  async function upload(file: File) {
    setUploading(true)
    try {
      const body = new FormData()
      body.append("file", await shrinkImage(file))
      const res = await fetch("/api/scopri/photo", { method: "POST", body })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Caricamento non riuscito")
      router.refresh()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Caricamento non riuscito")
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ""
    }
  }

  async function run(fn: () => Promise<unknown>, ok?: string) {
    try {
      await fn()
      if (ok) toast.success(ok)
      router.refresh()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Non riuscito")
    }
  }

  async function saveDetails() {
    setSaving(true)
    await run(
      () =>
        saveDiscoverSettings({
          birthDate: birthDate || undefined,
          homeCity: homeCity || undefined,
          gender: (gender || undefined) as "Uomo" | "Donna" | "Altro" | undefined,
          preferredRole: role,
          side: side as "SINISTRA" | "DESTRA" | "ENTRAMBI" | null,
          lookingFor: lookingFor as LookingFor[],
          prefCities,
          prefGender: prefGender as "Uomo" | "Donna" | null,
          prefRole,
          maxGap,
          ...(data.plus ? { onlyVerified, onlyFreeToday } : {}),
          ...(openToMeet
            ? {
                openToMeet: true,
                showMe: showMe as ShowMe | null,
                meetOnly,
                ...(meetConsent ? { meetConsent: true as const } : {}),
              }
            : data.openToMeet
              ? { openToMeet: false }
              : {}),
        }),
      "Salvato",
    )
    setSaving(false)
  }

  const toggle = (list: string[], v: string) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v])
  // The save bar shows only while something differs from what's stored.
  const stored = JSON.stringify([
    data.birthDate ?? "", data.homeCity ?? "", data.gender ?? "", data.role, data.side,
    [...data.lookingFor].sort(), [...data.prefCities].sort(), data.prefGender, data.prefRole, data.maxGap,
    data.onlyVerified, data.onlyFreeToday, data.openToMeet, data.showMe, data.meetOnly,
  ])
  const edited = JSON.stringify([
    birthDate, homeCity, gender, role, side, [...lookingFor].sort(), [...prefCities].sort(), prefGender, prefRole, maxGap,
    onlyVerified, onlyFreeToday, openToMeet, openToMeet ? showMe : null, openToMeet ? meetOnly : false,
  ])
  const needsConsent = openToMeet && !data.meetConsented && !meetConsent
  const dirty = stored !== edited

  return (
    <div className="flex flex-col gap-8">
      {data.missing.length > 0 ? (
        <p className="rounded-[var(--radius-md)] bg-[var(--accent-soft)] p-4 text-base font-bold text-white ring-1 ring-[var(--accent-line)]">
          Ancora {data.missing.length === 1 ? "un passo" : `${data.missing.length} passi`} e sei su Scopri:{" "}
          {data.missing
            .map((m) => ({ photo: "una foto", prompts: `${PROMPT_COUNT} risposte`, birthDate: "la data di nascita", adult: "avere 18 anni", city: "il comune" })[m])
            .join(", ")}
          .
        </p>
      ) : (
        <button
          type="button"
          onClick={() => setPreview(true)}
          className="pressable flex min-h-[3.5rem] items-center justify-center gap-2 rounded-full btn-secondary text-base font-bold text-white"
        >
          <Eye className="h-5 w-5 text-[var(--accent)]" aria-hidden="true" /> Guarda come ti vedono gli altri
        </button>
      )}

      {/* ── Foto ── */}
      <Section title="Le tue foto" hint={`Fino a ${MAX_PHOTOS}. In campo, con il pallone, al tramonto: le foto vere funzionano.`}>
        <ul className="grid grid-cols-3 gap-2">
          {Array.from({ length: MAX_PHOTOS }).map((_, i) => {
            const p = data.photos[i]
            if (!p) {
              return (
                <li key={`empty-${i}`}>
                  <button
                    type="button"
                    disabled={uploading || i !== data.photos.length}
                    onClick={() => fileRef.current?.click()}
                    aria-label="Aggiungi una foto"
                    className="flex aspect-[3/4] w-full items-center justify-center rounded-[var(--radius-md)] border-2 border-dashed border-[var(--muted)] text-[var(--muted-text)] disabled:opacity-40"
                  >
                    {uploading && i === data.photos.length ? <Loader2 className="h-6 w-6 animate-spin" aria-hidden="true" /> : <Plus className="h-7 w-7" aria-hidden="true" />}
                  </button>
                </li>
              )
            }
            return (
              <li key={p.id} className="relative">
                <img src={resizedPhoto(p.url, "card")} alt={`Foto ${i + 1}`} className="aspect-[3/4] w-full rounded-[var(--radius-md)] object-cover" />
                {i === 0 && <span className="absolute left-1.5 top-1.5 rounded-full bg-black/70 px-2 py-0.5 text-xs font-bold text-white">Principale</span>}
                <div className="absolute inset-x-1 bottom-1 flex justify-between">
                  {i > 0 ? (
                    <button
                      type="button"
                      aria-label="Sposta prima"
                      onClick={() => {
                        const ids = data.photos.map((x) => x.id)
                        ;[ids[i - 1], ids[i]] = [ids[i], ids[i - 1]]
                        run(() => reorderPhotos({ ids }))
                      }}
                      className="flex h-10 w-10 items-center justify-center rounded-full bg-black/70 text-white"
                    >
                      <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                    </button>
                  ) : (
                    <span />
                  )}
                  <button
                    type="button"
                    aria-label="Togli questa foto"
                    onClick={() => run(() => deletePhoto({ photoId: p.id }))}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-black/70 text-white"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
        />
        {data.avatarUrl && !data.photos.some((p) => p.url === data.avatarUrl) && data.photos.length < MAX_PHOTOS && (
          <button
            type="button"
            onClick={() => run(() => addAvatarAsPhoto(), "Foto aggiunta")}
            className="mt-2 flex min-h-[3.5rem] w-full items-center justify-center gap-2 rounded-full btn-secondary text-base font-bold text-white"
          >
            <UserRound className="h-5 w-5 text-[var(--accent)]" aria-hidden="true" /> Usa la tua foto profilo
          </button>
        )}
      </Section>

      {/* ── Risposte ── */}
      <Section title="Foto verificata" hint="Il badge dice a tutti che sei davvero tu: chi lo ha riceve più like.">
        <SelfieVerify state={data.selfie} hasPhotos={data.photos.length > 0} />
      </Section>

      <Section title="Le tue risposte" hint="Tre domande. È lì che arrivano i like con un commento.">
        <ul className="flex flex-col gap-2">
          {Array.from({ length: PROMPT_COUNT }).map((_, i) => {
            const p = data.prompts.find((x) => x.position === i)
            return (
              <li key={i}>
                <button
                  type="button"
                  onClick={() => setEditing(i)}
                  className="pressable flex min-h-[4.5rem] w-full items-center gap-3 rounded-[var(--radius-md)] bg-[var(--surface-2)] px-4 py-3 text-left"
                >
                  <span className="min-w-0 flex-1">
                    {p ? (
                      <>
                        <span className="block text-sm font-bold text-[var(--muted-text)]">{promptText(p.promptKey)}</span>
                        <span className="block font-serif text-xl leading-snug text-white">{p.answer}</span>
                      </>
                    ) : (
                      <span className="block text-base font-bold text-white">Scegli una domanda</span>
                    )}
                  </span>
                  {p ? <Pencil className="h-5 w-5 shrink-0 text-[var(--accent)]" aria-hidden="true" /> : <Plus className="h-5 w-5 shrink-0 text-[var(--accent)]" aria-hidden="true" />}
                </button>
              </li>
            )
          })}
        </ul>
      </Section>

      {/* ── Dettagli ── */}
      <Section title="In campo" hint="Mostriamo età, comune e ruolo. Data di nascita e genere restano privati.">
        <div className="flex flex-col gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-sm font-bold text-[var(--muted-text)]">Data di nascita</span>
            <input
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              disabled={!!data.birthDate}
              className={cn(inputCls, "disabled:text-[var(--muted-text)]")}
            />
            {data.birthDate && <span className="text-xs text-[var(--muted-text)]">Non si può cambiare: scrivi al supporto se è sbagliata.</span>}
          </label>
          <div className="flex flex-col gap-1">
            <span className="text-sm font-bold text-[var(--muted-text)]">Comune dove giochi</span>
            <CityPicker value={homeCity} onChange={setHomeCity} />
          </div>
          <label className="flex flex-col gap-1">
            <span className="text-sm font-bold text-[var(--muted-text)]">Genere (privato, per le preferenze)</span>
            <select value={gender} onChange={(e) => setGender(e.target.value)} className={inputCls}>
              <option value="">Preferisco non dirlo</option>
              <option value="Uomo">Uomo</option>
              <option value="Donna">Donna</option>
              <option value="Altro">Altro</option>
            </select>
          </label>
          <div>
            <p className="mb-2 text-sm font-bold text-[var(--muted-text)]">Ruolo</p>
            <div className="flex flex-wrap gap-2">
              <Chip on={role === "BLOCKER"} onClick={() => setRole("BLOCKER")}>Muro</Chip>
              <Chip on={role === "DEFENDER"} onClick={() => setRole("DEFENDER")}>Difesa</Chip>
            </div>
          </div>
          <div>
            <p className="mb-2 text-sm font-bold text-[var(--muted-text)]">Lato</p>
            <div className="flex flex-wrap gap-2">
              {SIDES.map((s) => (
                <Chip key={s.key} on={side === s.key} onClick={() => setSide(side === s.key ? null : s.key)}>{s.label}</Chip>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-sm font-bold text-[var(--muted-text)]">Cosa cerchi</p>
            <div className="flex flex-wrap gap-2">
              {LOOKING_FOR.map((l) => (
                <Chip key={l.key} on={lookingFor.includes(l.key)} onClick={() => setLookingFor(toggle(lookingFor, l.key))}>{l.label}</Chip>
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* ── Oltre al campo ── */}
      <Section
        title="Oltre al campo"
        hint="Qui si viene per giocare. Se poi nasce qualcosa, meglio ancora: dillo solo se ti va."
      >
        <div className="flex flex-col gap-4">
          <button
            type="button"
            role="switch"
            aria-checked={openToMeet}
            onClick={() => setOpenToMeet(!openToMeet)}
            className="flex min-h-[3.5rem] items-center justify-between gap-3 rounded-[var(--radius-md)] bg-[var(--surface-2)] px-4 py-3 text-left ring-1 ring-[var(--border)]"
          >
            <span className="flex items-center gap-3">
              <Sparkles className="h-5 w-5 shrink-0 text-[var(--love)]" aria-hidden="true" />
              <span>
                <span className="block text-base font-bold text-white">Aperto a conoscersi</span>
                <span className="block text-sm text-[var(--muted-text)]">Lo vede solo chi è aperto anche lui e ti piacerebbe conoscere</span>
              </span>
            </span>
            <span className={cn("relative h-7 w-12 shrink-0 rounded-full transition-colors", openToMeet ? "bg-[var(--accent)]" : "bg-[var(--surface-4)]")}>
              <span className={cn("absolute top-1 h-5 w-5 rounded-full bg-white transition-all", openToMeet ? "left-6" : "left-1")} />
            </span>
          </button>
          {openToMeet && (
            <>
              <div>
                <p className="mb-2 text-sm font-bold text-[var(--muted-text)]">Mostrami</p>
                <div className="flex flex-wrap gap-2">
                  {SHOW_ME.map((o) => (
                    <Chip key={o.key} on={showMe === o.key} onClick={() => setShowMe(o.key)}>{o.label}</Chip>
                  ))}
                </div>
                {!gender && (
                  <p className="mt-2 text-sm text-[var(--muted-text)]">
                    Senza il genere (sopra, in «In campo») ti vede solo chi ha scelto «Tutti».
                  </p>
                )}
              </div>
              <label className="flex min-h-[3.5rem] items-center gap-3 rounded-[var(--radius-md)] bg-[var(--surface-2)] px-4 py-3 ring-1 ring-[var(--border)]">
                <input type="checkbox" checked={meetOnly} onChange={(e) => setMeetOnly(e.target.checked)} className="h-5 w-5 accent-[var(--accent)]" />
                <span className="text-base text-white">Nel mazzo mostrami solo chi è aperto a conoscersi</span>
              </label>
              {!data.meetConsented && (
                <label className="flex items-start gap-3 rounded-[var(--radius-md)] bg-[var(--surface-2)] p-4 ring-1 ring-[var(--love)]/40">
                  <input type="checkbox" checked={meetConsent} onChange={(e) => setMeetConsent(e.target.checked)} className="mt-0.5 h-5 w-5 shrink-0 accent-[var(--accent)]" />
                  <span className="text-sm text-white">
                    Acconsento a che SANDER usi questa preferenza e il mio genere per mostrarmi alle persone giuste. Non li vede
                    nessuno: solo chi è compatibile vede «Aperto a conoscersi». Puoi disattivarlo quando vuoi e la preferenza viene
                    cancellata.{" "}
                    <a href="/privacy#scopri" className="font-bold text-[var(--accent)] underline">Privacy</a>
                  </span>
                </label>
              )}
            </>
          )}
        </div>
      </Section>

      <a href="/profile/presenze" className="-mt-4 flex min-h-[3.5rem] items-center justify-between rounded-[var(--radius-md)] bg-[var(--surface-2)] px-4 text-base font-bold text-white">
        Le tue presenze e assenze <span className="text-[var(--accent)]">›</span>
      </a>

      {/* ── Preferenze ── */}
      <Section id="preferenze" title="Non negoziabili" hint="Vale per tutti e due: vi vedete solo se ognuno rientra nelle scelte dell'altro.">
        <div className="flex flex-col gap-4">
          <div>
            <p className="mb-2 text-sm font-bold text-[var(--muted-text)]">Comuni {prefCities.length === 0 && "· tutti"}</p>
            <div className="flex flex-wrap gap-2">
              {/* The Riviera towns, plus your own comune and any already chosen elsewhere. */}
              {[...new Set([...CITY_NAMES, homeCity, ...prefCities].filter(Boolean))].map((c) => (
                <Chip key={c} on={prefCities.includes(c)} onClick={() => setPrefCities(toggle(prefCities, c))}>{c}</Chip>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-sm font-bold text-[var(--muted-text)]">Con chi</p>
            <div className="flex flex-wrap gap-2">
              <Chip on={prefGender === null} onClick={() => setPrefGender(null)}>Chiunque</Chip>
              <Chip on={prefGender === "Uomo"} onClick={() => setPrefGender("Uomo")}>Uomini</Chip>
              <Chip on={prefGender === "Donna"} onClick={() => setPrefGender("Donna")}>Donne</Chip>
            </div>
          </div>
          <div>
            <p className="mb-2 text-sm font-bold text-[var(--muted-text)]">Ruolo del compagno</p>
            <div className="flex flex-wrap gap-2">
              <Chip on={prefRole === null} onClick={() => setPrefRole(null)}>Qualsiasi</Chip>
              <Chip on={prefRole === "BLOCKER"} onClick={() => setPrefRole("BLOCKER")}>Muro</Chip>
              <Chip on={prefRole === "DEFENDER"} onClick={() => setPrefRole("DEFENDER")}>Difesa</Chip>
            </div>
          </div>
          <label className="flex flex-col gap-2">
            <span className="flex justify-between text-sm font-bold text-[var(--muted-text)]">
              <span>Differenza di livello massima</span>
              <span className="text-white">± {maxGap} punti</span>
            </span>
            <input type="range" min={100} max={1000} step={50} value={maxGap} onChange={(e) => setMaxGap(Number(e.target.value))} className="accent-[var(--accent)]" />
          </label>
          {data.plus ? (
            <div>
              <p className="mb-2 flex items-center gap-1 text-sm font-bold text-[var(--ace)]">
                <Crown className="h-4 w-4" aria-hidden="true" /> Filtri SANDER+
              </p>
              <div className="flex flex-wrap gap-2">
                <Chip on={onlyVerified} onClick={() => setOnlyVerified(!onlyVerified)}>Solo verificati</Chip>
                <Chip on={onlyFreeToday} onClick={() => setOnlyFreeToday(!onlyFreeToday)}>Solo liberi oggi</Chip>
              </div>
            </div>
          ) : native ? null : (
            <a href="/scopri/plus" className="flex min-h-[3.5rem] items-center gap-2 rounded-[var(--radius-md)] bg-[var(--surface-2)] px-4 text-base font-bold text-white">
              <Crown className="h-5 w-5 text-[var(--ace)]" aria-hidden="true" /> Solo verificati, solo liberi oggi: con SANDER+
            </a>
          )}
        </div>
      </Section>

      {dirty && (
        <button
          type="button"
          disabled={saving || needsConsent || (openToMeet && !showMe)}
          onClick={saveDetails}
          className="pressable fade-in sticky bottom-24 z-20 flex min-h-[3.75rem] items-center justify-center gap-2 rounded-full bg-[var(--accent)] text-lg font-extrabold text-black shadow-[var(--shadow-glow)] disabled:opacity-60"
        >
          {saving && <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />}{" "}
          {openToMeet && !showMe ? "Scegli chi mostrarti" : needsConsent ? "Serve il tuo consenso" : "Salva le modifiche"}
        </button>
      )}

      <button
        type="button"
        onClick={() => run(() => saveDiscoverSettings({ paused: !data.paused }), data.paused ? "Sei di nuovo visibile" : "Profilo in pausa")}
        className="flex min-h-[3.5rem] items-center justify-center gap-2 rounded-full btn-secondary text-base font-bold text-white"
      >
        {data.paused ? <Play className="h-5 w-5" aria-hidden="true" /> : <Pause className="h-5 w-5" aria-hidden="true" />}
        {data.paused ? "Riattiva il profilo" : "Metti in pausa (nessuno ti vede)"}
      </button>

      {editing !== null && (
        <PromptEditor
          position={editing}
          current={data.prompts.find((p) => p.position === editing) ?? null}
          used={data.prompts.filter((p) => p.position !== editing).map((p) => p.promptKey)}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null)
            router.refresh()
          }}
        />
      )}
      <Sheet open={preview} onOpenChange={setPreview} title="Così ti vedono">
        <ProfileCard card={data.preview} />
      </Sheet>
    </div>
  )
}

function PromptEditor({
  position,
  current,
  used,
  onClose,
  onSaved,
}: {
  position: number
  current: { promptKey: string; answer: string } | null
  used: string[]
  onClose: () => void
  onSaved: () => void
}) {
  const [key, setKey] = useState<string | null>(current?.promptKey ?? null)
  const [answer, setAnswer] = useState(current?.answer ?? "")
  const [busy, setBusy] = useState(false)

  async function save() {
    if (!key) return
    setBusy(true)
    try {
      await savePrompt({ position, promptKey: key, answer })
      onSaved()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Non riuscito")
    } finally {
      setBusy(false)
    }
  }

  async function remove() {
    setBusy(true)
    try {
      await deletePrompt({ position })
      onSaved()
    } catch {
      toast.error("Non riuscito")
    } finally {
      setBusy(false)
    }
  }

  return (
    <Sheet open onOpenChange={(o) => !o && onClose()} title={key ? promptText(key) : "Scegli una domanda"}>
      {!key ? (
        <ul className="flex flex-col gap-2">
          {PROMPTS.filter((p) => !used.includes(p.key)).map((p) => (
            <li key={p.key}>
              <button type="button" onClick={() => setKey(p.key)} className="min-h-[3.5rem] w-full rounded-[var(--radius-md)] bg-[var(--surface-2)] px-4 text-left text-base font-bold text-white">
                {p.text}
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <div className="flex flex-col gap-3">
          <label htmlFor="prompt-answer" className="sr-only">Risposta</label>
          <textarea
            id="prompt-answer"
            value={answer}
            onChange={(e) => setAnswer(e.target.value.slice(0, ANSWER_MAX))}
            rows={4}
            autoFocus
            className="w-full resize-none rounded-[var(--radius-md)] bg-[var(--surface-2)] p-4 font-serif text-2xl leading-snug text-white outline-none ring-1 ring-[var(--border)] focus:ring-[var(--accent)]"
          />
          <p className="text-right text-xs text-[var(--muted-text)]">{answer.length}/{ANSWER_MAX}</p>
          <button
            type="button"
            disabled={busy || answer.trim().length < 2}
            onClick={save}
            className="pressable flex min-h-[3.75rem] items-center justify-center gap-2 rounded-full bg-[var(--accent)] text-lg font-extrabold text-black disabled:opacity-60"
          >
            {busy && <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />} Salva risposta
          </button>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => setKey(null)} className="min-h-[3.5rem] rounded-full bg-[var(--surface-2)] text-base font-bold text-white">
              Cambia domanda
            </button>
            {current ? (
              <button type="button" disabled={busy} onClick={remove} className="min-h-[3.5rem] rounded-full bg-[var(--surface-2)] text-base font-bold text-[var(--danger)]">
                Elimina
              </button>
            ) : (
              <span />
            )}
          </div>
        </div>
      )}
    </Sheet>
  )
}
