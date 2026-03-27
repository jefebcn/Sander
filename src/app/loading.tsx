// Shown instantly by Next.js while the home server component fetches data.
// Matches the rough layout of the home page to avoid layout shift.
export default function HomeLoading() {
  return (
    <div className="flex flex-col px-4 pb-6" style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 1.25rem)" }}>
      {/* Header row */}
      <div className="flex items-center justify-between mb-6">
        <div className="skeleton h-8 w-32" />
        <div className="skeleton h-9 w-9 rounded-full" />
      </div>

      {/* Player card */}
      <div className="skeleton rounded-3xl mb-4" style={{ height: "22rem" }} />

      {/* Quick-action row */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="skeleton h-20 rounded-2xl" />
        <div className="skeleton h-20 rounded-2xl" />
      </div>

      {/* Feed item */}
      <div className="skeleton h-28 rounded-2xl mb-3" />
      <div className="skeleton h-28 rounded-2xl mb-3" />
    </div>
  )
}
