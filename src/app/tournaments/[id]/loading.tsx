export default function TournamentLoading() {
  return (
    <div className="pb-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 px-4 pt-5 pb-3">
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <div className="skeleton h-8 w-48 rounded-xl" />
            <div className="skeleton h-5 w-16 rounded-full" />
          </div>
          <div className="skeleton h-4 w-56 rounded-lg" />
        </div>
        <div className="skeleton h-9 w-9 rounded-xl" />
      </div>

      {/* Main content card */}
      <div className="mx-4 mb-4 skeleton h-24 rounded-2xl" />

      {/* Match cards */}
      <div className="space-y-3 px-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="skeleton h-28 rounded-2xl" />
        ))}
      </div>
    </div>
  )
}
