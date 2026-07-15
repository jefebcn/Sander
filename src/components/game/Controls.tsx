"use client"

import type { MutableRefObject, ReactNode } from "react"
import { ChevronLeft, ChevronRight, ArrowUp, Zap } from "lucide-react"
import type { Inputs } from "@/lib/game/engine"

/* On-screen touch controls — big targets (>=56px), hold-to-act via pointer
   events writing straight into the shared input ref (zero re-renders). */

interface Props {
  inputRef: MutableRefObject<Inputs>
}

function HoldButton({
  onHold,
  label,
  children,
  accent = false,
  wide = false,
}: {
  onHold: (down: boolean) => void
  label: string
  children: ReactNode
  accent?: boolean
  wide?: boolean
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onPointerDown={(e) => {
        e.preventDefault()
        e.currentTarget.setPointerCapture(e.pointerId)
        onHold(true)
      }}
      onPointerUp={() => onHold(false)}
      onPointerCancel={() => onHold(false)}
      onPointerLeave={() => onHold(false)}
      onContextMenu={(e) => e.preventDefault()}
      className={`flex min-h-[3.75rem] items-center justify-center rounded-2xl font-black transition-transform active:scale-95 select-none ${
        wide ? "flex-1" : "w-16"
      }`}
      style={{
        background: accent ? "var(--accent)" : "var(--surface-2)",
        color: accent ? "#000" : "#fff",
        touchAction: "none",
        WebkitUserSelect: "none",
        userSelect: "none",
      }}
    >
      {children}
    </button>
  )
}

export function Controls({ inputRef }: Props) {
  return (
    <div className="flex items-stretch justify-between gap-3 px-3 pb-4 pt-2">
      {/* Movement */}
      <div className="flex gap-2">
        <HoldButton label="Sinistra" onHold={(d) => (inputRef.current.left = d)}>
          <ChevronLeft className="h-7 w-7" />
        </HoldButton>
        <HoldButton label="Destra" onHold={(d) => (inputRef.current.right = d)}>
          <ChevronRight className="h-7 w-7" />
        </HoldButton>
      </div>

      {/* Actions */}
      <div className="flex flex-1 gap-2 max-w-[240px]">
        <HoldButton label="Salto" wide onHold={(d) => (inputRef.current.jump = d)}>
          <span className="flex items-center gap-1.5 text-sm">
            <ArrowUp className="h-5 w-5" /> SALTO
          </span>
        </HoldButton>
        <HoldButton label="Schiaccia" wide accent onHold={(d) => (inputRef.current.spike = d)}>
          <span className="flex items-center gap-1.5 text-sm">
            <Zap className="h-5 w-5" /> SPIKE
          </span>
        </HoldButton>
      </div>
    </div>
  )
}
