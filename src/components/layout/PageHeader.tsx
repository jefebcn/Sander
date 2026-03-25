import { cn } from "@/lib/utils"

interface PageHeaderProps {
  title: string
  subtitle?: string
  action?: React.ReactNode
  className?: string
}

export function PageHeader({ title, subtitle, action, className }: PageHeaderProps) {
  return (
    <div className={cn("flex items-start justify-between gap-4 px-4 py-5", className)}>
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--foreground)]">{title}</h1>
        {subtitle && (
          <p className="mt-0.5 text-sm text-[var(--muted-text)]">{subtitle}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}
