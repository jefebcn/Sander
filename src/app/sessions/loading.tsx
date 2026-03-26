export default function SessionsLoading() {
  return (
    <div className="pb-6">
      <div className="flex items-start gap-3 px-4 py-5">
        <div className="flex-1 space-y-2">
          <div className="skeleton h-7 w-24 rounded-xl" />
          <div className="skeleton h-4 w-36 rounded-lg" />
        </div>
        <div className="skeleton h-9 w-9 rounded-xl" />
      </div>
      <div className="space-y-3 px-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="skeleton h-24 rounded-2xl" />
        ))}
      </div>
    </div>
  )
}
