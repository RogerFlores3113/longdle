import { useState, useEffect } from 'react'
import { Board } from './components/Board'
import { Keyboard } from './components/Keyboard'
import { Toast } from './components/Toast'
import { HowToPlayModal } from './components/HowToPlayModal'
import { StatsModal } from './components/StatsModal'
import { SettingsModal } from './components/SettingsModal'
import { EndGameModal } from './components/EndGameModal'
import { CopyFallbackModal } from './components/CopyFallbackModal'
import { HelpIcon } from './components/icons/HelpIcon'
import { StatsIcon } from './components/icons/StatsIcon'
import { SettingsIcon } from './components/icons/SettingsIcon'
import { useGame, useSettings } from './hooks/useGame'
import { useKeyboardListener } from './hooks/useKeyboardListener'
import { generateShareText } from './lib/share'

type ActiveModal = 'howToPlay' | 'stats' | 'settings' | 'endGame' | 'copyFallback' | null

function App() {
  useKeyboardListener()

  const [activeModal, setActiveModal] = useState<ActiveModal>(null)
  const [copyFallbackText, setCopyFallbackText] = useState('')
  const [shareToast, setShareToast] = useState(false)

  const gameStatus = useGame((s) => s.gameStatus)
  const { colorblindMode, hasSeenHowToPlay, setHasSeenHowToPlay } = useSettings()

  // D-12: Auto-open HowToPlay on first visit (run once on mount)
  useEffect(() => {
    if (!hasSeenHowToPlay) {
      setActiveModal('howToPlay')
      setHasSeenHowToPlay(true)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // D-03: Auto-open EndGame modal when game ends
  useEffect(() => {
    if (gameStatus === 'won' || gameStatus === 'lost') {
      setActiveModal('endGame')
    }
    // TODO: Phase 3 — add !isAnimating check here before opening EndGame modal (tile flip timing)
  }, [gameStatus])

  // D-16: Toggle colorblind CSS class on <html> element
  useEffect(() => {
    document.documentElement.classList.toggle('colorblind', colorblindMode)
  }, [colorblindMode])

  function closeModal() {
    setActiveModal(null)
  }

  function handleShareSuccess() {
    setShareToast(true)
    setTimeout(() => setShareToast(false), 1500)
  }

  function handleCopyFallback(text: string) {
    setCopyFallbackText(text)
    setActiveModal('copyFallback')
  }

  // Share handler for Stats modal share button.
  // iOS Safari: generateShareText is a static import (no Promise chain before writeText).
  // handleShare has no async keyword and no await — gesture context is preserved.
  function handleShare() {
    const { guesses, dayIndex } = useGame.getState()
    const { colorblindMode: cb } = useSettings.getState()
    const text = generateShareText(guesses, dayIndex, cb)
    navigator.clipboard.writeText(text)
      .then(() => handleShareSuccess())
      .catch(() => handleCopyFallback(text))
  }

  return (
    <div className="app">
      <header className="app__header">
        <button
          className="header-icon-btn"
          onClick={() => setActiveModal('howToPlay')}
          aria-label="How to play"
        >
          <HelpIcon />
        </button>
        <span>Longdle</span>
        <div style={{ display: 'flex', gap: 4 }}>
          <button
            className="header-icon-btn"
            onClick={() => setActiveModal('stats')}
            aria-label="Statistics"
          >
            <StatsIcon />
          </button>
          <button
            className="header-icon-btn"
            onClick={() => setActiveModal('settings')}
            aria-label="Settings"
          >
            <SettingsIcon />
          </button>
        </div>
      </header>
      <main className="app__main">
        <Board />
        <Keyboard />
      </main>
      <Toast />
      {shareToast && (
        <div className="toast" style={{ top: 80 }}>Copied to clipboard!</div>
      )}
      {activeModal === 'howToPlay' && (
        <HowToPlayModal onClose={closeModal} />
      )}
      {activeModal === 'stats' && (
        <StatsModal onClose={closeModal} onShare={handleShare} />
      )}
      {activeModal === 'settings' && (
        <SettingsModal onClose={closeModal} />
      )}
      {activeModal === 'endGame' && (
        <EndGameModal
          onClose={closeModal}
          onShowStats={() => setActiveModal('stats')}
          onCopyFallback={handleCopyFallback}
          onShareSuccess={handleShareSuccess}
        />
      )}
      {activeModal === 'copyFallback' && (
        <CopyFallbackModal copyText={copyFallbackText} onClose={closeModal} />
      )}
    </div>
  )
}

export default App
