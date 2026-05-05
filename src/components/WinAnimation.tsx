/**
 * WinAnimation — v3 placeholder.
 * Receives game result props; currently renders nothing.
 * v3 will replace this with red panda pixel art animations
 * triggered when the player wins the daily puzzle.
 *
 * Integration point: rendered inside EndGameModal when gameStatus === 'won'.
 * Props are passed through so v3 can use them without changing EndGameModal.
 */

export interface WinAnimationProps {
  dayIndex: number
  won: boolean
  guessCount: number
}

export function WinAnimation(_props: WinAnimationProps) {
  return null
}
