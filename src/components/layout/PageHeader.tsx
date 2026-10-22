import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { cn } from "@/lib/utils"
import { toneOf, type Tone } from "@/components/ui/Card"

interface PageHeaderProps {
  title: string
  subtitle?: string
  /** Small coloured label above the title — names the area you're in. */
  eyebrow?: string
  tone?: Tone
  action?: React.ReactNode
  backHref?: string
  className?: string
}

/** 56px tap area around a 44px visible circle. */
export function BackButton({ href, className }: { href: string; className?: string }) {
  return (
    <Link
      href={href}
      aria-label="Indietro"
      className={cn("-ml-1.5 flex h-14 w-14 shrink-0 items-center justify-center", className)}
    >
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--surface-3)] text-white ring-1 ring-white/15 transition-colors active:bg-[var(--surface-4)]">
        <ChevronLeft className="h-5 w-5" aria-hidden="true" />
      </span>
    </Link>
  )
}

export function PageHeader({ title, subtitle, eyebrow, tone, action, backHref, className }: PageHeaderProps) {
  return (
    <header
      className={cn("relative flex items-center gap-2 px-4 pb-4 [text-shadow:0_2px_14px_rgb(0_0_0/0.45)]", toneOf(tone), className)}
      style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 1rem)" }}
    >
      {backHref && <BackButton href={backHref} />}
      <div className="min-w-0 flex-1">
        {eyebrow && <p className="eyebrow text-[var(--tone)]">{eyebrow}</p>}
        <h1 className="font-hand text-[2.6rem] leading-[0.95] text-white">
          {title}
        </h1>
        {subtitle && <p className="mt-1 truncate text-sm text-white/80">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </header>
  )
}
