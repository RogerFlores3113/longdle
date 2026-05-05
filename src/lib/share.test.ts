import { describe, it, expect } from 'vitest'
import { generateShareText } from './share'
import type { ScoredGuess } from '../types/game'

// Helper: build a ScoredGuess from a pattern string like "CGAPA"
// C=correct, P=present, A=absent
function guess(word: string, pattern: string): ScoredGuess {
  return {
    guess: word,
    statuses: pattern.split('').map((c) =>
      c === 'C' ? 'correct' : c === 'P' ? 'present' : 'absent'
    ),
  }
}

describe('generateShareText', () => {
  it('formats a won game header as Longdle #N M/7', () => {
    const guesses = [guess('ABCDEF', 'AAAAAC'), guess('GHIJKL', 'CCCCCC')]
    const result = generateShareText(guesses, 0, false)
    expect(result.split('\n')[0]).toBe('Longdle #1 2/7')
  })

  it('formats a lost game header with X', () => {
    const guesses = [
      guess('ABCDEF', 'AAAAAA'),
      guess('GHIJKL', 'AAAAAA'),
      guess('MNOPQR', 'AAAAAA'),
      guess('STUVWX', 'AAAAAA'),
      guess('YZABCD', 'AAAAAA'),
      guess('EFGHIJ', 'AAAAAA'),
      guess('KLMNOP', 'AAAAAA'),
    ]
    const result = generateShareText(guesses, 9, false)
    expect(result.split('\n')[0]).toBe('Longdle #10 X/7')
  })

  it('uses normal emoji in normal mode', () => {
    const guesses = [guess('ABCDEF', 'CPAAAA')]
    const result = generateShareText(guesses, 0, false)
    const gridLine = result.split('\n\n')[1]
    expect(gridLine).toBe('🟩🟨⬛⬛⬛⬛')
  })

  it('uses colorblind emoji in colorblind mode', () => {
    const guesses = [guess('ABCDEF', 'CPAAAA')]
    const result = generateShareText(guesses, 0, true)
    const gridLine = result.split('\n\n')[1]
    expect(gridLine).toBe('🟧🟦⬛⬛⬛⬛')
  })

  it('puzzle number equals dayIndex + 1', () => {
    const guesses = [guess('ABCDEF', 'CCCCCC')]
    expect(generateShareText(guesses, 0, false)).toContain('Longdle #1 ')
    expect(generateShareText(guesses, 41, false)).toContain('Longdle #42 ')
    expect(generateShareText(guesses, 364, false)).toContain('Longdle #365 ')
  })
})
