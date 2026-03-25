import { cn } from "@/lib/utils"

interface SkeletonProps {
  className?: string
}

export function Skeleton({ className }: SkeletonProps) {
  return <div className={cn("skeleton", className)} />
}

export function TournamentCardSkeleton() {
  return (
    <div className="rounded-2xl bg-[var(--surface-1)] p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 space-y-2">
          <Skeleton className="h-6 w-2/3" />
          <Skeleton className="h-4 w-1/2" />
        </div>
        <Skeleton className="h-8 w-16 rounded-full" />
      </div>
    </div>
  )
}

export function PlayerCardSkeleton() {
  return (
    <div className="flex min-h-[4rem] items-center gap-4 rounded-2xl bg-[var(--surface-1)] px-4">
      <Skeleton className="h-11 w-11 shrink-0 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-20" />
      </div>
      <Skeleton className="h-4 w-12" />
    </div>
  )
}

export function MatchCardSkeleton() {
  return (
    <div className="rounded-2xl bg-[var(--surface-2)] p-4 space-y-4">
      <div className="flex items-center gap-3">
        <div className="flex-1 space-y-1.5">
          <Skeleton className="h-5 w-24 ml-auto" />
          <Skeleton className="h-4 w-16 ml-auto" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-16 w-12" />
          <Skeleton className="h-4 w-4 self-center" />
          <Skeleton className="h-16 w-12" />
        </div>
        <div className="flex-1 space-y-1.5">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-4 w-16" />
        </div>
      </div>
      <Skeleton className="h-14 w-full" />
    </div>
  )
}

export function StandingsRowSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="rounded-2xl bg-[var(--surface-1)] overflow-hidden divide-y divide-[var(--border)]">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-3">
          <Skeleton className="h-6 w-6 rounded-full shrink-0" />
          <Skeleton className="h-4 flex-1 max-w-[120px]" />
          <Skeleton className="h-5 w-8 ml-auto" />
        </div>
      ))}
    </div>
  )
}
