"use client"

import { useEffect, useId, useState } from "react"
import { createPortal } from "react-dom"
import { QrCode, X } from "lucide-react"

const APP_URL = "https://www.sanderbv.it"

interface QRCodeButtonProps {
  path: string
  title: string
}

/**
 * QR code as a simple visual grid using the URL encoded in a basic pattern.
 * Uses the browser Canvas API to generate a QR code image via a tiny encoder.
 */
export function QRCodeButton({ path, title, label = "Mostra QR Code" }: QRCodeButtonProps & { label?: string }) {
  const [open, setOpen] = useState(false)
  const url = `${APP_URL}${path}`
  const titleId = useId()

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false) }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open])

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex min-h-[3.5rem] w-full items-center justify-center gap-2 rounded-full btn-secondary font-bold text-white text-base"
      >
        <QrCode className="h-5 w-5" aria-hidden="true" />
        {label}
      </button>

      {/* Full-screen overlay, portalled to <body> so no ancestor (a transformed
          card, an animated wrapper) can trap it; z-[200] covers the navbar. */}
      {open && createPortal(
        <div
          className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-black/80 px-6"
          onClick={() => setOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="relative w-full max-w-xs rounded-3xl bg-white p-6 pt-4 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Title and close share one row, so a long title never runs under the X. */}
            <div className="mb-4 flex items-start gap-2">
              <span className="w-11 shrink-0" aria-hidden="true" />
              <p id={titleId} className="min-w-0 flex-1 pt-2 text-lg font-black leading-tight text-black">
                {title}
              </p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Chiudi"
                autoFocus
                className="-mr-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--surface-3)]"
              >
                <X className="h-5 w-5 text-white" aria-hidden="true" />
              </button>
            </div>

            {/* QR Code rendered via Canvas */}
            <QRCanvas url={url} />

            <p className="mt-3 text-sm text-gray-600 break-all">{url}</p>
          </div>
        </div>,
        document.body,
      )}
    </>
  )
}

/**
 * QR generated on the device with the `qrcode` package: works offline on the
 * beach and doesn't hand the (invite) URL to a third-party image service.
 */
function QRCanvas({ url }: { url: string }) {
  const [imgSrc, setImgSrc] = useState<string | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    let alive = true
    import("qrcode")
      .then((QR) => QR.toDataURL(url, { width: 440, margin: 1, errorCorrectionLevel: "M" }))
      .then((data) => { if (alive) setImgSrc(data) })
      .catch(() => { if (alive) setError(true) })
    return () => { alive = false }
  }, [url])

  return (
    <div className="flex items-center justify-center">
      {error ? (
        <div className="flex h-[220px] w-[220px] items-center justify-center rounded-xl bg-gray-100">
          <p className="text-sm text-gray-500">QR non disponibile</p>
        </div>
      ) : imgSrc ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imgSrc} alt="QR Code" width={220} height={220} className="rounded-xl" />
      ) : (
        <div className="h-[220px] w-[220px] animate-pulse rounded-xl bg-gray-100" aria-label="Generazione QR" />
      )}
    </div>
  )
}
