import { Modal } from './Modal'

export function HowToPlayModal({ onClose }: { onClose: () => void }) {
  return (
    <Modal onClose={onClose} ariaLabelledBy="howtoplay-title">
      <button className="modal-close" onClick={onClose} aria-label="Close">×</button>
      <h2 id="howtoplay-title" style={{ textAlign: 'center', fontSize: 24, fontWeight: 600, margin: '0 0 16px' }}>
        How To Play
      </h2>
      <p style={{ fontSize: 16, lineHeight: 1.5, margin: '0 0 16px' }}>
        Guess the <strong>LONGDLE</strong> in 7 tries.
        Each guess must be a valid 6-letter word.
      </p>
      <p style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', margin: '0 0 12px', letterSpacing: '0.05em' }}>
        Examples
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className="howtoplay-tile howtoplay-tile--correct">W</div>
          <span style={{ fontSize: 16 }}><strong>W</strong> is in the right spot</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className="howtoplay-tile howtoplay-tile--present">I</div>
          <span style={{ fontSize: 16 }}><strong>I</strong> is in the word, but in the wrong spot</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className="howtoplay-tile howtoplay-tile--absent">U</div>
          <span style={{ fontSize: 16 }}><strong>U</strong> is not in the word</span>
        </div>
      </div>
    </Modal>
  )
}
