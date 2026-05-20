import { create } from 'zustand'
import { scoreTiles } from '../lib/scoring'
import { FIVE_VALID_WORDS } from '../data/fiveWords'
import { FIVE_DEFAULT } from '../data/fiveConfig'
import { upgradeKeyStatus, showToast, triggerShake } from '../lib/gameCore'
import type { ScoredGuess, KeyStatus, GameStatus } from '../types/game'


const TOAST_MS = 1500
const SHAKE_MS = 350
const FLIP_DURATION_MS = 350
const FLIP_STAGGER_MS = 150
// For 5 tiles: (5-1)*150 + 350 + 50 = 1000ms
const FLIP_TOTAL_MS = (5 - 1) * FLIP_STAGGER_MS + FLIP_DURATION_MS + 50
const MAX_GUESSES = 6
const WORD_LENGTH = 5

export interface FiveGameState {
  answer: string
  guesses: ScoredGuess[]
  currentGuess: string
  gameStatus: GameStatus
  isAnimating: boolean
  toastMessage: string | null
  rowShakeKey: number
  keyStatuses: Record<string, KeyStatus>
  onKey: (key: string) => void
  resetWithAnswer: (answer: string) => void
}

// Private timer refs — separate from other stores (Pitfall 4)
let fiveToastTimerRef: { current: ReturnType<typeof setTimeout> | null } = { current: null }
let fiveShakeTimerRef: { current: ReturnType<typeof setTimeout> | null } = { current: null }
let fiveFlipTimer: ReturnType<typeof setTimeout> | null = null

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    if (fiveToastTimerRef.current) clearTimeout(fiveToastTimerRef.current)
    if (fiveShakeTimerRef.current) clearTimeout(fiveShakeTimerRef.current)
    if (fiveFlipTimer) clearTimeout(fiveFlipTimer)
  })
}

export const useFiveGame = create<FiveGameState>()((set, get) => ({
  answer: FIVE_DEFAULT.answer,
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
      if (cg.length < WORD_LENGTH) {
        showToast('Not enough letters', set, fiveToastTimerRef, TOAST_MS)
        triggerShake(set, get, fiveShakeTimerRef, SHAKE_MS)
        return
      }
      if (!FIVE_VALID_WORDS.has(cg)) {
        showToast('Not in word list', set, fiveToastTimerRef, TOAST_MS)
        triggerShake(set, get, fiveShakeTimerRef, SHAKE_MS)
        return
      }
      // No hard mode for five game

      const answer = s.answer
      const statuses = scoreTiles(cg, answer)
      const scoredGuess: ScoredGuess = { guess: cg, statuses }
      const nextGuesses = [...s.guesses, scoredGuess]

      // Upgrade keyStatuses — correct > present > absent, never downgrade
      const nextKeyStatuses = { ...s.keyStatuses }
      for (let i = 0; i < WORD_LENGTH; i++) {
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

      if (fiveFlipTimer) clearTimeout(fiveFlipTimer)
      fiveFlipTimer = setTimeout(() => {
        useFiveGame.setState({ isAnimating: false })
        fiveFlipTimer = null
      }, FLIP_TOTAL_MS)

      return
    }

    // Letter input — normalize to lowercase
    const lower = key.toLowerCase()
    if (lower.length === 1 && /^[a-z]$/.test(lower)) {
      if (s.currentGuess.length < WORD_LENGTH) {
        set({ currentGuess: s.currentGuess + lower })
      }
    }
  },

  resetWithAnswer: (answer: string) => {
    if (fiveToastTimerRef.current) clearTimeout(fiveToastTimerRef.current)
    if (fiveShakeTimerRef.current) clearTimeout(fiveShakeTimerRef.current)
    if (fiveFlipTimer) { clearTimeout(fiveFlipTimer); fiveFlipTimer = null }
    set({
      answer,
      guesses: [],
      currentGuess: '',
      gameStatus: 'playing' as GameStatus,
      isAnimating: false,
      toastMessage: null,
      rowShakeKey: 0,
      keyStatuses: {},
    })
  },
}))

// Suppress unused-import lint warning for FLIP_DURATION_MS (used only as a component of FLIP_TOTAL_MS)
void FLIP_DURATION_MS
