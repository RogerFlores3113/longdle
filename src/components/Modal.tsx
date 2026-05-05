import { useEffect } from 'react'

interface ModalProps {
  onClose: () => void
  children: React.ReactNode
}

export function Modal({ onClose, children }: ModalProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    // Cleanup: remove listener on unmount to prevent listener accumulation
    // (RESEARCH.md Pitfall 7 — Escape key listener leak)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div
      className="modal-backdrop"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="modal-panel"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {children}
      </div>
    </div>
  )
}
