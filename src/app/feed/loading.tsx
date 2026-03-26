export default function FeedLoading() {
  return (
    <div className="pb-6">
      <div className="flex items-start gap-3 px-4 py-5">
        <div className="flex-1 space-y-2">
          <div className="skeleton h-7 w-20 rounded-xl" />
          <div className="skeleton h-4 w-32 rounded-lg" />
        </div>
      </div>
      <div className="space-y-3 px-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="skeleton h-20 rounded-2xl" />
        ))}
      </div>
    </div>
  )
}
