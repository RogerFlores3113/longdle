/**
 * GameContext.ts — store-agnostic context for Board, Keyboard, Key, and Toast.
 *
 * Both App (daily game) and PracticeGame (/random) provide this context with
 * values derived from their respective stores (useGame and usePracticeGame).
 * Components never import a store directly — they read from context.
 */
import { createContext, useContext } from 'react'
import type { ScoredGuess, KeyStatus, GameStatus } from '../types/game'

export interface GameContextValue {
  guesses: ScoredGuess[]
  currentGuess: string
  gameStatus: GameStatus
  isAnimating: boolean
  toastMessage: string | null
  rowShakeKey: number
  keyStatuses: Record<string, KeyStatus>
  onKey: (key: string) => void
}

export const GameContext = createContext<GameContextValue | null>(null)

export function useGameContext(): GameContextValue {
  const ctx = useContext(GameContext)
  if (!ctx) throw new Error('useGameContext must be used inside a GameContext.Provider')
  return ctx
}
