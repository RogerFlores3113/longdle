import { useEffect, useRef } from 'react'

interface ModalProps {
  onClose: () => void
  children: React.ReactNode
  ariaLabel?: string
  ariaLabelledBy?: string
}

export function Modal({ onClose, children, ariaLabel, ariaLabelledBy }: ModalProps) {
  // WR-02: use a ref to hold the latest onClose so the keydown effect never
  // needs to re-register. This avoids a brief gap between removeEventListener
  // and addEventListener when the parent re-renders with a new onClose identity.
  const onCloseRef = useRef(onClose)
  useEffect(() => { onCloseRef.current = onClose })

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCloseRef.current()
    }
    window.addEventListener('keydown', handler)
    // Cleanup: remove listener on unmount to prevent listener accumulation
    // (RESEARCH.md Pitfall 7 — Escape key listener leak)
    return () => window.removeEventListener('keydown', handler)
  }, []) // stable — never re-registers; always uses latest ref

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
        aria-labelledby={ariaLabelledBy}
        aria-label={!ariaLabelledBy ? (ariaLabel ?? 'Dialog') : undefined}
      >
        {children}
      </div>
    </div>
  )
}
