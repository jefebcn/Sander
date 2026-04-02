import Link from "next/link"
import { ChevronLeft, Zap, Star, Trophy, ClipboardList, ThumbsUp, Award, ShieldCheck, Flame, Crown, Swords } from "lucide-react"
import { getCurrentPlayer } from "@/lib/getCurrentPlayer"
import { db } from "@/lib/db"

export const dynamic = "force-dynamic"

const LEVEL_MILESTONES = [
  {
    level: 1,
    title: "Drop-In",
    description: "First time on the sand. The journey starts here.",
    icon: Star,
    color: "#94a3b8",
    bg: "rgba(148,163,184,0.12)",
  },
  {
    level: 2,
    title: "Sand Digger",
    description: "You're diving for every ball. Keep grinding.",
    icon: Zap,
    color: "var(--accent)",
    bg: "rgba(201,243,29,0.1)",
  },
  {
    level: 5,
    title: "Setter",
    description: "You read the game and set up the play. The team trusts you.",
    icon: ShieldCheck,
    color: "#38bdf8",
    bg: "rgba(56,189,248,0.1)",
  },
  {
    level: 10,
    title: "Spiker",
    description: "Your attacks hit hard. Opponents fear the net approach.",
    icon: Flame,
    color: "#f97316",
    bg: "rgba(249,115,22,0.1)",
  },
  {
    level: 20,
    title: "Ace",
    description: "Unreturnable serves. Unstoppable on the sand.",
    icon: Swords,
    color: "#a855f7",
    bg: "rgba(168,85,247,0.1)",
  },
  {
    level: 50,
    title: "Sand King",
    description: "The court is yours. Everyone knows your name on the beach.",
    icon: Crown,
    color: "#f59e0b",
    bg: "rgba(245,158,11,0.1)",
  },
]

const XP_ACTIONS = [
  {
    icon: ClipboardList,
    color: "text-[var(--accent)]",
    bg: "rgba(201,243,29,0.1)",
    label: "Completa una sessione",
    xp: "+10 XP",
    detail: "Ogni volta che partecipi a una partita completata",
  },
  {
    icon: ThumbsUp,
    color: "text-[var(--sky)]",
    bg: "rgba(0,180,240,0.1)",
    label: "Ricevi un Super Vote",
    xp: "+5 XP",
    detail: "Quando un compagno ti assegna il massimo dei voti",
  },
  {
    icon: Star,
    color: "text-[var(--gold)]",
    bg: "rgba(255,215,0,0.1)",
    label: "Organizza una sessione",
    xp: "+10 XP",
    detail: "Completata una sessione che hai organizzato tu",
  },
  {
    icon: Trophy,
    color: "text-[var(--accent)]",
    bg: "rgba(201,243,29,0.1)",
    label: "Vinci un torneo",
    xp: "+50 XP",
    detail: "Aggiudicandoti il primo posto in un torneo",
  },
  {
    icon: Award,
    color: "text-[var(--completed)]",
    bg: "rgba(168,85,247,0.1)",
    label: "Ricevi un badge",
    xp: "+5 XP",
    detail: "MVP, Difensore, Leader — ogni badge conta",
  },
]

export default async function LevelInfoPage() {
  const player = await getCurrentPlayer()

  let xpCurrent = 0
  let level = 1
  let nextLevel = 2
  let xpPct = 0

  if (player) {
    const full = await db.player.findUnique({ where: { id: player.id }, select: { xp: true, level: true } })
    if (full) {
      xpCurrent = full.xp % 100
      level = full.level
      nextLevel = full.level + 1
      xpPct = Math.round((xpCurrent / 100) * 100)
    }
  }

  return (
    <div className="pb-8">
      {/* Header */}
      <header className="flex items-center gap-3 px-4 py-5">
        <Link
          href="/"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--surface-2)] text-[var(--muted-text)]"
          aria-label="Indietro"
        >
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-white">Come si sale di livello</h1>
          <p className="text-sm text-[var(--muted-text)]">Guadagna XP giocando e interagendo</p>
        </div>
      </header>

      <div className="px-4 space-y-4">

        {/* Current progress (if logged in) */}
        {player && (
          <div className="rounded-2xl bg-[var(--surface-2)] p-5 slide-up">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-[var(--muted-text)]">
                  Livello attuale
                </p>
                <p className="text-4xl font-black text-white leading-tight">{level}</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold uppercase tracking-wider text-[var(--muted-text)]">
                  Prossimo livello
                </p>
                <p className="text-4xl font-black text-[var(--accent)] leading-tight">{nextLevel}</p>
              </div>
            </div>
            {/* XP bar */}
            <div className="h-2.5 overflow-hidden rounded-full bg-[var(--surface-3)] mb-2">
              <div
                className="xp-bar-fill h-full rounded-full bg-[var(--accent)]"
                style={{ width: `${Math.max(2, xpPct)}%` }}
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-[var(--muted-text)]">{xpCurrent} / 100 XP</span>
              <span className="text-xs font-semibold text-[var(--accent)]">
                mancano {100 - xpCurrent} XP
              </span>
            </div>
          </div>
        )}

        {/* Formula */}
        <div
          className="rounded-2xl px-4 py-3 flex items-center gap-3 slide-up stagger-1"
          style={{ background: "rgba(201,243,29,0.08)", border: "1px solid rgba(201,243,29,0.2)" }}
        >
          <Zap className="h-5 w-5 shrink-0 text-[var(--accent)]" />
          <p className="text-sm text-white/80">
            Ogni <strong className="text-[var(--accent)]">100 XP</strong> = salita di un livello.
            Non c&apos;è limite massimo di livello.
          </p>
        </div>

        {/* XP actions */}
        <div className="space-y-2 slide-up stagger-2">
          <p className="text-xs font-bold uppercase tracking-wider text-[var(--muted-text)] px-1">
            Come guadagnare XP
          </p>
          {XP_ACTIONS.map(({ icon: Icon, color, bg, label, xp, detail }) => (
            <div
              key={label}
              className="flex items-center gap-4 rounded-2xl bg-[var(--surface-2)] p-4"
            >
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                style={{ background: bg }}
              >
                <Icon className={`h-5 w-5 ${color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-white text-sm">{label}</p>
                <p className="text-xs text-[var(--muted-text)] leading-relaxed">{detail}</p>
              </div>
              <span className="shrink-0 text-sm font-black text-[var(--accent)]">{xp}</span>
            </div>
          ))}
        </div>

        {/* Level milestones */}
        <div className="space-y-2 slide-up stagger-3">
          <p className="text-xs font-bold uppercase tracking-wider text-[var(--muted-text)] px-1">
            Traguardi e titoli
          </p>
          {LEVEL_MILESTONES.map(({ level: lvl, title, description, icon: Icon, color, bg }) => {
            const isReached = player ? level >= lvl : false
            return (
              <div
                key={lvl}
                className="flex items-center gap-4 rounded-2xl p-4 transition-opacity"
                style={{
                  background: isReached ? "var(--surface-2)" : "var(--surface-1)",
                  opacity: isReached ? 1 : 0.5,
                }}
              >
                <div
                  className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl"
                  style={{ background: bg }}
                >
                  <Icon className="h-5 w-5" style={{ color }} />
                  <span className="text-[0.6rem] font-black mt-0.5" style={{ color }}>
                    Lv{lvl}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-black text-sm text-white">{title}</p>
                    {isReached && (
                      <span
                        className="rounded-full px-1.5 py-0.5 text-[0.6rem] font-black"
                        style={{ background: "rgba(201,243,29,0.15)", color: "var(--accent)" }}
                      >
                        RAGGIUNTO
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[var(--muted-text)] leading-relaxed">{description}</p>
                </div>
                {!isReached && player && (
                  <span className="shrink-0 text-xs font-bold text-[var(--muted-text)]">
                    Lv{lvl}
                  </span>
                )}
              </div>
            )
          })}
        </div>

        {/* Footer note */}
        <p className="text-xs text-center text-[var(--muted-text)] px-4 slide-up stagger-4">
          Il livello è una misura dell&apos;attività complessiva sulla piattaforma — più giochi, più sali.
        </p>
      </div>
    </div>
  )
}
