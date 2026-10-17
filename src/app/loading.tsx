// Shown instantly by Next.js while the home server component fetches data.
// Matches the rough layout of the home page (same crest colours, same shapes)
// to avoid a colour flash and layout shift.
export default function HomeLoading() {
  return (
    <div
      className="theme-crest flex min-h-dvh flex-col gap-6 bg-[var(--background)] px-4 pb-6"
      style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 1rem)" }}
    >
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="skeleton h-10 w-36" />
        <div className="skeleton h-11 w-11 rounded-full" />
      </div>

      {/* Player crest */}
      <div className="skeleton crest-clip" style={{ height: "24rem", borderRadius: 0, "--crest-tip": "2.25rem" } as React.CSSProperties} />

      {/* Next match */}
      <div className="skeleton h-40 rounded-[var(--radius-lg)]" />

      {/* Quick actions */}
      <div className="grid grid-cols-4 gap-2">
        <div className="skeleton h-24 rounded-[var(--radius-md)]" />
        <div className="skeleton h-24 rounded-[var(--radius-md)]" />
        <div className="skeleton h-24 rounded-[var(--radius-md)]" />
        <div className="skeleton h-24 rounded-[var(--radius-md)]" />
      </div>
    </div>
  )
}
