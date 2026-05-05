import type { Achievement } from "@/lib/achievements"
import { cn } from "@/lib/utils"

export function Achievements({ achievements }: { achievements: Achievement[] }) {
  if (achievements.length === 0) return null

  const unlockedCount = achievements.filter((a) => a.unlocked).length

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-wider text-[var(--muted-text)]">
          Obiettivi
        </p>
        <span
          className="rounded-full px-2.5 py-0.5 text-xs font-black"
          style={{ background: "var(--accent)", color: "#000" }}
        >
          {unlockedCount}/{achievements.length}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {achievements.map((a) => (
          <div
            key={a.id}
            className={cn(
              "rounded-2xl p-3 flex flex-col gap-1",
              a.unlocked ? "bg-[var(--surface-2)]" : "bg-[var(--surface-2)] opacity-50",
            )}
          >
            <span className={cn("text-2xl leading-none", !a.unlocked && "grayscale")}>
              {a.emoji}
            </span>
            <p
              className={cn(
                "text-sm font-bold leading-snug mt-1",
                a.unlocked ? "text-white" : "text-[var(--muted-text)]",
              )}
            >
              {a.name}
            </p>
            {a.unlocked ? (
              <p className="text-[0.65rem] text-[var(--muted-text)] leading-snug">
                {a.description}
              </p>
            ) : (
              <p className="text-[0.65rem] text-[var(--muted-text)] leading-snug">
                {a.progress || a.description}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
