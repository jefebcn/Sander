"use client"

import { Printer } from "lucide-react"

/** Save the page as a PDF to send: the browser's print dialog does it. */
export function PrintButton() {
  return (
    <button type="button" onClick={() => window.print()} className="btn btn-secondary min-h-[3rem] gap-2 px-4 print:hidden">
      <Printer className="h-4 w-4" aria-hidden="true" /> Salva PDF
    </button>
  )
}
