import Image from "next/image"
import { cn } from "@/lib/utils"

/* Gabbo, the seagull: SANDER's supporting character. Only on the sport and
   community side (empty screens, errors, level up, a lost match), never on
   Scopri, paid tournaments or store graphics, where people or money come first. */

const POSES = {
  /** Sitting on the sand next to the ball, waiting: empty screens. */
  attesa: { src: "/mascot/gabbo-attesa.webp", width: 480, height: 471 },
  /** Hugging a deflated ball: a lost match, an error. */
  triste: { src: "/mascot/gabbo-triste.webp", width: 276, height: 480 },
  /** Jumping, wings up: level up, a win. */
  vittoria: { src: "/mascot/gabbo-vittoria.webp", width: 457, height: 480 },
} as const

export type GabboPose = keyof typeof POSES

export function Gabbo({
  pose,
  size = 128,
  className,
  priority,
}: {
  pose: GabboPose
  /** Height in CSS pixels; the width follows the pose. */
  size?: number
  className?: string
  /** For the main image of an overlay that opens straight away. */
  priority?: boolean
}) {
  const p = POSES[pose]
  return (
    <Image
      src={p.src}
      alt=""
      aria-hidden="true"
      width={p.width}
      height={p.height}
      style={{ height: size, width: "auto" }}
      sizes={`${Math.round((size * p.width) / p.height)}px`}
      preload={priority}
      className={cn("pointer-events-none select-none drop-shadow-[0_12px_18px_rgb(0_0_0/0.45)]", className)}
    />
  )
}
