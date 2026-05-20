import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { scoreTiles } from '../lib/scoring'
import type { TileStatus } from '../lib/scoring'
import { getDayIndex, getDailyAnswer } from '../lib/wordSelection'
import { validateHardModeGuess } from '../lib/hardMode'
import { VALID_WORDS } from '../data/words'
import {
  GAME_STATE_KEY,
  SETTINGS_KEY,
  SCHEMA_VERSION,
  recordGameEnd,
} from '../lib/storage'
import type { ScoredGuess, KeyStatus, GameStatus } from '../types/game'

// Debounced storage backend — prevents blocking the main thread on mobile with a
// synchronous localStorage write on every letter press.
// Wrapped with createJSONStorage so Zustand gets the correct StorageValue<T> types.
let _persistDebounceTimer: ReturnType<typeof setTimeout> | null = null
const debouncedLocalStorage: Storage = {
  length: 0,
  clear: () => localStorage.clear(),
  key: (index: number) => localStorage.key(index),
  getItem: (name: string) => localStorage.getItem(name),
  setItem: (name: string, value: string) => {
    if (_persistDebounceTimer) clearTimeout(_persistDebounceTimer)
    _persistDebounceTimer = setTimeout(() => {
      localStorage.setItem(name, value)
      _persistDebounceTimer = null
    }, 300)
  },
  removeItem: (name: string) => localStorage.removeItem(name),
}
const debouncedStorage = createJSONStorage(() => debouncedLocalStorage)

const TOAST_MS = 1500
const SHAKE_MS = 350
const FLIP_DURATION_MS = 350
const FLIP_STAGGER_MS = 150
const FLIP_TOTAL_MS = (6 - 1) * FLIP_STAGGER_MS + FLIP_DURATION_MS + 50  // 1150ms
const MAX_GUESSES = 6

const KEY_RANK: Record<KeyStatus, number> = { correct: 3, present: 2, absent: 1 }

function upgradeKeyStatus(
  prev: KeyStatus | undefined,
  next: TileStatus
): KeyStatus | undefined {
  if (next === 'empty' || next === 'active') return prev
  const prevRank = prev ? KEY_RANK[prev] : 0
  const nextRank = KEY_RANK[next as KeyStatus]
  return nextRank > prevRank ? (next as KeyStatus) : prev
}

export interface GameState {
  version: number
  dayIndex: number
  guesses: ScoredGuess[]
  currentGuess: string
  gameStatus: GameStatus
  isAnimating: boolean
  toastMessage: string | null
  rowShakeKey: number
  keyStatuses: Record<string, KeyStatus>
  onKey: (key: string) => void
  resetForNewDay: () => void
  getAnswer: () => string
}

export interface SettingsState {
  version: number
  hardMode: boolean
  colorblindMode: boolean
  hasSeenHowToPlay: boolean           // D-12: first-visit detection
  setHardMode: (v: boolean) => void
  setColorblindMode: (v: boolean) => void
  setHasSeenHowToPlay: (v: boolean) => void  // D-12
}

// Module-scoped timers (one instance per store)
// dev-only: timer refs survive HMR; acceptable for a two-person game.
// In production this is safe — there is exactly one Zustand store instance.
// HMR disposal clears pending timers so stale set() calls do not fire after reload.
let toastTimer: ReturnType<typeof setTimeout> | null = null
let shakeTimer: ReturnType<typeof setTimeout> | null = null
let flipTimer: ReturnType<typeof setTimeout> | null = null

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    if (toastTimer) clearTimeout(toastTimer)
    if (shakeTimer) clearTimeout(shakeTimer)
    if (flipTimer) clearTimeout(flipTimer)
  })
}

export const useGame = create<GameState>()(
  persist(
    (set, get) => ({
      version: SCHEMA_VERSION,
      dayIndex: getDayIndex(),
      guesses: [],
      currentGuess: '',
      gameStatus: 'playing' as GameStatus,
      isAnimating: false,
      toastMessage: null,
      rowShakeKey: 0,
      keyStatuses: {},

      getAnswer: () => getDailyAnswer(get().dayIndex),

      onKey: (rawKey: string) => {
        const s = get()
        // C-5 / D-10: guard blocks input during animations or after game end
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
            // D-04 toast copy (UI-SPEC verbatim)
            showToast('Not enough letters', set)
            triggerShake(set, get)
            return
          }
          if (!VALID_WORDS.has(cg)) {
            showToast('Not in word list', set)
            triggerShake(set, get)
            return
          }
          // Hard mode check — reads useSettings via its own getState (no cross-store subscription)
          if (useSettings.getState().hardMode) {
            const err = validateHardModeGuess(cg, s.guesses)
            if (err) {
              showToast(err, set)
              triggerShake(set, get)
              return
            }
          }

          const answer = getDailyAnswer(s.dayIndex)
          const statuses = scoreTiles(cg, answer)
          const scoredGuess: ScoredGuess = { guess: cg, statuses }
          const nextGuesses = [...s.guesses, scoredGuess]

          // Upgrade keyStatuses — GAME-03: correct > present > absent, never downgrade
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
            // Phase 3: set true on EVERY submit (not just game-end) so the tile flip
            // animation blocks keyboard input for the full 1150ms flip window.
            // The flipTimer below clears it after FLIP_TOTAL_MS.
            isAnimating: true,
          })

          if (flipTimer) clearTimeout(flipTimer)
          flipTimer = setTimeout(() => {
            useGame.setState({ isAnimating: false })
            flipTimer = null
          }, FLIP_TOTAL_MS)

          if (gameStatus !== 'playing') {
            // D-06: stats written directly via storage lib on game end
            recordGameEnd(won, nextGuesses.length)
          }
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

      resetForNewDay: () => {
        set({
          dayIndex: getDayIndex(),
          guesses: [],
          currentGuess: '',
          gameStatus: 'playing' as GameStatus,
          toastMessage: null,
          isAnimating: false,
          rowShakeKey: 0,
          keyStatuses: {},
        })
      },
    }),
    {
      name: GAME_STATE_KEY,
      storage: debouncedStorage,
      version: SCHEMA_VERSION,
      // D-13: on schema version mismatch, treat as fresh start (return undefined → reset)
      migrate: (_persisted, version) => {
        if (version !== SCHEMA_VERSION) {
          console.warn(
            `longdle: game-state v${version} != app v${SCHEMA_VERSION}, resetting`
          )
          return undefined as unknown as GameState
        }
        return _persisted as GameState
      },
      // Partialize: persist only durable game-state.
      // Excluded (transient): toastMessage, isAnimating, rowShakeKey.
      // Do NOT persist `answer` (anti-pattern #1) — recomputed from dayIndex.
      partialize: (s) =>
        ({
          version: s.version,
          dayIndex: s.dayIndex,
          guesses: s.guesses,
          currentGuess: s.currentGuess,
          gameStatus: s.gameStatus,
          keyStatuses: s.keyStatuses,
        }) as unknown as GameState,
      // Pitfall 5: on rehydrate, if dayIndex is stale, reset session for today's puzzle
      onRehydrateStorage: () => (state) => {
        if (!state) return
        const todayIndex = getDayIndex()
        if (state.dayIndex !== todayIndex) {
          state.resetForNewDay?.()
        }
      },
    }
  )
)

// Toast helper — D-08: 1500 ms auto-dismiss; clears any prior timer
function showToast(msg: string, set: (partial: Partial<GameState>) => void): void {
  if (toastTimer) clearTimeout(toastTimer)
  set({ toastMessage: msg })
  toastTimer = setTimeout(() => {
    set({ toastMessage: null })
    toastTimer = null
  }, TOAST_MS)
}

// WR-04: exported toast trigger so callers outside the store (e.g. App.tsx share handler)
// can surface messages through the single <Toast /> component instead of maintaining
// a parallel toast state with its own div.
export function showGameToast(msg: string): void {
  showToast(msg, useGame.setState)
}

// Shake helper — D-09: increment rowShakeKey to retrigger CSS class via React key prop
function triggerShake(
  set: (partial: Partial<GameState>) => void,
  get: () => GameState
): void {
  if (shakeTimer) clearTimeout(shakeTimer)
  set({ rowShakeKey: get().rowShakeKey + 1 })
  // Phase 1: no @keyframes yet — the increment is plumbed for Phase 3
  shakeTimer = setTimeout(() => {
    shakeTimer = null
  }, SHAKE_MS)
}

// ─────────────────────────── settings store ───────────────────────────────

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      version: SCHEMA_VERSION,
      hardMode: false,
      colorblindMode: false,
      hasSeenHowToPlay: false,                          // D-12: default false for first-visit detection
      setHardMode: (v: boolean) => set({ hardMode: v }),
      setColorblindMode: (v: boolean) => set({ colorblindMode: v }),
      setHasSeenHowToPlay: (v: boolean) => set({ hasSeenHowToPlay: v }),
    }),
    {
      name: SETTINGS_KEY,
      storage: debouncedStorage,
      version: SCHEMA_VERSION,
      migrate: (_persisted, version) => {
        if (version !== SCHEMA_VERSION) {
          console.warn(
            `longdle: settings v${version} != app v${SCHEMA_VERSION}, resetting`
          )
          return undefined as unknown as SettingsState
        }
        return _persisted as SettingsState
      },
    }
  )
)
