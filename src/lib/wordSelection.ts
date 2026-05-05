import { ANSWERS } from '../data/words'

export const EPOCH = new Date('2026-05-04T00:00:00Z').getTime()
const MS_PER_DAY = 86_400_000

export function getDayIndex(now: Date = new Date()): number {
  const utcToday = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate()
  )
  return Math.floor((utcToday - EPOCH) / MS_PER_DAY)
}

export function getDailyAnswer(dayIndex: number = getDayIndex()): string {
  return ANSWERS[dayIndex % ANSWERS.length]
}

export function isValidGuess(word: string, validWords: ReadonlySet<string>): boolean {
  return word.length === 6 && validWords.has(word)
}
