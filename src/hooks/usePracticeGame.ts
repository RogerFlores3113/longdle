import { create } from 'zustand'
import { scoreTiles } from '../lib/scoring'
import { validateHardModeGuess } from '../lib/hardMode'
import { VALID_WORDS, ANSWERS } from '../data/words'
import { upgradeKeyStatus, showToast, triggerShake } from '../lib/gameCore'
import { useSettings } from './useGame'
import type { ScoredGuess, KeyStatus, GameStatus } from '../types/game'

const TOAST_MS = 1500
const SHAKE_MS = 350
const FLIP_DURATION_MS = 350
const FLIP_STAGGER_MS = 150
const FLIP_TOTAL_MS = (6 - 1) * FLIP_STAGGER_MS + FLIP_DURATION_MS + 50  // 1150ms
const MAX_GUESSES = 7

function pickRandom(): string {
  return ANSWERS[Math.floor(Math.random() * ANSWERS.length)]
}

export interface PracticeGameState {
  answer: string
  guesses: ScoredGuess[]
  currentGuess: string
  gameStatus: GameStatus
  isAnimating: boolean
  toastMessage: string | null
  rowShakeKey: number
  keyStatuses: Record<string, KeyStatus>
  onKey: (key: string) => void
  resetPractice: () => void
}

// Private timer refs — SEPARATE from useGame.ts timers (prevents HMR cross-store interference)
// Pitfall 4: each store must own its own timer refs; never share with the daily store
let practiceToastTimerRef: { current: ReturnType<typeof setTimeout> | null } = { current: null }
let practiceShakeTimerRef: { current: ReturnType<typeof setTimeout> | null } = { current: null }
let practiceFlipTimer: ReturnType<typeof setTimeout> | null = null

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    if (practiceToastTimerRef.current) clearTimeout(practiceToastTimerRef.current)
    if (practiceShakeTimerRef.current) clearTimeout(practiceShakeTimerRef.current)
    if (practiceFlipTimer) clearTimeout(practiceFlipTimer)
  })
}

export const usePracticeGame = create<PracticeGameState>()((set, get) => ({
  answer: pickRandom(),
  guesses: [],
  currentGuess: '',
  gameStatus: 'playing' as GameStatus,
  isAnimating: false,
  toastMessage: null,
  rowShakeKey: 0,
  keyStatuses: {},

  onKey: (rawKey: string) => {
    const s = get()
    // Guard: block input during animations or after game end
    if (s.isAnimating || s.gameStatus !== 'playing') return

    // Normalize Delete to Backspace per UI-SPEC
    const key = rawKey === 'Delete' ? 'Backspace' : rawKey

    if (key === 'Backspace') {
      if (s.currentGuess.length === 0) return
      set({ currentGuess: s.currentGuess.slice(0, -1) })
      return
    }

    if (key === 'Enter') {
      const cg = s.currentGuess
      if (cg.length < 6) {
        showToast('Not enough letters', set, practiceToastTimerRef, TOAST_MS)
        triggerShake(set, get, practiceShakeTimerRef, SHAKE_MS)
        return
      }
      if (!VALID_WORDS.has(cg)) {
        showToast('Not in word list', set, practiceToastTimerRef, TOAST_MS)
        triggerShake(set, get, practiceShakeTimerRef, SHAKE_MS)
        return
      }
      if (useSettings.getState().hardMode) {
        const err = validateHardModeGuess(cg, s.guesses)
        if (err) {
          showToast(err, set, practiceToastTimerRef, TOAST_MS)
          triggerShake(set, get, practiceShakeTimerRef, SHAKE_MS)
          return
        }
      }

      // Use s.answer — the random word stored in state (NOT getDailyAnswer)
      const answer = s.answer
      const statuses = scoreTiles(cg, answer)
      const scoredGuess: ScoredGuess = { guess: cg, statuses }
      const nextGuesses = [...s.guesses, scoredGuess]

      // Upgrade keyStatuses — correct > present > absent, never downgrade
      const nextKeyStatuses = { ...s.keyStatuses }
      for (let i = 0; i < 6; i++) {
        const letter = cg[i]
        const upgraded = upgradeKeyStatus(nextKeyStatuses[letter], statuses[i])
        if (upgraded !== undefined) nextKeyStatuses[letter] = upgraded
      }

      const won = cg === answer
      const lost = !won && nextGuesses.length >= MAX_GUESSES
      const gameStatus: GameStatus = won ? 'won' : lost ? 'lost' : 'playing'

      set({
        guesses: nextGuesses,
        currentGuess: '',
        keyStatuses: nextKeyStatuses,
        gameStatus,
        isAnimating: true,
      })

      if (practiceFlipTimer) clearTimeout(practiceFlipTimer)
      practiceFlipTimer = setTimeout(() => {
        // practice path: recordGameEnd intentionally omitted (PRACTICE-03 / D-08)
        usePracticeGame.setState({ isAnimating: false })
        practiceFlipTimer = null
      }, FLIP_TOTAL_MS)

      return
    }

    // Letter input — normalize to lowercase
    const lower = key.toLowerCase()
    if (lower.length === 1 && /^[a-z]$/.test(lower)) {
      if (s.currentGuess.length < 6) {
        set({ currentGuess: s.currentGuess + lower })
      }
    }
  },

  resetPractice: () => set({
    answer: pickRandom(),
    guesses: [],
    currentGuess: '',
    gameStatus: 'playing' as GameStatus,
    isAnimating: false,
    toastMessage: null,
    rowShakeKey: 0,
    keyStatuses: {},
  }),
}))

// Suppress unused-import lint warning for FLIP_DURATION_MS (used only as a component of FLIP_TOTAL_MS)
void FLIP_DURATION_MS
