import type { TileStatus } from './scoring'

interface PriorGuess { guess: string; statuses: TileStatus[] }

export function validateHardModeGuess(
  newGuess: string,
  priorGuesses: PriorGuess[]
): string | null {
  // Aggregate constraints from all prior guesses.
  // Greens: position -> letter (must match exactly at this position)
  // Yellows: set of letters that must appear somewhere
  const greens = new Map<number, string>()
  const yellows = new Set<string>()

  for (const pg of priorGuesses) {
    for (let i = 0; i < pg.statuses.length; i++) {
      if (pg.statuses[i] === 'correct') {
        greens.set(i, pg.guess[i])
      } else if (pg.statuses[i] === 'present') {
        yellows.add(pg.guess[i])
      }
    }
  }

  // Check greens
  for (const [pos, letter] of greens) {
    if (newGuess[pos] !== letter) {
      return `Letter at position ${pos + 1} must be ${letter}`
    }
  }

  // Check yellows
  for (const letter of yellows) {
    if (!newGuess.includes(letter)) {
      return `Guess must contain ${letter}`
    }
  }

  return null
}
