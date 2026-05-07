export const SCHEMA_VERSION = 1 as const
export const GAME_STATE_KEY = 'longdle-game-state' as const
export const STATS_KEY = 'longdle-stats' as const
export const SETTINGS_KEY = 'longdle-settings' as const

export interface Stats {
  version: number
  gamesPlayed: number
  gamesWon: number
  currentStreak: number
  maxStreak: number
  guessDistribution: number[] // length 7: indices 0..5 = wins in 1..6 guesses, index 6 = losses
}

export const DEFAULT_STATS: Stats = {
  version: SCHEMA_VERSION,
  gamesPlayed: 0,
  gamesWon: 0,
  currentStreak: 0,
  maxStreak: 0,
  guessDistribution: [0, 0, 0, 0, 0, 0, 0],
}

export function readStats(): Stats {
  try {
    const raw = localStorage.getItem(STATS_KEY)
    if (!raw) return { ...DEFAULT_STATS, guessDistribution: [...DEFAULT_STATS.guessDistribution] }
    const parsed = JSON.parse(raw) as Stats
    if (parsed.version !== SCHEMA_VERSION) {
      console.warn(`longdle: stats v${parsed.version} != app v${SCHEMA_VERSION}, resetting`)
      return { ...DEFAULT_STATS, guessDistribution: [...DEFAULT_STATS.guessDistribution] }
    }
    return parsed
  } catch (e) {
    console.warn('longdle: stats read failed, resetting', e)
    return { ...DEFAULT_STATS, guessDistribution: [...DEFAULT_STATS.guessDistribution] }
  }
}

export function writeStats(stats: Stats): void {
  try {
    localStorage.setItem(STATS_KEY, JSON.stringify(stats))
  } catch (e) {
    console.warn('longdle: stats write failed', e)
  }
}

export function recordGameEnd(won: boolean, guessCount: number): Stats {
  const current = readStats()
  const next: Stats = {
    ...current,
    gamesPlayed: current.gamesPlayed + 1,
    gamesWon: current.gamesWon + (won ? 1 : 0),
    currentStreak: won ? current.currentStreak + 1 : 0,
    maxStreak: won
      ? Math.max(current.maxStreak, current.currentStreak + 1)
      : current.maxStreak,
    guessDistribution: [...current.guessDistribution],
  }
  if (won && guessCount >= 1 && guessCount <= 6) {
    next.guessDistribution[guessCount - 1]++
  }
  writeStats(next)
  return next
}
