import { useGame } from '../hooks/useGame'

export function Toast() {
  const message = useGame((s) => s.toastMessage)
  if (!message) return null
  return (
    <div className="toast" role="status" aria-live="polite">
      {message}
    </div>
  )
}
