import { Modal } from './Modal'
import { WinAnimation } from './WinAnimation'

interface PracticeEndGameModalProps {
  onClose: () => void
  answer: string
  won: boolean
  guessCount: number
  onPlayAgain: () => void
}

export function PracticeEndGameModal({
  onClose,
  answer,
  won,
  guessCount,
  onPlayAgain,
}: PracticeEndGameModalProps) {
  return (
    <Modal onClose={onClose} ariaLabel={won ? 'You won!' : 'Game over'}>
      <button className="modal-close" onClick={onClose} aria-label="Close">
        ×
      </button>
      <p className="endgame-modal__result">
        {won ? 'Brilliant!' : `The word was ${answer.toUpperCase()}`}
      </p>
      {won && (
        <WinAnimation
          dayIndex={0}
          won={true}
          guessCount={guessCount}
        />
      )}
      <div className="endgame-modal__actions">
        <button className="share-btn" onClick={onPlayAgain}>
          Play Again
        </button>
      </div>
    </Modal>
  )
}
