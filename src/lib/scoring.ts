export type TileStatus = 'empty' | 'active' | 'correct' | 'present' | 'absent'

export function scoreTiles(guess: string, answer: string): TileStatus[] {
  if (guess.length !== 6 || answer.length !== 6) {
    throw new Error('scoreTiles requires 6-letter strings')
  }
  const result: TileStatus[] = new Array(6).fill('absent')
  const answerLetters = answer.split('')
  for (let i = 0; i < 6; i++) {
    if (guess[i] === answerLetters[i]) {
      result[i] = 'correct'
      answerLetters[i] = '#'
    }
  }
  for (let i = 0; i < 6; i++) {
    if (result[i] === 'correct') continue
    const idx = answerLetters.indexOf(guess[i])
    if (idx !== -1) {
      result[i] = 'present'
      answerLetters[idx] = '#'
    }
  }
  return result
}
