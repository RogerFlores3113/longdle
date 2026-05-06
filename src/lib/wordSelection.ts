import { ANSWERS } from '../data/words'

export const EPOCH = new Date('2026-05-04T00:00:00Z').getTime()
const MS_PER_DAY = 86_400_000

export function getDayIndex(now: Date = new Date()): number {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Los_Angeles',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
  const parts = fmt.formatToParts(now)
  const year = Number(parts.find(p => p.type === 'year')!.value)
  const month = Number(parts.find(p => p.type === 'month')!.value)
  const day = Number(parts.find(p => p.type === 'day')!.value)
  const laToday = Date.UTC(year, month - 1, day)
  return Math.floor((laToday - EPOCH) / MS_PER_DAY)
}

export function getDailyAnswer(dayIndex: number = getDayIndex()): string {
  return ANSWERS[dayIndex % ANSWERS.length]
}

export function isValidGuess(word: string, validWords: ReadonlySet<string>): boolean {
  return word.length === 6 && validWords.has(word)
}
