import { Trophy, Shield, Zap, Crown, Flame, Target, Users, Heart } from "lucide-react"

const BADGE_META = {
  MVP_PARTITA:         { label: "MVP Partita",         icon: Trophy,  color: "#f59e0b" },
  MURO_IMPENETRABILE:  { label: "Muro Impenetrabile",  icon: Shield,  color: "#3b82f6" },
  DIFESA_ACROBATICA:   { label: "Difesa Acrobatica",   icon: Zap,     color: "#8b5cf6" },
  LEADER_CARISMATICO:  { label: "Leader Carismatico",  icon: Crown,   color: "#ec4899" },
  SCHIACCIATA_POTENTE: { label: "Schiacciata Potente", icon: Flame,   color: "#ef4444" },
  SERVIZIO_PRECISO:    { label: "Servizio Preciso",    icon: Target,  color: "#10b981" },
  SPIRITO_DI_SQUADRA:  { label: "Spirito di Squadra",  icon: Users,   color: "#06b6d4" },
  FAIR_PLAY:           { label: "Fair Play",           icon: Heart,   color: "#f97316" },
}

const BADGE_ORDER = [
  "MVP_PARTITA",
  "MURO_IMPENETRABILE",
  "DIFESA_ACROBATICA",
  "LEADER_CARISMATICO",
  "SCHIACCIATA_POTENTE",
  "SERVIZIO_PRECISO",
  "SPIRITO_DI_SQUADRA",
  "FAIR_PLAY",
] as const

interface BadgeDisplayProps {
  badges: { badge: string }[]
}

export function BadgeDisplay({ badges }: BadgeDisplayProps) {
  const counts: Record<string, number> = {}
  for (const b of badges) {
    counts[b.badge] = (counts[b.badge] ?? 0) + 1
  }

  return (
    <div className="rounded-2xl bg-[var(--surface-2)] p-4">
      <p className="text-xs font-bold uppercase tracking-wider text-[var(--muted-text)] mb-3">
        I tuoi badge
      </p>
      <div className="grid grid-cols-4 gap-3">
        {BADGE_ORDER.map((key) => {
          const meta = BADGE_META[key]
          const count = counts[key] ?? 0
          const earned = count > 0
          return (
            <div
              key={key}
              className="flex flex-col items-center gap-1.5 text-center"
              style={{ opacity: earned ? 1 : 0.35 }}
            >
              <div
                className="flex h-12 w-12 items-center justify-center rounded-2xl"
                style={{ background: earned ? `${meta.color}20` : "var(--surface-3)" }}
              >
                <meta.icon
                  className="h-6 w-6"
                  style={{ color: earned ? meta.color : "var(--muted-text)" }}
                />
              </div>
              <span className="text-[0.55rem] leading-tight text-[var(--muted-text)]">
                {meta.label}
              </span>
              {count > 1 && (
                <span className="text-[0.6rem] font-black" style={{ color: meta.color }}>
                  ×{count}
                </span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
