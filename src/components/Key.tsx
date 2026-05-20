import { memo } from 'react'
import type { KeyStatus } from '../types/game'

interface KeyProps {
  label: string
  value: string
  status?: KeyStatus
  wide?: boolean
  onKey: (key: string) => void
}

const STATUS_CLASS: Record<KeyStatus, string> = {
  correct: 'key--correct',
  present: 'key--present',
  absent: 'key--absent',
}

export const Key = memo(function Key({ label, value, status, wide, onKey }: KeyProps) {
  const cls = ['key']
  if (wide) cls.push('key--wide')
  if (status) cls.push(STATUS_CLASS[status])
  return (
    <button
      className={cls.join(' ')}
      onPointerDown={() => onKey(value)}
      type="button"
      aria-label={value}
    >
      {label}
    </button>
  )
})
