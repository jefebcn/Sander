export default function PlayersLoading() {
  return (
    <div className="pb-6">
      <div className="flex items-start gap-3 px-4 py-5">
        <div className="flex-1 space-y-2">
          <div className="skeleton h-7 w-32 rounded-xl" />
          <div className="skeleton h-4 w-40 rounded-lg" />
        </div>
      </div>
      <div className="space-y-3 px-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="skeleton h-16 rounded-2xl" />
        ))}
      </div>
    </div>
  )
}
