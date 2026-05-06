import type { TileStatus } from '../types/game'

interface TileProps {
  letter: string
  status: TileStatus
  flip?: boolean
  flipDelayMs?: number
}

const STATUS_CLASS: Record<TileStatus, string> = {
  empty: 'tile--empty',
  active: 'tile--active',
  correct: 'tile--correct',
  present: 'tile--present',
  absent: 'tile--absent',
}

export function Tile({ letter, status, flip, flipDelayMs }: TileProps) {
  const cls = `tile ${STATUS_CLASS[status]}${flip ? ' tile--flip' : ''}`
  const style = flip ? { animationDelay: `${flipDelayMs ?? 0}ms` } : undefined
  return (
    <div className={cls} data-status={status} style={style}>
      {status === 'empty' ? '' : letter}
    </div>
  )
}
