export default function SessionLoading() {
  return (
    <div className="pb-6">
      {/* PageHeader */}
      <div className="flex items-center gap-3 px-4 py-4">
        <div className="skeleton h-9 w-9 rounded-xl" />
        <div className="flex-1 space-y-1.5">
          <div className="skeleton h-6 w-40 rounded-xl" />
          <div className="skeleton h-4 w-24 rounded-lg" />
        </div>
        <div className="skeleton h-6 w-16 rounded-full" />
      </div>

      <div className="space-y-4 px-4">
        {/* Details card */}
        <div className="space-y-3 rounded-2xl bg-[var(--surface-1)] p-4">
          <div className="skeleton h-4 w-48 rounded-lg" />
          <div className="skeleton h-4 w-36 rounded-lg" />
          <div className="skeleton h-4 w-20 rounded-lg" />
        </div>

        {/* Share button */}
        <div className="skeleton h-14 rounded-2xl" />

        {/* Participants */}
        <div className="space-y-2">
          <div className="skeleton h-5 w-28 rounded-lg" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton h-14 rounded-2xl" />
          ))}
        </div>
      </div>
    </div>
  )
}
