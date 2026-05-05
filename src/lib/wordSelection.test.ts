import { describe, it, expect } from 'vitest'
import { getDayIndex, getDailyAnswer, isValidGuess, EPOCH } from './wordSelection'
import { ANSWERS } from '../data/words'

describe('EPOCH', () => {
  it('equals 2026-05-04T00:00:00Z in ms', () => {
    expect(EPOCH).toBe(new Date('2026-05-04T00:00:00Z').getTime())
  })
})

describe('getDayIndex', () => {
  it('returns 0 at epoch midnight UTC', () => {
    expect(getDayIndex(new Date('2026-05-04T00:00:00Z'))).toBe(0)
  })
  it('returns 0 one millisecond after epoch', () => {
    expect(getDayIndex(new Date('2026-05-04T00:00:00.001Z'))).toBe(0)
  })
  it('returns 0 at end-of-day epoch UTC', () => {
    expect(getDayIndex(new Date('2026-05-04T23:59:59.999Z'))).toBe(0)
  })
  it('returns 1 at next-day midnight UTC', () => {
    expect(getDayIndex(new Date('2026-05-05T00:00:00Z'))).toBe(1)
  })
  it('returns same index regardless of timezone offset (Tokyo evening = UTC May 4)', () => {
    // 2026-05-05 08:00 JST = 2026-05-04 23:00 UTC → still day 0
    expect(getDayIndex(new Date('2026-05-04T23:00:00Z'))).toBe(0)
  })
  it('returns next index for NYC late-evening that crossed UTC midnight', () => {
    // 2026-05-04 23:00 EDT = 2026-05-05 03:00 UTC → day 1
    expect(getDayIndex(new Date('2026-05-05T03:00:00Z'))).toBe(1)
  })
  it('returns 1461 four years past epoch (proves no overflow)', () => {
    expect(getDayIndex(new Date('2030-05-04T00:00:00Z'))).toBe(1461)
  })
})

describe('getDailyAnswer', () => {
  it('returns ANSWERS[0] for dayIndex 0', () => {
    expect(getDailyAnswer(0)).toBe(ANSWERS[0])
  })
  it('wraps modulo ANSWERS.length (WORDS-04)', () => {
    expect(getDailyAnswer(ANSWERS.length)).toBe(ANSWERS[0])
    expect(getDailyAnswer(ANSWERS.length + 5)).toBe(ANSWERS[5])
  })
  it('uses getDayIndex() when called with no args', () => {
    const a = getDailyAnswer()
    expect(typeof a).toBe('string')
    expect(a.length).toBe(6)
    expect(ANSWERS).toContain(a)
  })
})

describe('isValidGuess', () => {
  const set = new Set(['planet', 'bridge'])
  it('returns true for word in set', () => {
    expect(isValidGuess('planet', set)).toBe(true)
  })
  it('returns false for word not in set', () => {
    expect(isValidGuess('xxxxxx', set)).toBe(false)
  })
  it('returns false for word of wrong length even if substring matches', () => {
    expect(isValidGuess('plan', new Set(['plan']))).toBe(false)
  })
})
