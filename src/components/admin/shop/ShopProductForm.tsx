"use client"

import { useId, useRef, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, ArrowRight, ImagePlus, Loader2, Plus, Trash2, X } from "lucide-react"
import { toast } from "sonner"
import { adminDeleteShopProduct, adminSaveShopProduct } from "@/actions/shop"
import { shrinkImage } from "@/lib/shrinkImage"
import { SHOP_CATEGORIES, SIZE_PRESETS } from "@/lib/shop"
import { cn } from "@/lib/utils"

export interface ShopProductFormValues {
  id?: string
  name: string
  description: string
  category: "MAGLIE" | "ACCESSORI"
  price: string
  images: string[]
  active: boolean
  featured: boolean
  sortOrder: number
  variants: { id?: string; label: string; stock: number }[]
}

const FIELD = "min-h-[3.5rem] w-full rounded-[var(--radius-sm)] bg-[var(--surface-3)] px-4 text-base text-white placeholder:text-[var(--muted-text)] outline-none focus:ring-2 focus:ring-[var(--accent)]"
const LABEL = "mb-1.5 block text-sm font-bold text-[var(--muted-text)]"

export function ShopProductForm({ initial }: { initial: ShopProductFormValues }) {
  const [v, setV] = useState(initial)
  const [uploading, setUploading] = useState(false)
  const [pending, startTransition] = useTransition()
  const fileRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const id = useId()

  async function addPhoto(file: File) {
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append("file", await shrinkImage(file))
      const res = await fetch("/api/tournament-cover", { method: "POST", body: fd })
      const json = (await res.json()) as { url?: string | null; error?: string }
      if (json.url) setV((x) => ({ ...x, images: [...x.images, json.url as string].slice(0, 6) }))
      else toast.error(json.error ?? "Caricamento non riuscito")
    } catch {
      toast.error("Caricamento non riuscito")
    } finally {
      setUploading(false)
    }
  }

  const movePhoto = (i: number, d: -1 | 1) =>
    setV((x) => {
      const images = [...x.images]
      const j = i + d
      if (j < 0 || j >= images.length) return x
      ;[images[i], images[j]] = [images[j], images[i]]
      return { ...x, images }
    })

  const setVariant = (i: number, patch: Partial<{ label: string; stock: number }>) =>
    setV((x) => ({ ...x, variants: x.variants.map((s, j) => (j === i ? { ...s, ...patch } : s)) }))

  function preset(labels: readonly string[]) {
    setV((x) => ({ ...x, variants: labels.map((label) => x.variants.find((s) => s.label === label) ?? { label, stock: 0 }) }))
  }

  function save(e: React.FormEvent) {
    e.preventDefault()
    const priceCents = Math.round(Number(v.price.replace(",", ".")) * 100)
    if (!Number.isFinite(priceCents)) return void toast.error("Prezzo non valido")
    startTransition(async () => {
      const res = await adminSaveShopProduct({
        id: v.id,
        name: v.name,
        description: v.description,
        category: v.category,
        priceCents,
        images: v.images,
        active: v.active,
        featured: v.featured,
        sortOrder: v.sortOrder,
        variants: v.variants,
      })
      if (!res.ok) return void toast.error(res.error)
      toast.success(res.message)
      router.push("/admin/shop")
      router.refresh()
    })
  }

  function remove() {
    if (!v.id || !window.confirm(`Eliminare «${v.name}»? Se vuoi solo toglierlo dalla vendita, spegni «In vendita».`)) return
    startTransition(async () => {
      const res = await adminDeleteShopProduct(v.id)
      if (!res.ok) return void toast.error(res.error)
      toast.success(res.message)
      router.push("/admin/shop")
      router.refresh()
    })
  }

  const totalStock = v.variants.reduce((n, s) => n + (Number.isFinite(s.stock) ? s.stock : 0), 0)

  return (
    <form onSubmit={save} className="flex flex-col gap-5 px-4">
      <div>
        <span className={LABEL}>Foto (la prima è la copertina, max 6)</span>
        <div className="grid grid-cols-3 gap-2">
          {v.images.map((src, i) => (
            <div key={src} className="relative aspect-square overflow-hidden rounded-[var(--radius-sm)] bg-[var(--surface-2)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt={`Foto ${i + 1}`} className="h-full w-full object-cover" />
              <div className="absolute inset-x-1 bottom-1 flex justify-between">
                <button type="button" aria-label="Sposta prima" onClick={() => movePhoto(i, -1)} className="flex h-9 w-9 items-center justify-center rounded-full bg-black/70 text-white">
                  <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                </button>
                <button type="button" aria-label="Togli foto" onClick={() => setV((x) => ({ ...x, images: x.images.filter((_, j) => j !== i) }))} className="flex h-9 w-9 items-center justify-center rounded-full bg-black/70 text-white">
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
                <button type="button" aria-label="Sposta dopo" onClick={() => movePhoto(i, 1)} className="flex h-9 w-9 items-center justify-center rounded-full bg-black/70 text-white">
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
              {i === 0 && <span className="absolute left-1 top-1 rounded-full bg-[var(--accent)] px-2 py-0.5 text-[11px] font-extrabold text-black">Copertina</span>}
            </div>
          ))}
          {v.images.length < 6 && (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="flex aspect-square flex-col items-center justify-center gap-1 rounded-[var(--radius-sm)] border-2 border-dashed border-white/20 text-sm font-bold text-[var(--muted-text)]"
            >
              {uploading ? <Loader2 className="h-6 w-6 animate-spin" aria-hidden="true" /> : <ImagePlus className="h-6 w-6" aria-hidden="true" />}
              Aggiungi
            </button>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) void addPhoto(f) }} />
      </div>

      <div>
        <label htmlFor={`${id}-name`} className={LABEL}>Nome</label>
        <input id={`${id}-name`} className={FIELD} value={v.name} onChange={(e) => setV((x) => ({ ...x, name: e.target.value }))} placeholder="Maglia ufficiale SANDER" required />
      </div>
      <div>
        <label htmlFor={`${id}-desc`} className={LABEL}>Descrizione</label>
        <textarea id={`${id}-desc`} rows={4} className={cn(FIELD, "py-3")} value={v.description} onChange={(e) => setV((x) => ({ ...x, description: e.target.value }))} placeholder="Materiale, vestibilità, colore…" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor={`${id}-price`} className={LABEL}>Prezzo (€)</label>
          <input id={`${id}-price`} className={FIELD} inputMode="decimal" value={v.price} onChange={(e) => setV((x) => ({ ...x, price: e.target.value }))} placeholder="25" required />
        </div>
        <div>
          <span className={LABEL}>Categoria</span>
          <div className="flex gap-2">
            {SHOP_CATEGORIES.map((c) => (
              <button key={c.id} type="button" aria-pressed={v.category === c.id} onClick={() => setV((x) => ({ ...x, category: c.id }))} className={cn("min-h-[3.5rem] flex-1 rounded-[var(--radius-sm)] text-sm font-bold", v.category === c.id ? "sel-on" : "sel-off")}>
                {c.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <span className={cn(LABEL, "mb-0")}>Taglie e pezzi disponibili ({totalStock})</span>
        </div>
        <div className="mb-2 flex gap-2">
          <button type="button" onClick={() => preset(SIZE_PRESETS.shirts)} className="min-h-[2.75rem] rounded-full px-4 text-sm font-bold sel-off">XS → XXL</button>
          <button type="button" onClick={() => preset(SIZE_PRESETS.oneSize)} className="min-h-[2.75rem] rounded-full px-4 text-sm font-bold sel-off">Taglia unica</button>
        </div>
        <div className="flex flex-col gap-2">
          {v.variants.map((s, i) => (
            <div key={i} className="flex items-center gap-2">
              <label className="sr-only" htmlFor={`${id}-sz-${i}`}>Taglia</label>
              <input id={`${id}-sz-${i}`} className={cn(FIELD, "flex-1")} value={s.label} onChange={(e) => setVariant(i, { label: e.target.value })} placeholder="M" />
              <label className="sr-only" htmlFor={`${id}-st-${i}`}>Pezzi</label>
              <input id={`${id}-st-${i}`} className={cn(FIELD, "w-28 text-center")} inputMode="numeric" value={Number.isFinite(s.stock) ? s.stock : ""} onChange={(e) => setVariant(i, { stock: Number(e.target.value.replace(/\D/g, "") || 0) })} aria-label={`Pezzi ${s.label}`} />
              <button type="button" aria-label={`Togli taglia ${s.label}`} onClick={() => setV((x) => ({ ...x, variants: x.variants.filter((_, j) => j !== i) }))} className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-[var(--muted-text)]">
                <Trash2 className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
          ))}
          <button type="button" onClick={() => setV((x) => ({ ...x, variants: [...x.variants, { label: "", stock: 0 }] }))} className="flex min-h-[3rem] items-center justify-center gap-1.5 rounded-full text-sm font-bold sel-off">
            <Plus className="h-4 w-4" aria-hidden="true" /> Aggiungi taglia
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-1 rounded-[var(--radius-md)] bg-[var(--surface-2)] p-4">
        {(
          [
            ["active", "In vendita", "Spento: nascosto ai giocatori (lo vedi solo tu)"],
            ["featured", "In evidenza in home", "Compare come scheda «novità» in home"],
          ] as const
        ).map(([k, t, hint]) => (
          <button key={k} type="button" role="switch" aria-checked={v[k]} onClick={() => setV((x) => ({ ...x, [k]: !x[k] }))} className="flex min-h-[3.5rem] items-center gap-3 text-left">
            <span className={cn("relative h-7 w-12 shrink-0 rounded-full transition-colors", v[k] ? "bg-[var(--accent)]" : "bg-[var(--surface-3)]")}>
              <span className={cn("absolute top-1 h-5 w-5 rounded-full bg-white transition-all", v[k] ? "left-6" : "left-1")} />
            </span>
            <span>
              <span className="block text-base font-bold text-white">{t}</span>
              <span className="block text-sm text-[var(--muted-text)]">{hint}</span>
            </span>
          </button>
        ))}
      </div>

      <button type="submit" disabled={pending || uploading} className="btn btn-primary w-full disabled:opacity-60">
        {pending ? "Salvo…" : "Salva prodotto"}
      </button>
      {v.id && (
        <button type="button" onClick={remove} disabled={pending} className="flex min-h-[3.5rem] items-center justify-center gap-2 rounded-full text-base font-bold text-[var(--danger)]">
          <Trash2 className="h-5 w-5" aria-hidden="true" /> Elimina prodotto
        </button>
      )}
    </form>
  )
}
