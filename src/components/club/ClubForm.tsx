"use client"

import { useId, useRef, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Camera, Loader2, Plus, X } from "lucide-react"
import { toast } from "sonner"
import { requestClub, updateClub } from "@/actions/clubs"
import { shrinkImage } from "@/lib/shrinkImage"
import { CLUB_SERVICES, COURT_TYPES, MAX_CLUB_PHOTOS } from "@/lib/club"
import { cn } from "@/lib/utils"

const INPUT =
  "w-full min-h-[3.5rem] rounded-2xl bg-[var(--surface-2)] px-4 py-3 text-base text-white placeholder:text-[var(--muted-text)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
const LABEL = "mb-1 block px-1 text-sm font-semibold text-[var(--muted-text)]"

export interface ClubFormValues {
  name: string
  city: string
  address: string
  description: string
  instagram: string
  website: string
  contactEmail: string
  logoUrl: string | null
  // Courts and services: edited from the back office only.
  courts: string
  courtType: "" | keyof typeof COURT_TYPES
  openingHours: string
  courtPriceEuros: string
  services: string[]
  photos: string[]
  bagno: string
}

const EMPTY: ClubFormValues = {
  name: "", city: "", address: "", description: "", instagram: "", website: "", contactEmail: "", logoUrl: null,
  courts: "", courtType: "", openingHours: "", courtPriceEuros: "", services: [], photos: [], bagno: "",
}

/** "12,50" → 1250; empty → null. */
const euroCents = (v: string) => {
  const n = Number(v.replace(",", ".").trim())
  return v.trim() === "" || Number.isNaN(n) ? null : Math.round(n * 100)
}
const intOrNull = (v: string) => (v.trim() === "" ? null : parseInt(v, 10))

/** Request a club (no clubId) or edit it (clubId): same fields both ways. */
export function ClubForm({ clubId, initial }: { clubId?: string; initial?: ClubFormValues }) {
  const [v, setV] = useState<ClubFormValues>(initial ?? EMPTY)
  const [uploading, setUploading] = useState(false)
  const [pending, startTransition] = useTransition()
  const fileRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const id = useId()
  const set = (k: keyof ClubFormValues) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setV((x) => ({ ...x, [k]: e.target.value }))

  const photoRef = useRef<HTMLInputElement>(null)

  async function upload(file: File): Promise<string | null> {
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append("file", await shrinkImage(file))
      const res = await fetch("/api/tournament-cover", { method: "POST", body: fd })
      const json = (await res.json()) as { url?: string | null; error?: string }
      if (!json.url) toast.error(json.error ?? "Caricamento non riuscito")
      return json.url ?? null
    } catch {
      toast.error("Caricamento non riuscito")
      return null
    } finally {
      setUploading(false)
    }
  }

  async function uploadLogo(file: File) {
    const url = await upload(file)
    if (url) setV((x) => ({ ...x, logoUrl: url }))
  }

  async function addPhoto(file: File) {
    const url = await upload(file)
    if (url) setV((x) => ({ ...x, photos: [...x.photos, url].slice(0, MAX_CLUB_PHOTOS) }))
  }

  const toggleService = (key: string) =>
    setV((x) => ({ ...x, services: x.services.includes(key) ? x.services.filter((k) => k !== key) : [...x.services, key] }))

  function submit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      const { courtPriceEuros, courts, bagno, courtType, ...rest } = v
      const payload = {
        ...rest,
        logoUrl: v.logoUrl || null,
        courts: intOrNull(courts),
        bagno: intOrNull(bagno),
        courtType: courtType || null,
        courtPriceCents: euroCents(courtPriceEuros),
      }
      if (clubId) {
        const res = await updateClub({ clubId, ...payload })
        if (!res.ok) return void toast.error(res.error)
        toast.success("Club aggiornato")
        router.refresh()
        return
      }
      const res = await requestClub(payload)
      if (!res.ok) return void toast.error(res.error)
      router.push(`/c/${res.slug}`)
    })
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          aria-label="Carica il logo"
          className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-[var(--surface-2)] ring-1 ring-[var(--border)]"
        >
          {v.logoUrl ? (
            <Image src={v.logoUrl} alt="" fill sizes="80px" className="object-cover" />
          ) : uploading ? (
            <Loader2 className="h-6 w-6 animate-spin text-[var(--muted-text)]" aria-hidden="true" />
          ) : (
            <Camera className="h-6 w-6 text-[var(--muted-text)]" aria-hidden="true" />
          )}
        </button>
        <p className="text-base text-[var(--muted-text)]">Il logo del club, quadrato. Compare sulla pagina e sui tornei.</p>
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => e.target.files?.[0] && uploadLogo(e.target.files[0])} />
      </div>

      <div>
        <label htmlFor={`${id}-name`} className={LABEL}>Nome del club *</label>
        <input id={`${id}-name`} required value={v.name} onChange={set("name")} placeholder="Es. Beach Volley CUS Torino" className={INPUT} maxLength={60} />
      </div>
      <div>
        <label htmlFor={`${id}-city`} className={LABEL}>Città *</label>
        <input id={`${id}-city`} required value={v.city} onChange={set("city")} placeholder="Es. Torino" className={INPUT} maxLength={60} />
      </div>
      <div>
        <label htmlFor={`${id}-address`} className={LABEL}>Campi (indirizzo)</label>
        <input id={`${id}-address`} value={v.address} onChange={set("address")} placeholder="Via Modesto Panetti 30" className={INPUT} maxLength={120} />
      </div>
      <div>
        <label htmlFor={`${id}-desc`} className={LABEL}>Chi siete</label>
        <textarea id={`${id}-desc`} value={v.description} onChange={set("description")} rows={3} maxLength={600} placeholder="Corsi, tornei, il vostro giro…" className={`${INPUT} resize-none`} />
      </div>
      <div>
        <label htmlFor={`${id}-ig`} className={LABEL}>Instagram</label>
        <input id={`${id}-ig`} value={v.instagram} onChange={set("instagram")} placeholder="@beachvolleycustorino" className={INPUT} maxLength={80} />
      </div>
      <div>
        <label htmlFor={`${id}-web`} className={LABEL}>Sito</label>
        <input id={`${id}-web`} type="url" value={v.website} onChange={set("website")} placeholder="https://…" className={INPUT} />
      </div>
      <div>
        <label htmlFor={`${id}-mail`} className={LABEL}>Email di contatto</label>
        <input id={`${id}-mail`} type="email" value={v.contactEmail} onChange={set("contactEmail")} placeholder="info@club.it" className={INPUT} />
      </div>

      {clubId && (
        <fieldset className="flex flex-col gap-4 rounded-2xl bg-[var(--surface-1)] p-4">
          <legend className="eyebrow px-1 text-[var(--accent)]">Campi e servizi</legend>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor={`${id}-courts`} className={LABEL}>Numero campi</label>
              <input id={`${id}-courts`} inputMode="numeric" value={v.courts} onChange={set("courts")} placeholder="Es. 4" className={INPUT} />
            </div>
            <div>
              <label htmlFor={`${id}-price`} className={LABEL}>Affitto campo €/ora</label>
              <input id={`${id}-price`} inputMode="decimal" value={v.courtPriceEuros} onChange={set("courtPriceEuros")} placeholder="Es. 20" className={INPUT} />
            </div>
          </div>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Tipo di campi">
            {(Object.keys(COURT_TYPES) as (keyof typeof COURT_TYPES)[]).map((k) => (
              <button
                key={k}
                type="button"
                aria-pressed={v.courtType === k}
                onClick={() => setV((x) => ({ ...x, courtType: x.courtType === k ? "" : k }))}
                className={cn("min-h-[3rem] rounded-full px-4 text-base font-bold", v.courtType === k ? "bg-[var(--accent)] text-black" : "bg-[var(--surface-2)] text-white")}
              >
                {COURT_TYPES[k]}
              </button>
            ))}
          </div>
          <div>
            <label htmlFor={`${id}-hours`} className={LABEL}>Orari</label>
            <input id={`${id}-hours`} value={v.openingHours} onChange={set("openingHours")} maxLength={120} placeholder="Es. tutti i giorni 9–23" className={INPUT} />
          </div>
          <div>
            <p className={LABEL}>Servizi</p>
            <div className="flex flex-wrap gap-2">
              {CLUB_SERVICES.map((sv) => (
                <button
                  key={sv.key}
                  type="button"
                  aria-pressed={v.services.includes(sv.key)}
                  onClick={() => toggleService(sv.key)}
                  className={cn("min-h-[3rem] rounded-full px-4 text-base font-bold", v.services.includes(sv.key) ? "bg-[var(--accent)] text-black" : "bg-[var(--surface-2)] text-white")}
                >
                  {sv.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label htmlFor={`${id}-bagno`} className={LABEL}>Siete un bagno? Il numero</label>
            <input id={`${id}-bagno`} inputMode="numeric" value={v.bagno} onChange={set("bagno")} placeholder="Es. 26" className={INPUT} />
          </div>
          <div>
            <p className={LABEL}>Foto dei campi (fino a {MAX_CLUB_PHOTOS})</p>
            <div className="grid grid-cols-3 gap-2">
              {v.photos.map((url) => (
                <div key={url} className="relative aspect-square overflow-hidden rounded-xl bg-[var(--surface-2)]">
                  <Image src={url} alt="" fill sizes="120px" className="object-cover" />
                  <button
                    type="button"
                    aria-label="Togli la foto"
                    onClick={() => setV((x) => ({ ...x, photos: x.photos.filter((p) => p !== url) }))}
                    className="absolute right-1 top-1 flex h-9 w-9 items-center justify-center rounded-full bg-black/70 text-white"
                  >
                    <X className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              ))}
              {v.photos.length < MAX_CLUB_PHOTOS && (
                <button
                  type="button"
                  onClick={() => photoRef.current?.click()}
                  disabled={uploading}
                  aria-label="Aggiungi una foto"
                  className="flex aspect-square items-center justify-center rounded-xl bg-[var(--surface-2)] text-[var(--muted-text)]"
                >
                  {uploading ? <Loader2 className="h-6 w-6 animate-spin" aria-hidden="true" /> : <Plus className="h-6 w-6" aria-hidden="true" />}
                </button>
              )}
            </div>
            <input ref={photoRef} type="file" accept="image/*" hidden onChange={(e) => e.target.files?.[0] && addPhoto(e.target.files[0])} />
          </div>
        </fieldset>
      )}

      <button type="submit" disabled={pending || uploading} className="btn btn-primary w-full gap-2 disabled:opacity-60">
        {pending && <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />}
        {clubId ? "Salva" : "Invia la richiesta"}
      </button>
      {!clubId && (
        <p className="text-center text-sm text-[var(--muted-text)]">
          Controlliamo ogni club prima di pubblicarlo: di solito entro un giorno.
        </p>
      )}
    </form>
  )
}
