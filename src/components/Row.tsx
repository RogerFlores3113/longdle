import type { TileStatus } from '../types/game'
import { Tile } from './Tile'

interface RowProps {
  letters: string
  statuses: TileStatus[]
  isActive: boolean
  isShaking: boolean
  isWinning: boolean
  isFlipping: boolean
  wordLength?: number
}

export function Row({ letters, statuses, isActive, isShaking, isWinning, isFlipping, wordLength = 6 }: RowProps) {
  const cells = []
  for (let i = 0; i < wordLength; i++) {
    const letter = letters[i] ?? ''
    let status: TileStatus = statuses[i] ?? 'empty'
    if (isActive && letter && status === 'empty') status = 'active'
    cells.push(
      <Tile
        key={i}
        letter={letter}
        status={status}
        flip={isFlipping}
        flipDelayMs={i * 150}
      />
    )
  }
  const cls = ['row']
  if (isShaking) cls.push('row--shake')
  if (isWinning) cls.push('row--win')
  return <div className={cls.join(' ')}>{cells}</div>
}
