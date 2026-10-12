"use client"

import { useEffect, useState } from "react"
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

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex min-h-[3.5rem] w-full items-center justify-center gap-2 rounded-2xl bg-[var(--surface-3)] font-bold text-white text-base transition-colors active:bg-[var(--surface-4)]"
      >
        <QrCode className="h-5 w-5 text-[var(--accent)]" />
        {label}
      </button>

      {/* Full-screen overlay */}
      {open && (
        <div
          className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-black/80 px-6"
          onClick={() => setOpen(false)}
        >
          <div
            className="relative w-full max-w-xs rounded-3xl bg-white p-6 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setOpen(false)}
              aria-label="Chiudi"
              className="absolute right-3 top-3 flex h-11 w-11 items-center justify-center rounded-full bg-[var(--surface-3)]"
            >
              <X className="h-4 w-4 text-white" />
            </button>

            <p className="mb-4 text-lg font-black text-black">{title}</p>

            {/* QR Code rendered via Canvas */}
            <QRCanvas url={url} />

            <p className="mt-3 text-sm text-gray-600 break-all">{url}</p>
          </div>
        </div>
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
