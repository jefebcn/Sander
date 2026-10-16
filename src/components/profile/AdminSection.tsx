import { ChevronDown } from "lucide-react"

/**
 * One collapsible block of the admin tab. The tab used to be a single
 * ~12,000px page; each area now folds away behind a labelled summary with
 * its item count, so the admin can jump straight to what they need.
 */
export function AdminSection({
  title,
  count,
  hint,
  defaultOpen = false,
  children,
}: {
  title: string
  count?: number
  hint?: string
  defaultOpen?: boolean
  children: React.ReactNode
}) {
  return (
    <details open={defaultOpen} className="group rounded-2xl bg-[var(--surface-1)] ring-1 ring-[var(--border)]">
      <summary className="flex min-h-[3.5rem] cursor-pointer list-none items-center gap-3 px-4 py-3 [&::-webkit-details-marker]:hidden">
        <span className="min-w-0 flex-1">
          <span className="block text-base font-black text-white">
            {title}
            {count !== undefined && (
              <span className="ml-2 rounded-full bg-[var(--surface-3)] px-2 py-0.5 text-sm font-bold text-[var(--muted-text)]">
                {count}
              </span>
            )}
          </span>
          {hint && <span className="block text-sm text-[var(--muted-text)]">{hint}</span>}
        </span>
        <ChevronDown
          className="h-5 w-5 shrink-0 text-[var(--muted-text)] transition-transform duration-200 group-open:rotate-180"
          aria-hidden="true"
        />
      </summary>
      <div className="space-y-2 px-3 pb-3">{children}</div>
    </details>
  )
}
