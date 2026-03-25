import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { cn } from "@/lib/utils"

interface PageHeaderProps {
  title: string
  subtitle?: string
  action?: React.ReactNode
  backHref?: string
  className?: string
}

export function PageHeader({ title, subtitle, action, backHref, className }: PageHeaderProps) {
  return (
    <header className={cn("flex items-start gap-3 px-4 py-5", className)}>
      {backHref && (
        <Link
          href={backHref}
          aria-label="Indietro"
          className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--surface-2)] text-[var(--muted-text)] transition-colors hover:bg-[var(--surface-3)] hover:text-[var(--foreground)]"
        >
          <ChevronLeft className="h-5 w-5" aria-hidden="true" />
        </Link>
      )}
      <div className="flex-1 min-w-0">
        <h1 className="text-2xl font-black tracking-tight text-[var(--foreground)] leading-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-0.5 text-sm text-[var(--muted-text)] truncate">{subtitle}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </header>
  )
}
