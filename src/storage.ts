// Everything stays on the phone. Storage can be unavailable (private mode), so every access is guarded.

export interface DayProgress {
  dayNumber: number
  guesses: string[][]
  status: 'playing' | 'won' | 'lost'
}

export interface Stats {
  played: number
  won: number
  streak: number
  maxStreak: number
  lastCompletedDay: number | null
}

export interface Settings {
  showVowels: boolean
  seenHelp: boolean
}

const KEYS = { progress: 'jidhr.progress', stats: 'jidhr.stats', settings: 'jidhr.settings', news: 'jidhr.news' }

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? { ...fallback, ...JSON.parse(raw) } : fallback
  } catch {
    return fallback
  }
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Nothing to do: the game still works for this session.
  }
}

export function loadProgress(dayNumber: number): DayProgress {
  const fresh: DayProgress = { dayNumber, guesses: [], status: 'playing' }
  const saved = read<DayProgress>(KEYS.progress, fresh)
  return saved.dayNumber === dayNumber ? saved : fresh
}

export const saveProgress = (p: DayProgress) => write(KEYS.progress, p)

const EMPTY_STATS: Stats = { played: 0, won: 0, streak: 0, maxStreak: 0, lastCompletedDay: null }

export const loadStats = () => read<Stats>(KEYS.stats, EMPTY_STATS)

// Finishing the day keeps the streak, solved or not: the learning happens in the reveal either way.
export function recordFinish(stats: Stats, dayNumber: number, won: boolean): Stats {
  if (stats.lastCompletedDay === dayNumber) return stats
  const streak = stats.lastCompletedDay === dayNumber - 1 ? stats.streak + 1 : 1
  const next: Stats = {
    played: stats.played + 1,
    won: stats.won + (won ? 1 : 0),
    streak,
    maxStreak: Math.max(stats.maxStreak, streak),
    lastCompletedDay: dayNumber,
  }
  write(KEYS.stats, next)
  return next
}

// A streak is broken once a whole day passes without finishing.
export function currentStreak(stats: Stats, today: number): number {
  if (stats.lastCompletedDay === null) return 0
  return stats.lastCompletedDay >= today - 1 ? stats.streak : 0
}

export const loadSettings = () => read<Settings>(KEYS.settings, { showVowels: true, seenHelp: false })
export const saveSettings = (s: Settings) => write(KEYS.settings, s)

// The written path: the translations typed today and how far through the paragraph the person got.
export interface NewsProgress {
  dayNumber: number
  answers: string[]
  checked: number
}

export function loadNews(dayNumber: number): NewsProgress {
  const fresh: NewsProgress = { dayNumber, answers: [], checked: 0 }
  const saved = read<NewsProgress>(KEYS.news, fresh)
  return saved.dayNumber === dayNumber ? saved : fresh
}

export const saveNews = (p: NewsProgress) => write(KEYS.news, p)
