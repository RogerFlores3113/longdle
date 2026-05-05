import { Modal } from './Modal'
import { WinAnimation } from './WinAnimation'
import { useGame, useSettings } from '../hooks/useGame'
import { generateShareText } from '../lib/share'

interface EndGameModalProps {
  onClose: () => void
  onShowStats: () => void           // "See Stats" button → App.tsx sets activeModal('stats')
  onCopyFallback: (text: string) => void  // clipboard .catch → App.tsx opens copy fallback modal
  onShareSuccess: () => void        // App.tsx shows "Copied to clipboard!" toast
}

export function EndGameModal({ onClose, onShowStats, onCopyFallback, onShareSuccess }: EndGameModalProps) {
  const gameStatus = useGame((s) => s.gameStatus)
  const getAnswer = useGame((s) => s.getAnswer)

  // CRITICAL (iOS Safari — CLAUDE.md §"Clipboard (iOS Safari)"):
  // No async keyword, no await before writeText.
  // generateShareText is synchronous; writeText is called synchronously in the same gesture.
  // .then() and .catch() fire after the call — iOS gesture context already captured.
  function handleShare() {
    const { guesses, dayIndex } = useGame.getState()
    const { colorblindMode } = useSettings.getState()
    const text = generateShareText(guesses, dayIndex, colorblindMode)
    navigator.clipboard.writeText(text)
      .then(() => onShareSuccess())
      .catch(() => onCopyFallback(text))
  }

  const won = gameStatus === 'won'

  return (
    <Modal onClose={onClose}>
      <button className="modal-close" onClick={onClose} aria-label="Close">×</button>
      <p className="endgame-modal__result">
        {won ? 'Brilliant!' : `The word was ${getAnswer().toUpperCase()}`}
      </p>
      {/* D-21: WinAnimation slot — renders null in Phase 2; v3 replaces with red panda animation */}
      {won && (
        <WinAnimation
          dayIndex={useGame.getState().dayIndex}
          won={true}
          guessCount={useGame.getState().guesses.length}
        />
      )}
      <div className="endgame-modal__actions">
        <button className="share-btn" onClick={handleShare}>Share</button>
        <button className="see-stats-btn" onClick={onShowStats}>See Stats</button>
      </div>
    </Modal>
  )
}
