export interface Achievement {
  id: string
  emoji: string
  name: string
  description: string
  category: string
  unlocked: boolean
  progress: string
}

interface AchievementStats {
  matchesWon: number
  matchesLost: number
  winRatePct: number
  sessionsPlayed: number
  tournamentsWon: number
  glickoRating: number
  level: number
  streak: number
  monthlyAwardPositions: number[]
}

function counter(current: number, target: number): string {
  return current >= target ? "" : `${current}/${target}`
}

export function computeAchievements(s: AchievementStats): Achievement[] {
  const total = s.matchesWon + s.matchesLost
  const rating = Math.round(s.glickoRating)

  type AchievementDef = Omit<Achievement, "unlocked" | "progress"> & { check: () => [boolean, string] }
  const defs: AchievementDef[] = [
    // ── Partite giocate ──────────────────────────────────────
    {
      id: "matches_1",
      emoji: "🏐",
      name: "Primo campo",
      description: "Gioca la tua prima partita",
      category: "partite",
      check: () => [total >= 1, counter(total, 1)],
    },
    {
      id: "matches_50",
      emoji: "🌟",
      name: "Veterano",
      description: "50 partite giocate",
      category: "partite",
      check: () => [total >= 50, counter(total, 50)],
    },
    {
      id: "matches_100",
      emoji: "💎",
      name: "Leggenda",
      description: "100 partite giocate",
      category: "partite",
      check: () => [total >= 100, counter(total, 100)],
    },

    // ── Vittorie ─────────────────────────────────────────────
    {
      id: "wins_1",
      emoji: "⭐",
      name: "Prima vittoria",
      description: "Vinci la tua prima partita",
      category: "vittorie",
      check: () => [s.matchesWon >= 1, counter(s.matchesWon, 1)],
    },
    {
      id: "wins_20",
      emoji: "🏅",
      name: "20 vittorie",
      description: "20 partite vinte",
      category: "vittorie",
      check: () => [s.matchesWon >= 20, counter(s.matchesWon, 20)],
    },
    {
      id: "wins_50",
      emoji: "🥇",
      name: "50 vittorie",
      description: "50 partite vinte",
      category: "vittorie",
      check: () => [s.matchesWon >= 50, counter(s.matchesWon, 50)],
    },
    {
      id: "wins_100",
      emoji: "👑",
      name: "100 vittorie",
      description: "100 partite vinte",
      category: "vittorie",
      check: () => [s.matchesWon >= 100, counter(s.matchesWon, 100)],
    },

    // ── Win rate ─────────────────────────────────────────────
    {
      id: "wr_60",
      emoji: "🎯",
      name: "Tecnico",
      description: "60%+ win rate su min. 10 partite",
      category: "abilità",
      check: () => {
        if (total < 10) return [false, `${total}/10 partite richieste`]
        return [s.winRatePct >= 60, s.winRatePct >= 60 ? "" : `${s.winRatePct}%/60%`]
      },
    },
    {
      id: "wr_70",
      emoji: "💪",
      name: "Dominante",
      description: "70%+ win rate su min. 20 partite",
      category: "abilità",
      check: () => {
        if (total < 20) return [false, `${total}/20 partite richieste`]
        return [s.winRatePct >= 70, s.winRatePct >= 70 ? "" : `${s.winRatePct}%/70%`]
      },
    },

    // ── Sessioni ─────────────────────────────────────────────
    {
      id: "sessions_10",
      emoji: "📅",
      name: "Assiduo",
      description: "10 sessioni giocate",
      category: "sessioni",
      check: () => [s.sessionsPlayed >= 10, counter(s.sessionsPlayed, 10)],
    },
    {
      id: "sessions_30",
      emoji: "🏛️",
      name: "Pilastro",
      description: "30 sessioni giocate",
      category: "sessioni",
      check: () => [s.sessionsPlayed >= 30, counter(s.sessionsPlayed, 30)],
    },

    // ── Tornei ───────────────────────────────────────────────
    {
      id: "tournaments_1",
      emoji: "🏆",
      name: "Campione",
      description: "Vinci il tuo primo torneo",
      category: "tornei",
      check: () => [s.tournamentsWon >= 1, counter(s.tournamentsWon, 1)],
    },
    {
      id: "tournaments_3",
      emoji: "🔱",
      name: "Campione seriale",
      description: "Vinci 3 tornei",
      category: "tornei",
      check: () => [s.tournamentsWon >= 3, counter(s.tournamentsWon, 3)],
    },

    // ── Rating Glicko ────────────────────────────────────────
    {
      id: "rating_1700",
      emoji: "📈",
      name: "Professionista",
      description: "Raggiungi 1700 di rating Glicko",
      category: "rating",
      check: () => [rating >= 1700, rating >= 1700 ? "" : `${rating}/1700`],
    },
    {
      id: "rating_2000",
      emoji: "🚀",
      name: "Elite",
      description: "Raggiungi 2000 di rating Glicko",
      category: "rating",
      check: () => [rating >= 2000, rating >= 2000 ? "" : `${rating}/2000`],
    },

    // ── Streak ───────────────────────────────────────────────
    {
      id: "streak_5",
      emoji: "🔥",
      name: "Costante",
      description: "5+ sessioni nelle ultime 4 settimane",
      category: "streak",
      check: () => [s.streak >= 5, s.streak >= 5 ? "" : `${s.streak}/5`],
    },

    // ── Livello ──────────────────────────────────────────────
    {
      id: "level_5",
      emoji: "🌠",
      name: "Veterano digitale",
      description: "Raggiungi il livello 5",
      category: "livello",
      check: () => [s.level >= 5, s.level >= 5 ? "" : `Lv.${s.level}/5`],
    },

    // ── Community ────────────────────────────────────────────
    {
      id: "podio_any",
      emoji: "🎖️",
      name: "Sul podio",
      description: "Finisci tra i top 3 in classifica mensile",
      category: "community",
      check: () => [s.monthlyAwardPositions.length > 0, ""],
    },
    {
      id: "podio_1",
      emoji: "🏅",
      name: "Re del mese",
      description: "Finisci primo in classifica mensile",
      category: "community",
      check: () => [s.monthlyAwardPositions.includes(1), ""],
    },
  ]

  const results: Achievement[] = defs.map(({ check, ...def }) => {
    const [unlocked, progress] = check()
    return { ...def, unlocked, progress }
  })

  // Unlocked first, then locked
  return [
    ...results.filter((a) => a.unlocked),
    ...results.filter((a) => !a.unlocked),
  ]
}
