import type { ScoredGuess } from '../types/game'

const EMOJI_NORMAL = { correct: '🟩', present: '🟨', absent: '⬛' } as const
const EMOJI_COLORBLIND = { correct: '🟧', present: '🟦', absent: '⬛' } as const

export function generateShareText(
  guesses: ScoredGuess[],
  dayIndex: number,
  colorblindMode: boolean
): string {
  const emoji = colorblindMode ? EMOJI_COLORBLIND : EMOJI_NORMAL
  const lastGuess = guesses[guesses.length - 1]
  const won = lastGuess?.statuses.every((s) => s === 'correct') ?? false
  const score = won ? String(guesses.length) : 'X'
  const header = `Longdle #${dayIndex + 1} ${score}/6`
  const grid = guesses
    .map(({ statuses }) =>
      statuses
        .map((s) => {
          if (s === 'correct') return emoji.correct
          if (s === 'present') return emoji.present
          return emoji.absent
        })
        .join('')
    )
    .join('\n')
  return `${header}\n\n${grid}`
}

/**
 * NYT Wordle-style share text for /stella.
 *
 * Format:
 *   Wordle 1,796 3/6
 *
 *   ⬛⬛🟨⬛⬛
 *   🟨⬛⬛🟩⬛
 *   🟩🟩🟩🟩🟩
 *
 * Puzzle number is comma-formatted (en-US). No leading `#` per NYT convention.
 * Score is `X/6` on loss, `N/6` on win where N is guess count.
 */
export function generateWordleShareText(
  guesses: ScoredGuess[],
  puzzleNumber: number,
  colorblindMode: boolean
): string {
  const emoji = colorblindMode ? EMOJI_COLORBLIND : EMOJI_NORMAL
  const lastGuess = guesses[guesses.length - 1]
  const won = lastGuess?.statuses.every((s) => s === 'correct') ?? false
  const score = won ? String(guesses.length) : 'X'
  const num = puzzleNumber.toLocaleString('en-US')
  const header = `Wordle ${num} ${score}/6`
  const grid = guesses
    .map(({ statuses }) =>
      statuses
        .map((s) => {
          if (s === 'correct') return emoji.correct
          if (s === 'present') return emoji.present
          return emoji.absent
        })
        .join('')
    )
    .join('\n')
  return `${header}\n\n${grid}`
}
