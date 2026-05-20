export type TileStatus = 'empty' | 'active' | 'correct' | 'present' | 'absent'

export function scoreTiles(guess: string, answer: string): TileStatus[] {
  if (guess.length !== answer.length) {
    throw new Error('scoreTiles requires guess and answer of equal length')
  }
  const n = guess.length
  const result: TileStatus[] = new Array(n).fill('absent')
  const answerLetters = answer.split('')
  for (let i = 0; i < n; i++) {
    if (guess[i] === answerLetters[i]) {
      result[i] = 'correct'
      answerLetters[i] = '#'
    }
  }
  for (let i = 0; i < n; i++) {
    if (result[i] === 'correct') continue
    const idx = answerLetters.indexOf(guess[i])
    if (idx !== -1) {
      result[i] = 'present'
      answerLetters[idx] = '#'
    }
  }
  return result
}
