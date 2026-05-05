import { describe, it, expect } from 'vitest'
import { validateHardModeGuess } from './hardMode'
import type { TileStatus } from './scoring'

describe('validateHardModeGuess', () => {
  it('returns null when there are no prior guesses', () => {
    expect(validateHardModeGuess('planet', [])).toBeNull()
  })

  it('returns null when guess satisfies all green constraints', () => {
    const prior = [{
      guess: 'planet',
      statuses: ['correct', 'absent', 'absent', 'absent', 'absent', 'absent'] as TileStatus[],
    }]
    // green at position 0 = 'p' must remain
    expect(validateHardModeGuess('prince', prior)).toBeNull()
  })

  it('rejects guess that drops a green letter at its position', () => {
    const prior = [{
      guess: 'planet',
      statuses: ['correct', 'absent', 'absent', 'absent', 'absent', 'absent'] as TileStatus[],
    }]
    expect(validateHardModeGuess('bridge', prior)).toMatch(/position 1 must be p/i)
  })

  it('rejects guess that omits a previously-yellow letter', () => {
    const prior = [{
      guess: 'planet',
      // 'l' at index 1 was 'present' (must appear somewhere in new guess)
      statuses: ['absent', 'present', 'absent', 'absent', 'absent', 'absent'] as TileStatus[],
    }]
    expect(validateHardModeGuess('bridge', prior)).toMatch(/must contain l/i)
  })

  it('accepts guess that uses yellow letter in different position', () => {
    const prior = [{
      guess: 'planet',
      statuses: ['absent', 'present', 'absent', 'absent', 'absent', 'absent'] as TileStatus[],
    }]
    expect(validateHardModeGuess('lovely', prior)).toBeNull()
  })

  it('aggregates constraints across multiple prior guesses', () => {
    const prior = [
      { guess: 'planet', statuses: ['correct', 'absent', 'absent', 'absent', 'absent', 'absent'] as TileStatus[] },
      { guess: 'pirate', statuses: ['correct', 'absent', 'absent', 'present', 'absent', 'absent'] as TileStatus[] },
    ]
    // p@0 green from both; 'a' yellow from second guess
    expect(validateHardModeGuess('pridge', prior)).toMatch(/must contain a/i)
    expect(validateHardModeGuess('proxia', prior)).toBeNull()
  })
})
