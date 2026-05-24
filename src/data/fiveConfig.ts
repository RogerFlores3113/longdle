// Add new puzzles here daily — append to the bottom, newest last.
// The last entry is the default shown when Stella opens the page.
export interface FivePuzzle {
  puzzleNumber: number
  answer: string
}

export const FIVE_PUZZLES: readonly FivePuzzle[] = [
  { puzzleNumber: 1795, answer: 'dusty' },
  { puzzleNumber: 1796, answer: 'wreck' },
  { puzzleNumber: 1797, answer: 'agree' },
  { puzzleNumber: 1798, answer: 'vocal' },
  { puzzleNumber: 1799, answer: 'chuck' },
  { puzzleNumber: 1800, answer: 'niece' },
]

export const FIVE_DEFAULT = FIVE_PUZZLES[FIVE_PUZZLES.length - 1]
