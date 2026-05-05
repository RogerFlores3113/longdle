import { describe, it, expect } from 'vitest'
import { scoreTiles } from './scoring'

describe('scoreTiles', () => {
  it('marks all tiles correct when guess === answer', () => {
    expect(scoreTiles('planet', 'planet')).toEqual(
      ['correct', 'correct', 'correct', 'correct', 'correct', 'correct']
    )
  })

  it('marks all tiles absent when no letters match', () => {
    expect(scoreTiles('xyzqkw', 'planet')).toEqual(
      ['absent', 'absent', 'absent', 'absent', 'absent', 'absent']
    )
  })

  it('marks all tiles present when guess is an anagram of answer with no positional matches', () => {
    // 'tenalp' vs 'planet': no positional matches, all letters present
    expect(scoreTiles('tenalp', 'planet')).toEqual(
      ['present', 'present', 'present', 'present', 'present', 'present']
    )
  })

  it('handles dup in guess + single in answer (greens consume slots): little/bottle', () => {
    expect(scoreTiles('little', 'bottle')).toEqual(
      ['absent', 'absent', 'correct', 'correct', 'correct', 'correct']
    )
  })

  it('handles dup in both with all greens consumed first: mammae/mammal', () => {
    expect(scoreTiles('mammae', 'mammal')).toEqual(
      ['correct', 'correct', 'correct', 'correct', 'correct', 'absent']
    )
  })

  it('handles single-letter answer with multi-letter guess: eeeeee/pelmet', () => {
    expect(scoreTiles('eeeeee', 'pelmet')).toEqual(
      ['absent', 'correct', 'absent', 'absent', 'correct', 'absent']
    )
  })

  it('throws if guess is not 6 letters', () => {
    expect(() => scoreTiles('abc', 'planet')).toThrow()
  })

  it('throws if answer is not 6 letters', () => {
    expect(() => scoreTiles('planet', 'abc')).toThrow()
  })
})
