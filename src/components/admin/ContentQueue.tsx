"use client"

import { useState, useTransition } from "react"
import {
  Share2,
  Copy,
  Check,
  Download,
  CheckCircle2,
  X,
  Sparkles,
  Loader2,
  Megaphone,
} from "lucide-react"
import {
  listContent,
  markPublished,
  skipContent,
  generateContentNow,
  type ContentItem,
} from "@/actions/content"
import { shareOrDownloadBlob } from "@/lib/captureNode"

const KIND_LABEL: Record<string, string> = {
  weekly: "Settimana",
  community: "Community",
  tournament: "Torneo",
}

async function fetchImageBlob(path: string): Promise<Blob> {
  const res = await fetch(path)
  if (!res.ok) throw new Error("immagine non disponibile")
  return res.blob()
}

function Card({
  item,
  onChanged,
}: {
  item: ContentItem
  onChanged: () => void
}) {
  const [busy, setBusy] = useState<null | "share" | "download">(null)
  const [copied, setCopied] = useState(false)
  const [pending, startTransition] = useTransition()
  const fullText = `${item.caption}\n\n${item.hashtags}`

  async function share() {
    setBusy("share")
    try {
      const blob = await fetchImageBlob(item.imagePath)
      await shareOrDownloadBlob(blob, `sander-${item.kind}.png`, fullText)
    } catch {
      // ignore — user can still copy + download
    } finally {
      setBusy(null)
    }
  }

  async function download() {
    setBusy("download")
    try {
      const blob = await fetchImageBlob(item.imagePath)
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `sander-${item.kind}.png`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch {
      /* noop */
    } finally {
      setBusy(null)
    }
  }

  async function copy() {
    await navigator.clipboard.writeText(fullText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="overflow-hidden rounded-2xl bg-[var(--surface-1)]">
      <div className="flex gap-3 p-3">
        {/* Preview */}
        <div className="w-24 shrink-0 overflow-hidden rounded-xl bg-[var(--surface-2)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={item.imagePath}
            alt={item.title}
            className="h-full w-full object-cover"
            style={{ aspectRatio: "1080/1920" }}
            loading="lazy"
          />
        </div>

        {/* Text */}
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-2">
            <span
              className="rounded-full px-2 py-0.5 text-[0.6rem] font-black uppercase tracking-wider"
              style={{ background: "rgba(201,243,29,0.15)", color: "var(--accent)" }}
            >
              {KIND_LABEL[item.kind] ?? item.kind}
            </span>
            {item.status === "PUBLISHED" && (
              <span className="text-[0.6rem] font-bold uppercase tracking-wider text-[var(--live)]">
                Pubblicato
              </span>
            )}
          </div>
          <p className="line-clamp-3 whitespace-pre-line text-xs text-white/80 leading-snug">
            {item.caption}
          </p>
          <p className="mt-1 line-clamp-1 text-[0.65rem] text-[var(--accent)]">{item.hashtags}</p>
        </div>
      </div>

      {item.status === "READY" && (
        <div className="grid grid-cols-2 gap-1.5 border-t border-white/5 p-2">
          <button
            onClick={share}
            disabled={busy !== null}
            className="col-span-2 flex min-h-[2.75rem] items-center justify-center gap-2 rounded-xl text-sm font-black text-black disabled:opacity-60"
            style={{ background: "var(--accent)" }}
          >
            {busy === "share" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Share2 className="h-4 w-4" />}
            Condividi su TikTok / Instagram
          </button>
          <button
            onClick={copy}
            className="flex min-h-[2.75rem] items-center justify-center gap-1.5 rounded-xl bg-[var(--surface-2)] text-xs font-bold text-white"
          >
            {copied ? <Check className="h-4 w-4 text-[var(--live)]" /> : <Copy className="h-4 w-4" />}
            {copied ? "Copiato" : "Copia testo"}
          </button>
          <button
            onClick={download}
            disabled={busy !== null}
            className="flex min-h-[2.75rem] items-center justify-center gap-1.5 rounded-xl bg-[var(--surface-2)] text-xs font-bold text-white disabled:opacity-60"
          >
            {busy === "download" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            Scarica
          </button>
          <button
            onClick={() => startTransition(async () => { await markPublished(item.id); onChanged() })}
            disabled={pending}
            className="flex min-h-[2.75rem] items-center justify-center gap-1.5 rounded-xl bg-[var(--live)]/15 text-xs font-bold text-[var(--live)] disabled:opacity-60"
          >
            <CheckCircle2 className="h-4 w-4" /> Pubblicato
          </button>
          <button
            onClick={() => startTransition(async () => { await skipContent(item.id); onChanged() })}
            disabled={pending}
            className="flex min-h-[2.75rem] items-center justify-center gap-1.5 rounded-xl bg-[var(--surface-2)] text-xs font-bold text-[var(--muted-text)] disabled:opacity-60"
          >
            <X className="h-4 w-4" /> Salta
          </button>
        </div>
      )}
    </div>
  )
}

export function ContentQueue({ initial }: { initial: ContentItem[] }) {
  const [items, setItems] = useState(initial)
  const [pending, startTransition] = useTransition()
  const [msg, setMsg] = useState<string | null>(null)

  function refresh() {
    startTransition(async () => {
      setItems(await listContent())
    })
  }

  function generate() {
    setMsg(null)
    startTransition(async () => {
      const n = await generateContentNow()
      setItems(await listContent())
      setMsg(n > 0 ? `${n} nuovi contenuti generati` : "Nessun nuovo contenuto (già aggiornato)")
      setTimeout(() => setMsg(null), 3000)
    })
  }

  const ready = items.filter((i) => i.status === "READY")
  const done = items.filter((i) => i.status !== "READY")

  return (
    <div className="rounded-2xl bg-[var(--surface-2)] p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Megaphone className="h-4 w-4 text-[var(--accent)]" />
          <p className="text-sm font-black uppercase tracking-wider text-white">Contenuti social</p>
        </div>
        <button
          onClick={generate}
          disabled={pending}
          className="flex items-center gap-1.5 rounded-xl bg-[var(--surface-1)] px-3 py-2 text-xs font-bold text-white disabled:opacity-60"
        >
          {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5 text-[var(--accent)]" />}
          Genera ora
        </button>
      </div>

      {msg && <p className="text-xs font-bold text-[var(--accent)]">{msg}</p>}

      <p className="text-xs text-[var(--muted-text)]">
        Generati in automatico ogni giorno. Tocca <strong className="text-white">Condividi</strong> e scegli TikTok o Instagram: immagine + testo pronti.
      </p>

      {ready.length === 0 && done.length === 0 ? (
        <p className="rounded-xl bg-[var(--surface-1)] p-4 text-center text-sm text-[var(--muted-text)]">
          Nessun contenuto ancora. Tocca “Genera ora”.
        </p>
      ) : (
        <div className="space-y-2">
          {ready.map((it) => (
            <Card key={it.id} item={it} onChanged={refresh} />
          ))}
          {done.length > 0 && (
            <details className="pt-1">
              <summary className="cursor-pointer text-xs font-bold text-[var(--muted-text)]">
                Archivio ({done.length})
              </summary>
              <div className="mt-2 space-y-2 opacity-70">
                {done.map((it) => (
                  <Card key={it.id} item={it} onChanged={refresh} />
                ))}
              </div>
            </details>
          )}
        </div>
      )}
    </div>
  )
}
