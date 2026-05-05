import type { KeyStatus } from '../types/game'
import { useGame } from '../hooks/useGame'

interface KeyProps {
  label: string
  value: string
  status?: KeyStatus
  wide?: boolean
}

const STATUS_CLASS: Record<KeyStatus, string> = {
  correct: 'key--correct',
  present: 'key--present',
  absent: 'key--absent',
}

export function Key({ label, value, status, wide }: KeyProps) {
  const onKey = useGame((s) => s.onKey)
  const cls = ['key']
  if (wide) cls.push('key--wide')
  if (status) cls.push(STATUS_CLASS[status])
  return (
    <button
      className={cls.join(' ')}
      onClick={() => onKey(value)}
      type="button"
      aria-label={value}
    >
      {label}
    </button>
  )
}
