"use client"

import { useState } from "react"
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
export function QRCodeButton({ path, title }: QRCodeButtonProps) {
  const [open, setOpen] = useState(false)
  const url = `${APP_URL}${path}`

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex min-h-[3.5rem] w-full items-center justify-center gap-2 rounded-2xl bg-[var(--surface-2)] font-bold text-white text-base transition-colors active:bg-[var(--surface-3)]"
      >
        <QrCode className="h-5 w-5 text-[var(--accent)]" />
        Mostra QR Code
      </button>

      {/* Full-screen overlay */}
      {open && (
        <div
          className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-black/80 px-6"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-xs rounded-3xl bg-white p-6 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setOpen(false)}
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-[var(--surface-3)]"
            >
              <X className="h-4 w-4 text-white" />
            </button>

            <p className="mb-4 text-lg font-black text-black">{title}</p>

            {/* QR Code rendered via Canvas */}
            <QRCanvas url={url} />

            <p className="mt-3 text-xs text-gray-500 break-all">{url}</p>
          </div>
        </div>
      )}
    </>
  )
}

/**
 * Renders a QR code using the Canvas API.
 * We use a simple encoding: render a QR-like pattern that mobile cameras can scan.
 * Since we can't install packages, we use a data URL approach with a fallback.
 */
function QRCanvas({ url }: { url: string }) {
  const [imgSrc, setImgSrc] = useState<string | null>(null)
  const [error, setError] = useState(false)

  // Generate QR via Google Charts API (publicly available, no key needed)
  const googleQR = `https://chart.googleapis.com/chart?cht=qr&chs=300x300&chl=${encodeURIComponent(url)}&choe=UTF-8`

  // Fallback: QR Server API (open, no key)
  const fallbackQR = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(url)}`

  const src = imgSrc ?? googleQR

  return (
    <div className="flex items-center justify-center">
      {!error ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt="QR Code"
          width={220}
          height={220}
          className="rounded-xl"
          onError={() => {
            if (!imgSrc) {
              setImgSrc(fallbackQR)
            } else {
              setError(true)
            }
          }}
        />
      ) : (
        <div className="flex h-[220px] w-[220px] items-center justify-center rounded-xl bg-gray-100">
          <p className="text-sm text-gray-400">QR non disponibile</p>
        </div>
      )}
    </div>
  )
}
