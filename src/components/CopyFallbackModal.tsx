import { useEffect, useRef } from 'react'
import { Modal } from './Modal'

interface CopyFallbackModalProps {
  copyText: string
  onClose: () => void
}

export function CopyFallbackModal({ copyText, onClose }: CopyFallbackModalProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    // Auto-select text on mount so user can Ctrl+C / Cmd+C immediately
    textareaRef.current?.select()
  }, [])

  return (
    <Modal onClose={onClose}>
      <button className="modal-close" onClick={onClose} aria-label="Close">×</button>
      <h2 style={{ textAlign: 'center', fontSize: 24, fontWeight: 600, margin: '0 0 12px' }}>
        Copy to share
      </h2>
      <p style={{ fontSize: 16, margin: '0 0 12px' }}>
        Copy this text and paste it in your message:
      </p>
      <textarea
        ref={textareaRef}
        value={copyText}
        readOnly
        rows={6}
        style={{
          width: '100%',
          minHeight: 120,
          fontFamily: 'monospace',
          fontSize: 12,
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 4,
          padding: 8,
          resize: 'none',
          boxSizing: 'border-box',
        }}
      />
    </Modal>
  )
}
