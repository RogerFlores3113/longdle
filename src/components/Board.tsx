import { useEffect, useRef, useState } from 'react'
import { useGameContext } from '../contexts/GameContext'
import { Row } from './Row'

const MAX_GUESSES = 6

interface BoardProps {
  wordLength?: number
}

export function Board({ wordLength = 6 }: BoardProps) {
  const { guesses, currentGuess, gameStatus, rowShakeKey, isAnimating } = useGameContext()

  // Track which shake-key the active row is on; flip a transient flag for ~350ms
  const [shaking, setShaking] = useState(false)
  const lastShakeKey = useRef(rowShakeKey)
  useEffect(() => {
    if (rowShakeKey !== lastShakeKey.current) {
      lastShakeKey.current = rowShakeKey
      setShaking(true)
      const t = setTimeout(() => setShaking(false), 350)
      return () => clearTimeout(t)
    }
  }, [rowShakeKey])

  const rows = []
  const activeIndex = gameStatus === 'playing' ? guesses.length : -1
  const winningIndex = gameStatus === 'won' ? guesses.length - 1 : -1

  for (let i = 0; i < MAX_GUESSES; i++) {
    if (i < guesses.length) {
      const g = guesses[i]
      rows.push(
        <Row
          key={i}
          letters={g.guess}
          statuses={g.statuses}
          isActive={false}
          isShaking={false}
          isWinning={i === winningIndex}
          isFlipping={i === guesses.length - 1 && isAnimating}
          wordLength={wordLength}
        />
      )
    } else if (i === activeIndex) {
      rows.push(
        <Row
          key={i}
          letters={currentGuess}
          statuses={[]}
          isActive
          isShaking={shaking}
          isWinning={false}
          isFlipping={false}
          wordLength={wordLength}
        />
      )
    } else {
      rows.push(
        <Row
          key={i}
          letters=""
          statuses={[]}
          isActive={false}
          isShaking={false}
          isWinning={false}
          isFlipping={false}
          wordLength={wordLength}
        />
      )
    }
  }

  return <div className="board">{rows}</div>
}
