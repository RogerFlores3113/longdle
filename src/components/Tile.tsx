import type { TileStatus } from '../types/game'

interface TileProps {
  letter: string
  status: TileStatus
}

const STATUS_CLASS: Record<TileStatus, string> = {
  empty: 'tile--empty',
  active: 'tile--active',
  correct: 'tile--correct',
  present: 'tile--present',
  absent: 'tile--absent',
}

export function Tile({ letter, status }: TileProps) {
  return (
    <div className={`tile ${STATUS_CLASS[status]}`} data-status={status}>
      {status === 'empty' ? '' : letter}
    </div>
  )
}
