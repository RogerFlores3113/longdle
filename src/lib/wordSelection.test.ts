import { describe, it, expect } from 'vitest'
import { getDayIndex, getDailyAnswer, isValidGuess, EPOCH } from './wordSelection'
import { ANSWERS } from '../data/words'

describe('EPOCH', () => {
  it('equals 2026-05-04T00:00:00Z in ms', () => {
    expect(EPOCH).toBe(new Date('2026-05-04T00:00:00Z').getTime())
  })
})

describe('getDayIndex', () => {
  it('returns -1 at UTC epoch midnight (2026-05-03 17:00 PDT — still day before in LA)', () => {
    expect(getDayIndex(new Date('2026-05-04T00:00:00Z'))).toBe(-1)
  })
  it('returns 0 at LA midnight PDT start (2026-05-04T07:00:00Z = 2026-05-04 00:00 PDT)', () => {
    expect(getDayIndex(new Date('2026-05-04T07:00:00Z'))).toBe(0)
  })
  it('returns 0 one millisecond after LA midnight', () => {
    expect(getDayIndex(new Date('2026-05-04T07:00:00.001Z'))).toBe(0)
  })
  it('returns 0 at LA end-of-day (2026-05-05T06:59:59.999Z = 2026-05-04 23:59 PDT)', () => {
    expect(getDayIndex(new Date('2026-05-05T06:59:59.999Z'))).toBe(0)
  })
  it('returns 1 at next LA midnight PDT (2026-05-05T07:00:00Z = 2026-05-05 00:00 PDT)', () => {
    expect(getDayIndex(new Date('2026-05-05T07:00:00Z'))).toBe(1)
  })
  it('returns -1 just before LA midnight on epoch day (2026-05-04T06:59:59Z = 2026-05-03 23:59 PDT)', () => {
    expect(getDayIndex(new Date('2026-05-04T06:59:59Z'))).toBe(-1)
  })
  it('handles PST after fall-back: 2026-11-01T08:00:00Z = 2026-11-01 00:00 PST (UTC-8)', () => {
    // America/Los_Angeles falls back from PDT (UTC-7) to PST (UTC-8) on first Sunday of November
    // 2026-11-01 is that Sunday; 08:00Z = 00:00 PST = start of LA day 181
    const dayIndex = getDayIndex(new Date('2026-11-01T08:00:00Z'))
    // 2026-05-04 to 2026-11-01 = 181 days
    expect(dayIndex).toBe(181)
  })
  it('handles PDT just before LA midnight: 2026-11-01T06:59:59Z = 2026-10-31 23:59 PDT', () => {
    // America/Los_Angeles at 06:59:59Z is 11:59:59 PM PDT (UTC-7) on Oct 31, which is still LA day 180
    expect(getDayIndex(new Date('2026-11-01T06:59:59Z'))).toBe(180)
  })
  it('returns positive integer far from epoch (no overflow)', () => {
    // 2030-05-04 00:00 PDT = 2030-05-04T07:00:00Z
    expect(getDayIndex(new Date('2030-05-04T07:00:00Z'))).toBe(1461)
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
