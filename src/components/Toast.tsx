import { useState, useEffect } from 'react'
import { useGameContext } from '../contexts/GameContext'

export function Toast() {
  const { toastMessage: message } = useGameContext()
  const [hiding, setHiding] = useState(false)

  useEffect(() => {
    if (!message) return
    setHiding(false)
    const t = setTimeout(() => setHiding(true), 1200)
    return () => clearTimeout(t)
  }, [message])

  if (!message) return null
  return (
    <div className={`toast${hiding ? ' toast--hiding' : ''}`} role="status" aria-live="polite">
      {message}
    </div>
  )
}
