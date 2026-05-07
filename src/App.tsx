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
import { useGame, useSettings, showGameToast } from './hooks/useGame'
import { useKeyboardListener } from './hooks/useKeyboardListener'
import { generateShareText } from './lib/share'
import { GameContext } from './contexts/GameContext'
import type { GameContextValue } from './contexts/GameContext'

type ActiveModal = 'howToPlay' | 'stats' | 'settings' | 'endGame' | 'copyFallback' | null

function App() {
  useKeyboardListener(useGame.getState().onKey)

  const [activeModal, setActiveModal] = useState<ActiveModal>(null)
  const [copyFallbackText, setCopyFallbackText] = useState('')

  const gameStatus = useGame((s) => s.gameStatus)
  const isAnimating = useGame((s) => s.isAnimating)
  const dayIndex = useGame((s) => s.dayIndex)
  const guesses = useGame((s) => s.guesses)
  const currentGuess = useGame((s) => s.currentGuess)
  const toastMessage = useGame((s) => s.toastMessage)
  const rowShakeKey = useGame((s) => s.rowShakeKey)
  const keyStatuses = useGame((s) => s.keyStatuses)
  const onKey = useGame((s) => s.onKey)
  const { colorblindMode, hasSeenHowToPlay, setHasSeenHowToPlay } = useSettings()

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

  // D-12: Auto-open HowToPlay on first visit (run once on mount)
  useEffect(() => {
    if (!hasSeenHowToPlay) {
      setActiveModal('howToPlay')
      setHasSeenHowToPlay(true)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // D-03 + Phase 3 D-08: Auto-open EndGame modal after the tile flip completes
  useEffect(() => {
    if ((gameStatus === 'won' || gameStatus === 'lost') && !isAnimating) {
      setActiveModal('endGame')
    }
  }, [gameStatus, isAnimating])

  // D-16: Toggle colorblind CSS class on <html> element
  useEffect(() => {
    document.documentElement.classList.toggle('colorblind', colorblindMode)
  }, [colorblindMode])

  function closeModal() {
    setActiveModal(null)
  }

  function handleShareSuccess() {
    // WR-04: route through the single game-store toast mechanism instead of
    // a parallel shareToast state with its own unstyled div.
    showGameToast('Copied to clipboard!')
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
        <div className="app__header-left">
          <button
            className="header-icon-btn"
            onClick={() => setActiveModal('howToPlay')}
            aria-label="How to play"
          >
            <HelpIcon />
          </button>
          <button
            className="header-icon-btn"
            onClick={() => { window.location.href = '/random' }}
            aria-label="Practice mode"
            title="Practice mode"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="2" y="2" width="20" height="20" rx="3" ry="3"/>
              <circle cx="8"  cy="8"  r="1.2" fill="currentColor" stroke="none"/>
              <circle cx="16" cy="8"  r="1.2" fill="currentColor" stroke="none"/>
              <circle cx="8"  cy="16" r="1.2" fill="currentColor" stroke="none"/>
              <circle cx="16" cy="16" r="1.2" fill="currentColor" stroke="none"/>
              <circle cx="8"  cy="12" r="1.2" fill="currentColor" stroke="none"/>
              <circle cx="16" cy="12" r="1.2" fill="currentColor" stroke="none"/>
            </svg>
          </button>
        </div>
        <span className="app__header-title">Longdle <span className="app__header-puzzle-num">{(() => {
          const fmt = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Los_Angeles', month: 'numeric', day: 'numeric', year: '2-digit' })
          return `#${dayIndex + 1} · ${fmt.format(new Date())}`
        })()}</span></span>
        <div className="app__header-right">
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
      <GameContext.Provider value={gameContextValue}>
        <main className="app__main">
          <Board />
          <Keyboard />
        </main>
        <Toast />
      </GameContext.Provider>
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
