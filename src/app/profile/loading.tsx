export default function ProfileLoading() {
  return (
    <div className="pb-6">
      <div className="flex items-start gap-3 px-4 py-5">
        <div className="flex-1 space-y-2">
          <div className="skeleton h-7 w-32 rounded-xl" />
          <div className="skeleton h-4 w-24 rounded-lg" />
        </div>
      </div>
      <div className="px-4 space-y-4">
        <div className="skeleton h-64 rounded-3xl" />
        <div className="skeleton h-14 rounded-2xl" />
        <div className="skeleton h-14 rounded-2xl" />
      </div>
    </div>
  )
}
