import type { TileStatus } from '../lib/scoring'

export type { TileStatus }
export type GameStatus = 'playing' | 'won' | 'lost'
export type KeyStatus = 'correct' | 'present' | 'absent'

export interface ScoredGuess {
  guess: string
  statuses: TileStatus[]
}
