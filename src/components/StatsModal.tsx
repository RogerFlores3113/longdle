import { useState } from 'react'
import { Modal } from './Modal'
import { useGame } from '../hooks/useGame'
import { readStats } from '../lib/storage'

export function StatsModal({ onClose, onShare }: { onClose: () => void; onShare: () => void }) {
  const guesses = useGame((s) => s.guesses)
  const gameStatus = useGame((s) => s.gameStatus)
  // WR-03 / CR-01: read localStorage once on mount via useState initializer.
  // Avoids re-reading on every render (Strict Mode double-invoke safe) and
  // captures the already-written stats snapshot that includes the just-completed game.
  const [stats] = useState(() => readStats())
  const maxCount = Math.max(...stats.guessDistribution, 1)
  const winPct = stats.gamesPlayed === 0
    ? 0
    : Math.round((stats.gamesWon / stats.gamesPlayed) * 100)

  // CR-01: derive highlight index from current session's guess count.
  // guessDistribution index k represents wins in k+1 guesses, so k === guesses.length - 1.
  const highlightIndex = gameStatus === 'won' ? guesses.length - 1 : -1

  return (
    <Modal onClose={onClose}>
      <button className="modal-close" onClick={onClose} aria-label="Close">×</button>
      <h2 style={{ textAlign: 'center', fontSize: 24, fontWeight: 600, margin: '0 0 16px' }}>
        Statistics
      </h2>
      <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: 32 }}>
        {[
          { value: stats.gamesPlayed, label: 'Played' },
          { value: winPct, label: 'Win %' },
          { value: stats.currentStreak, label: 'Current Streak' },
          { value: stats.maxStreak, label: 'Max Streak' },
        ].map(({ value, label }) => (
          <div key={label} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 600 }}>{value}</div>
            <div style={{ fontSize: 12, lineHeight: 1.3 }}>{label}</div>
          </div>
        ))}
      </div>
      <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Guess Distribution</div>
      {stats.guessDistribution.map((count, i) => {
        const pct = Math.max(8, Math.round((count / maxCount) * 100))
        const isHighlight = i === highlightIndex
        return (
          <div key={i} className="stats-row">
            <span className="stats-label">{i + 1}</span>
            <div
              className={`stats-bar${isHighlight ? ' stats-bar--highlight' : ''}`}
              style={{ width: `${pct}%` }}
            >
              {count}
            </div>
          </div>
        )
      })}
      <button className="share-btn" onClick={onShare}>Share</button>
    </Modal>
  )
}
