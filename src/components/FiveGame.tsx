import { useEffect } from 'react'
import { Board } from './Board'
import { Keyboard } from './Keyboard'
import { Toast } from './Toast'
import { useFiveGame } from '../hooks/useFiveGame'
import { useSettings } from '../hooks/useGame'
import { useKeyboardListener } from '../hooks/useKeyboardListener'
import { GameContext } from '../contexts/GameContext'
import type { GameContextValue } from '../contexts/GameContext'
import { FIVE_PUZZLE_NUMBER } from '../data/fiveConfig'

export function FiveGame() {
  useKeyboardListener(useFiveGame.getState().onKey)

  const guesses = useFiveGame((s) => s.guesses)
  const currentGuess = useFiveGame((s) => s.currentGuess)
  const gameStatus = useFiveGame((s) => s.gameStatus)
  const isAnimating = useFiveGame((s) => s.isAnimating)
  const toastMessage = useFiveGame((s) => s.toastMessage)
  const rowShakeKey = useFiveGame((s) => s.rowShakeKey)
  const keyStatuses = useFiveGame((s) => s.keyStatuses)
  const onKey = useFiveGame((s) => s.onKey)
  const answer = useFiveGame((s) => s.answer)
  const { colorblindMode } = useSettings()

  useEffect(() => {
    document.documentElement.classList.toggle('colorblind', colorblindMode)
  }, [colorblindMode])

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
        <span className="app__header-title">
          Wordle <span className="app__header-puzzle-num">#{FIVE_PUZZLE_NUMBER}</span>
        </span>
      </header>
      <GameContext.Provider value={gameContextValue}>
        <main className="app__main">
          <Board wordLength={5} />
          <Keyboard />
        </main>
        <Toast />
      </GameContext.Provider>
      {(gameStatus === 'won' || gameStatus === 'lost') && !isAnimating && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0,0,0,0.5)',
            zIndex: 100,
          }}
        >
          <div
            style={{
              background: 'var(--color-bg)',
              padding: '2rem',
              borderRadius: '12px',
              textAlign: 'center',
              maxWidth: '320px',
            }}
          >
            <p style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>
              {gameStatus === 'won' ? 'You got it!' : 'Better luck tomorrow!'}
            </p>
            <p style={{ color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
              The word was <strong>{answer.toUpperCase()}</strong>
            </p>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
              Guesses: {guesses.length} / 6
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
