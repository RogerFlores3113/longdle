import { useGame } from '../hooks/useGame'

export function EndGameBanner() {
  const gameStatus = useGame((s) => s.gameStatus)
  const getAnswer = useGame((s) => s.getAnswer)
  if (gameStatus === 'playing') return null
  if (gameStatus === 'won') {
    return <div className="endgame">You got it!</div>
  }
  // lost
  return (
    <div className="endgame">
      The word was {getAnswer().toUpperCase()}
    </div>
  )
}
