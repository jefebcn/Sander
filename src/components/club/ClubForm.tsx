"use client"

import { useId, useRef, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Camera, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { requestClub, updateClub } from "@/actions/clubs"
import { shrinkImage } from "@/lib/shrinkImage"

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
}

const EMPTY: ClubFormValues = { name: "", city: "", address: "", description: "", instagram: "", website: "", contactEmail: "", logoUrl: null }

/** Request a club (no clubId) or edit it (clubId): same fields both ways. */
export function ClubForm({ clubId, initial }: { clubId?: string; initial?: ClubFormValues }) {
  const [v, setV] = useState<ClubFormValues>(initial ?? EMPTY)
  const [uploading, setUploading] = useState(false)
  const [pending, startTransition] = useTransition()
  const fileRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const id = useId()
  const set = (k: keyof ClubFormValues) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setV((x) => ({ ...x, [k]: e.target.value }))

  async function uploadLogo(file: File) {
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append("file", await shrinkImage(file))
      const res = await fetch("/api/tournament-cover", { method: "POST", body: fd })
      const json = (await res.json()) as { url?: string | null; error?: string }
      if (json.url) setV((x) => ({ ...x, logoUrl: json.url! }))
      else toast.error(json.error ?? "Caricamento non riuscito")
    } catch {
      toast.error("Caricamento non riuscito")
    } finally {
      setUploading(false)
    }
  }

  function submit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      const payload = { ...v, logoUrl: v.logoUrl || null }
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
