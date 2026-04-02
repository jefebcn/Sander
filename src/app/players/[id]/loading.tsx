export default function PlayerLoading() {
  return (
    <div>
      {/* PageHeader */}
      <div className="flex items-center gap-3 px-4 py-4">
        <div className="skeleton h-9 w-9 rounded-xl" />
        <div className="skeleton h-6 w-28 rounded-xl" />
      </div>

      <div className="px-4 pb-6 flex flex-col gap-4">
        {/* SanderCard */}
        <div className="skeleton rounded-3xl" style={{ height: "22rem" }} />

        {/* H2H stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="skeleton h-32 rounded-2xl" />
          <div className="skeleton h-32 rounded-2xl" />
        </div>
      </div>
    </div>
  )
}
