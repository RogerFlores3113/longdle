import { useState, useEffect } from 'react'
import { Board } from './Board'
import { Keyboard } from './Keyboard'
import { Toast } from './Toast'
import { SettingsModal } from './SettingsModal'
import { PracticeBanner } from './PracticeBanner'
import { PracticeEndGameModal } from './PracticeEndGameModal'
import { SettingsIcon } from './icons/SettingsIcon'
import { usePracticeGame } from '../hooks/usePracticeGame'
import { useSettings } from '../hooks/useGame'
import { useKeyboardListener } from '../hooks/useKeyboardListener'
import { GameContext } from '../contexts/GameContext'
import type { GameContextValue } from '../contexts/GameContext'

type ActiveModal = 'settings' | 'practiceEndGame' | null

export function PracticeGame() {
  // Physical keyboard input → practice store (not daily store — Pitfall 2)
  useKeyboardListener(usePracticeGame.getState().onKey)

  const [activeModal, setActiveModal] = useState<ActiveModal>(null)

  const answer = usePracticeGame((s) => s.answer)
  const guesses = usePracticeGame((s) => s.guesses)
  const currentGuess = usePracticeGame((s) => s.currentGuess)
  const gameStatus = usePracticeGame((s) => s.gameStatus)
  const isAnimating = usePracticeGame((s) => s.isAnimating)
  const toastMessage = usePracticeGame((s) => s.toastMessage)
  const rowShakeKey = usePracticeGame((s) => s.rowShakeKey)
  const keyStatuses = usePracticeGame((s) => s.keyStatuses)
  const onKey = usePracticeGame((s) => s.onKey)
  const resetPractice = usePracticeGame((s) => s.resetPractice)
  const { colorblindMode } = useSettings()

  // Auto-open practice EndGame modal after tile flip completes (mirrors App.tsx)
  useEffect(() => {
    if ((gameStatus === 'won' || gameStatus === 'lost') && !isAnimating) {
      setActiveModal('practiceEndGame')
    }
  }, [gameStatus, isAnimating])

  // Apply colorblind CSS class (D-07: useSettings shared between daily and practice)
  useEffect(() => {
    document.documentElement.classList.toggle('colorblind', colorblindMode)
  }, [colorblindMode])

  function closeModal() {
    setActiveModal(null)
  }

  const gameContextValue: GameContextValue = {
    guesses,
    currentGuess,
    gameStatus,
    isAnimating,
    toastMessage,
    rowShakeKey,
    keyStatuses,
    onKey,
  }

  return (
    <div className="app">
      <header className="app__header">
        <span>Longdle</span>
        <div className="app__header-right">
          <button
            className="header-icon-btn"
            onClick={() => setActiveModal('settings')}
            aria-label="Settings"
          >
            <SettingsIcon />
          </button>
        </div>
      </header>
      <PracticeBanner />
      <GameContext.Provider value={gameContextValue}>
        <main className="app__main">
          <Board />
          <Keyboard />
        </main>
        <Toast />
      </GameContext.Provider>
      {activeModal === 'settings' && (
        <SettingsModal onClose={closeModal} />
      )}
      {activeModal === 'practiceEndGame' && (
        <PracticeEndGameModal
          onClose={closeModal}
          answer={answer}
          won={gameStatus === 'won'}
          guessCount={guesses.length}
          onPlayAgain={() => {
            resetPractice()
            closeModal()
          }}
        />
      )}
    </div>
  )
}
